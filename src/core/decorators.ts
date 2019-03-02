import { Singleton, Inject } from "typescript-ioc";
import { LaneType, JobType, HookType, WebHookType, ParamType, ParamOptions, AppOptions, HookName } from "./types";
import { Core } from "./core";

/**
 * adds metadata to the core application and runs it
 *
 * @class CoreFactory
 */
@Singleton
class CoreFactory {

    @Inject app: Core;

    /**
     * 
     *
     * @memberof CoreFactory
     */
    startApp(config?: AppOptions) {

        if (config) {
            this.app.setConfig(config);
        }

        return (target) => {
            //this is called once the app is done loading
            this.app.init(target);
            this.app.run();
        }
    }

    /**
     * register lane metadata in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreFactory
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
     * @memberof CoreFactory
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
     * @memberof CoreFactory
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
     * @memberof CoreFactory
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
     * @memberof CoreFactory
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
     * @memberof CoreFactory
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
     * @memberof CoreFactory
     */
    registerParams(options: ParamOptions | string): any {
        return (target: Object, propertyKey: string, parameterIndex: number) => {
            if (typeof options === 'string') {
                const param: ParamType = {
                    index: parameterIndex,
                    description: `Enter ${options}`,
                    name: options,
                    propertyKey: propertyKey
                }
                this.app.params.push(param);
            } else {
                const param: ParamType = {
                    index: parameterIndex,
                    description: options.description || `Enter ${options.name}`,
                    name: options.name,
                    propertyKey: propertyKey,
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
     * @memberof CoreFactory
     */
    registerContextInjections() {
        return (target: Object, propertyKey: string, parameterIndex: number) => {
            this.app.contexts.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
        }
    }

}






export function App(config?: AppOptions) {
    return new CoreFactory().startApp(config);
}
export function Lane(description: string) {
    return new CoreFactory().registerLanes(description);
}

export function Scheduled(schedule: string | any) {
    return new CoreFactory().registerScheduled(schedule);
}
export function Hook(hook: HookName) {
    return new CoreFactory().registerHooks(hook);
}

export function Webhook(path: string) {
    return new CoreFactory().registerWebhooks(path);
}

export function Plugin(name: string) {
    return new CoreFactory().registerPlugins(name);
}
export function Action(description: string) {
    return new CoreFactory().registerActions(description);
}

export function param(options: ParamOptions | string) {
    return new CoreFactory().registerParams(options);
}
export function context() {
    return new CoreFactory().registerContextInjections();
}
