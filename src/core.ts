import { LaneType, LaneContext, JobType, HookType, HookName, WebHookType } from './types';
import { Provided, Provider, Singleton, Inject } from 'typescript-ioc';
require('dotenv').config();

const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
const path = require('path');
const scheduler = require('node-schedule');
const express = require('express')();
const bodyParser = require('body-parser');
express.use(bodyParser.json());



const appProvider: Provider = {
    get: () => { return new Core(); }
};

@Provided(appProvider)
@Singleton
export class Core {
    lanes: LaneType[] = [];
    jobs: JobType[] = [];
    hooks: HookType[] = [];
    webhooks: WebHookType[] = [];
    appDir = path.resolve(path.dirname(require.main.filename) + '/../..');
    instance: any;

    async run() {
        const params = this.getParamLanes();
        if (params.length === 0) {
            await this.presentLanes();
        } else {
            await this.takeMultiple(params);
        }

    }

    private parseJSON(path): any {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }

    getParamLanes(): LaneType[] {
        const packageJSON = this.parseJSON(`${this.appDir}/package.json`);
        let program = commander
            .version(packageJSON.version);

        this.lanes
            .forEach(lane => {
                program = program.option(lane.name, lane.description)
            });

        program.parse(process.argv);

        const lanes: LaneType[] = []
        this.lanes
            .forEach(lane => {
                if (program[lane.name]) {
                    lanes.push(lane);
                }

            });

        return lanes;

    }

    async presentLanes() {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'lane',
                paginated: true,
                pageSize: 20,
                message: `${chalk.bold('Select Lane')}`,
                choices: this.lanes.map((lane, index) => {
                    return { name: `${chalk.underline.blueBright(`${index + 1}.${lane.name}:`)}\n${lane.description}`, value: lane };
                })
            }
        ]);

        await this.runHook(this.getHook('BEFORE_ALL').lane);

        await this.takeLane(answer.lane);

        await this.runHook(this.getHook('AFTER_ALL').lane);

    }

    async takeLane(lane: LaneType, ...args) {
        try {
            const ret = await this.instance[lane.name](this.getLaneContext(lane), ...args)
            return ret;
        } catch (err) {
            await this.runHook(this.getHook('ERROR').lane);

            console.error(err);
        }
    }

    async takeMultiple(lanes: LaneType[]) {
        await this.runHook(this.getHook('BEFORE_ALL').lane);
        await this.processAsyncArray(lanes, async (lane) => {
            await this.takeLane(lane);
        })
        await this.runHook(this.getHook('AFTER_ALL').lane);
    }

    async processAsyncArray(array: any[], asyncFunc) {
        for (const el of array) {
            await asyncFunc(el);
        };
    }

    getHook(type: 'BEFORE_ALL' | 'AFTER_ALL' | 'AFTER_EACH' | 'BEFORE_EACH' | 'ERROR'): HookType {
        return this.hooks.find(hook => hook.name === type);
    }


    getLaneContext(lane: LaneType): LaneContext {
        const context = {
            lane: lane,
            app: this,
        }
        return context;
    }

    async runHook(lane: LaneType, ...args) {
        if (!lane) {
            return;
        }
        try {
            const ret = await this.instance[lane.name](this.getLaneContext(lane), ...args)
            return ret;
        } catch (err) {
            await this.runHook(this.getHook('ERROR').lane, ...args);

            console.error(err);
        }
    }

    schedule(): JobType[] {
        this.jobs
            .forEach(job => {
                const instance = scheduler.scheduleJob(job.schedule, async (fireDate) => {
                    console.log('run scheduled lane ' + job.lane.name + ': ' + fireDate);
                    await this.runHook(this.getHook('BEFORE_ALL').lane);
                    await this.takeLane(job.lane);
                    await this.runHook(this.getHook('AFTER_ALL').lane);
                });
                job.scheduler = instance;
            });
        return this.jobs;
    }

    startWebhooks(port = 7777) {
        console.log(chalk.green(`starting webooks server on port ${port}...`));

        this.webhooks
            .forEach(hook => {
                express.post(hook.path, async (req, res) => {
                    console.log(`💌  running webhook ${hook.lane.name}`);
                    res.sendStatus(200)
                    await this.takeLane(hook.lane,req.body);
                })
            })

        express.listen(port);
    }

    cancelScheduled() {
        this.jobs
            .forEach(job => {
                job.scheduler.cancel();
            });
    }

}

export function App() {
    return new Decorators().AppDecorator();
}
export function Lane(description: string) {
    return new Decorators().LaneDecorator(description);
}

export function Scheduled(schedule: string | any) {
    return new Decorators().ScheduledDecorator(schedule);
}
export function Hook(hook: HookName) {
    return new Decorators().HookDecorator(hook);
}

export function Webhook(path: string) {
    return new Decorators().WebhookDecorator(path);
}

export function Plugin(name: string) {
    return new Decorators().PluginDecorator(name);
}
export function Action(description: string) {
    return new Decorators().ActionDecorator(description);
}

@Singleton
export class Decorators {

    @Inject app: Core;

    AppDecorator() {

        return (target) => {
            //this is called once the app is done loading
            this.app.instance = new target();
            this.app.lanes
                .forEach(async (lane: LaneType, index) => {
                    const func = this.app.instance[lane.name].bind(this.app.instance)
                    this.app.instance[lane.name] = async (...args) => {
                        await this.app.runHook(this.app.getHook('BEFORE_EACH').lane);
                        console.log(chalk.green(`taking lane ${lane.name}`));
                        await func(...args);
                        await this.app.runHook(this.app.getHook('AFTER_EACH').lane);
                    }

                });

            this.app.run();
        }
    }

    LaneDecorator(description: string) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const lanes: LaneType[] = this.app.lanes;
            lanes.push({ name: propertyKey, description: description });
        }
    }

    ScheduledDecorator(schedule: string | any) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const job: JobType = { name: propertyKey, lane: { name: propertyKey, description: null }, schedule: schedule, scheduler: null }
            this.app.jobs.push(job);
        }
    }

    HookDecorator(name: HookName) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const hook: HookType = { name: name, lane: { name: propertyKey, description: null } }
            this.app.hooks.push(hook);
        }
    }
    WebhookDecorator(path: string) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const hook: WebHookType = { path: path, lane: { name: propertyKey, description: null } }
            this.app.webhooks.push(hook);
        }
    }

    PluginDecorator(name: string) {
        return (target: Function) => {
        }
    }

    ActionDecorator(description: string) {
        return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {

        }
    }
}
