import { LaneType, LaneContext, JobType, HookType, HookName } from './types';
import { Provided, Provider, Singleton, Inject } from 'typescript-ioc';
require('dotenv').config();

const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
const path = require('path');
const scheduler = require('node-schedule');


const appProvider: Provider = {
    get: () => { return new Core(); }
};

@Provided(appProvider)
@Singleton
export class Core {
    lanes: LaneType[] = [];
    jobs: JobType[] = [];
    hooks: HookType[] = [];
    appDir = path.dirname(require.main.filename);
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
        const packageJSON = this.parseJSON(`${this.appDir}/../../package.json`);
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

        await this.runHook('BEFORE_ALL', answer.lane);

        await this.takeLane(answer.lane);

        await this.runHook('AFTER_ALL', answer.lane);
    }

    async takeLane(lane: LaneType, ...args) {
        try {
            await this.runHook('BEFORE_EACH', lane);
            console.log(chalk.green(`taking lane ${lane.name}`));
            const ret = await this.instance[lane.name](this.getLaneContext(lane), ...args)
            await this.runHook('AFTER_EACH', lane);
            return ret;
        } catch (err) {
            const errorHook = this.hooks.find(hook => hook.name === 'ERROR');
            if (errorHook) {
                await errorHook.lane.lane(err, this.getLaneContext(lane), ...args);
            }
            throw new Error(err.message || err);
        }
    }

    async takeMultiple(lanes: LaneType[]) {
        await this.runHook('BEFORE_ALL', lanes[0]);
        await this.processAsyncArray(lanes, async (lane) => {
            await this.takeLane(lane);
        })
        await this.runHook('AFTER_ALL', lanes[lanes.length - 1]);
    }

    async processAsyncArray(array: any[], asyncFunc) {
        for (const el of array) {
            await asyncFunc(el);
        };
    }


    private getLaneContext(lane: LaneType): LaneContext {
        const context = {
            lane: lane,
            app: this,
        }
        return context;
    }

    async runHook(hookName: HookName, lane: LaneType) {
        const hooks = this.hooks.filter(hook => hook.name === hookName);
        if (hooks.length > 0) {
            await this.processAsyncArray(hooks, async (hook: HookType) => {
                await hook.lane.lane(this.getLaneContext(lane));
            })
        }
    }

    schedule(): JobType[] {
        this.jobs
            .forEach(job => {
                console.log('schedule job', job.name)
                const instance = scheduler.scheduleJob(job.schedule, (fireDate) => {
                    console.log('run scheduled lane ' + job.lane.name + ': ' + fireDate);
                    this.takeLane(job.lane)
                });
                job.scheduler = instance;
            });
        console.log('all jobs', this.jobs);
        return this.jobs;
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

            this.app.run();
        }
    }

    LaneDecorator(description: string) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const lanes: LaneType[] = this.app.lanes;
            lanes.push({ name: propertyKey, description: description, lane: target[propertyKey] });
        }
    }

    ScheduledDecorator(schedule: string | any) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const job: JobType = { name: propertyKey, lane: { name: propertyKey, description: null, lane: target[propertyKey] }, schedule: schedule, scheduler: null }
            this.app.jobs.push(job);
        }
    }

    HookDecorator(name: HookName) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const hook: HookType = { name: name, lane: { name: propertyKey, description: null, lane: target[propertyKey] } }
            this.app.hooks.push(hook);
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
