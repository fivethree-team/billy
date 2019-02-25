import { Singleton, Inject } from "typescript-ioc";
import { LaneType, JobType, HookName, HookType, WebHookType, ParamType, ParamOptions, AppOptions, HistoryEntry, ActionType } from "./types";
import { Core } from "./core";
const chalk = require('chalk');


/**
 * adds metadata to the core application and runs it
 *
 * @class CoreDecorators
 */
@Singleton
class CoreDecorators {

    @Inject app: Core;

    /**
     * add hooks to lanes and run the app
     *
     * @memberof CoreDecorators
     */
    startApp(config?: AppOptions) {

        if (config) {
            this.app.config.allowUnknownOptions = config.allowUnknownOptions;
            this.app.config.name = config.name;
            this.app.config.description = config.description;
        }

        return (target) => {
            //this is called once the app is done loading
            this.app.instance = new target();
            this.app.lanes
                .forEach(async (lane: LaneType, index) => {
                    const func = this.app.instance[lane.name].bind(this.app.instance)
                    this.app.instance[lane.name] = async (...args) => {
                        await this.app.runHook(this.app.getHook('BEFORE_EACH'));
                        console.log(chalk.green(`taking lane ${lane.name}`));


                        const historyEntry: HistoryEntry = {
                            type: 'Lane',
                            time: Date.now(),
                            name: lane.name,
                            description: lane.description
                        }

                        this.app.addToHistory(historyEntry)
                        const ret = await func(...args);
                        await this.app.runHook(this.app.getHook('AFTER_EACH'));
                        return ret;
                    }

                });

            this.app.actions
                .forEach(async (action: ActionType, index) => {
                    const func = this.app.instance[action.name].bind(this.app.instance)
                    this.app.instance[action.name] = async (...args) => {
                        const historyEntry: HistoryEntry = {
                            type: 'Action',
                            time: Date.now(),
                            name: action.name,
                            description: action.description
                        }

                        this.app.addToHistory(historyEntry)
                        const ret = await func(...args);
                        return ret;
                    }

                });

            this.app.run();
        }
    }

    /**
     * register lane metadata in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreDecorators
     */
    registerLanes(description: string) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const lanes: LaneType[] = this.app.lanes;
            lanes.push({ name: propertyKey, description: description });
        }
    }

    /**
     * register scheduled lanes metadata in core application
     *
     * @param {(string | any)} schedule
     * @returns
     * @memberof CoreDecorators
     */
    registerScheduled(schedule: string | any) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const job: JobType = { name: propertyKey, lane: { name: propertyKey, description: null }, schedule: schedule, scheduler: null }
            this.app.jobs.push(job);
        }
    }

    /**
     * register hooks in core application
     *
     * @param {HookName} name
     * @returns
     * @memberof CoreDecorators
     */
    registerHooks(name: HookName) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const hook: HookType = { name: name, lane: { name: propertyKey, description: null } }
            this.app.hooks.push(hook);
        }
    }
    /**
     * register webhooks in core application
     *
     * @param {string} path
     * @returns
     * @memberof CoreDecorators
     */
    registerWebhooks(path: string) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const hook: WebHookType = { path: path, lane: { name: propertyKey, description: null } }
            this.app.webhooks.push(hook);
        }
    }

    /**
     * register loaded plugins
     *
     * @param {string} name
     * @returns
     * @memberof CoreDecorators
     */
    registerPlugins(name: string) {

        return (target: Function) => {

        }
    }

    /**
     *register actions in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreDecorators
     */
    registerActions(description: string) {
        return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
            this.app.actions.push({ name: propertyKey, plugin: target.constructor.name, description: description });
        }
    }

    /**
     * register params
     *
     * @param {(ParamOptions | string)} options
     * @returns {*}
     * @memberof CoreDecorators
     */
    registerParams(options: ParamOptions | string): any {
        return (target: Object, propertyKey: string, parameterIndex: number) => {
            if (typeof options === 'string') {
                const param: ParamType = {
                    index: parameterIndex,
                    description: `Enter ${options}`,
                    name: options,
                    lane: propertyKey
                }
                this.app.params.push(param);
            } else {
                const param: ParamType = {
                    index: parameterIndex,
                    description: options.description || `Enter ${options.name}`,
                    name: options.name,
                    lane: propertyKey,
                    optional: options.optional
                }
                this.app.params.push(param);
            }
        }
    }

    /**
     * register LaneContext injections
     *
     * @returns
     * @memberof CoreDecorators
     */
    registerContextInjections() {
        return (target: Object, propertyKey: string, parameterIndex: number) => {
            this.app.meta.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
        }
    }

}



//export Decorator factories here

export function App(config?: AppOptions) {
    return new CoreDecorators().startApp(config);
}
export function Lane(description: string) {
    return new CoreDecorators().registerLanes(description);
}

export function Scheduled(schedule: string | any) {
    return new CoreDecorators().registerScheduled(schedule);
}
export function Hook(hook: HookName) {
    return new CoreDecorators().registerHooks(hook);
}

export function Webhook(path: string) {
    return new CoreDecorators().registerWebhooks(path);
}

export function Plugin(name: string) {
    return new CoreDecorators().registerPlugins(name);
}
export function Action(description: string) {
    return new CoreDecorators().registerActions(description);
}

export function param(options: ParamOptions | string) {
    return new CoreDecorators().registerParams(options);
}
export function context() {
    return new CoreDecorators().registerContextInjections();
}
