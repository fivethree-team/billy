import { ActionType, Pluginfile, PluginType, LaneType, LaneContext } from './types';
import { Provided, Provider, Singleton, Inject } from 'typescript-ioc';
require('dotenv').config();

const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
// const clear = require('clear');
const path = require('path');


const appProvider: Provider = {
    get: () => { return new Application(); }
};

@Provided(appProvider)
@Singleton
export class Application {
    plugins: PluginType[] = [];
    lanes: LaneType[] = [];
    appDir = path.dirname(require.main.filename);

    constructor() {
        this.load();
    }

    async load() {
        if (this.fileExists(`${this.appDir}/../plugins.json`)) {
            const file: Pluginfile = this.parseJSON(`${this.appDir}/../plugins.json`);
            this.plugins = this.loadPlugins(file.plugins);
        } else {
            console.error('no pluginfile found');
        }
    }

    async run() {
        if (this.fileExists(`${this.appDir}/../plugins.json`)) {
            const params = this.getParamLanes();
            if (params.length === 0) {
                await this.presentLanes();
            } else {
                await this.takeMultiple(params);
            }
        } else {
            console.log('no pluginfile found, aborting');
        }

    }

    private fileExists(path): boolean {
        return fs.existsSync(path);
    }

    private parseJSON(path): any {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }

    private loadPlugins(plugins: string[]): PluginType[] {
        const temp: PluginType[] = [];
        plugins
            .forEach((plugin: string) => {
                const p = new (require(`${this.appDir}/../node_modules/` + plugin)).default();
                temp.push(p);
            });
        return temp;
    }

    getParamLanes(): LaneType[] {
        const packageJSON = this.parseJSON(`${this.appDir}/../package.json`);
        let program = commander
            .version(packageJSON.version);

        this.lanes
            .forEach(lane => {
                program = program.option(lane.name, lane.description)
            });

        program.parse(process.argv);

        const lanes: LaneType[] = []
        const lane = this.lanes
            .forEach(lane => {
                if (program[lane.name]) {
                    lanes.push(lane);
                }
            });

        return lanes;

    }

    async presentLanes() {
        // clear();
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
        this.takeLane(answer.lane);
    }

    async takeLane(lane: LaneType) {
        console.log(chalk.green(`taking lane ${lane.name}`));
        await lane.lane(this.getLaneContext(lane), lane.args);
    }

    async takeMultiple(lanes: LaneType[]) {
        await this.processLanes(lanes, async (lane) => {
            await this.takeLane(lane);
        })
    }

    async processLanes(lanes: LaneType[], asyncFunc) {
        for (const lane of lanes) {
            await asyncFunc(lane);
        };
    }


    private getLaneContext(lane: LaneType): LaneContext {
        const context = {
            lane: lane,
            app: this,
        }
        const actions = this.plugins.map(plugin => plugin.actions).reduce((prev, curr) => [...prev, ...curr]);
        actions
            .forEach(action => context[action.key] = action.action);
        this.lanes
            .forEach(lane => context[lane.name] = lane.lane);

        return context;
    }
}

export function App() {
    return new Decorators().AppDecorator();
}
export function Lane(description: string) {
    return new Decorators().LaneDecorator(description);
}
export function Plugin(name: string) {
    return new Decorators().PluginDecorator(name);
}
export function Action(name: string) {
    return new Decorators().ActionDecorator(name);
}

@Singleton
export class Decorators {

    @Inject app: Application;

    AppDecorator() {

        return (target) => {
            //this is called once the app is done loading
            this.app.run();
        }
    }

    LaneDecorator(description: string) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const lanes: LaneType[] = this.app.lanes;
            lanes.push({ name: propertyKey, description: description, lane: target[propertyKey] });
        }
    }

    PluginDecorator(name: string) {

        return (target: Function) => {
            target.prototype['name'] = name;
        }
    }

    ActionDecorator(description: string) {
        return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
            const actions: ActionType[] = target['actions'] || [];
            actions.push({ description: description, key: propertyKey, action: target[propertyKey] })
            target['actions'] = actions;
        }
    }
}




