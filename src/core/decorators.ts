import { Singleton, Inject } from "typescript-ioc";
import { JobModel, HookModel, WebHookModel, ParamModel, ParamOptions, AppOptions, HookName, LaneOptions } from "./types";
import { Core } from "./core";

/**
 * adds metadata to the core application and runs it
 *
 * @class CoreFactory
 */
@Singleton
class CoreFactory {

    @Inject app: Core;

    startApp(config?: AppOptions) {

        return (target) => {
            this.app.controller
                .init(target)
                .then(() => {
                    this.app.run(config);
                })
        }
    }

    /**
     * register lane metadata in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreFactory
     */
    registerLane(options: string | LaneOptions) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            if (typeof options === 'string') {
                this.app.controller.registerLane({ name: propertyKey, options: { description: options } });
            } else {
                this.app.controller.registerLane({ name: propertyKey, options: options });
            }
        }
    }

    /**
     * register scheduled lanes metadata in core application
     *
     * @param {(string | any)} schedule
     * @returns
     * @memberof CoreFactory
     */
    registerJob(schedule: string | any) {
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
            const job: JobModel = { name: propertyKey, lane: { name: propertyKey, options: { description: null } }, schedule: schedule, scheduler: null }
            this.app.controller.registerJob(job);
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
            const hook: HookModel = { type: name, lane: { name: propertyKey, options: { description: name } } }
            this.app.controller.registerHook(hook);
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
            const hook: WebHookModel = { path: path, lane: { name: propertyKey, options: { description: null } } }
            this.app.controller.registerWebHook(hook);
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
            this.app.controller.registerAction({ name: propertyKey, plugin: target.constructor.name, description: description });
        }
    }

    /**
     * register params
     *
     * @param {(ParamOptions | string)} options
     * @returns {*}
     * @memberof CoreFactory
     */
    registerParam(options: ParamOptions): any {
        return (target: Object, propertyKey: string, parameterIndex: number) => {

            const param: ParamModel = {
                index: parameterIndex,
                name: options.name || propertyKey,
                propertyKey: propertyKey,
                options: options
            }
            this.app.controller.registerParam(param);
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
            this.app.controller.registerContext({ contextIndex: parameterIndex, propertyKey: propertyKey });
        }
    }

}

export function App(config?: AppOptions) {
    return new CoreFactory().startApp(config);
}
export function Lane(description: string | LaneOptions) {
    return new CoreFactory().registerLane(description);
}

export function Scheduled(schedule: string | any) {
    return new CoreFactory().registerJob(schedule);
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

export function param(options: ParamOptions) {
    return new CoreFactory().registerParam(options);
}
export function context() {
    return new CoreFactory().registerContextInjections();
}
