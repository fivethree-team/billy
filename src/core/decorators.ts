import {
    JobModel, HookModel, WebhookModel, ParamModel,
    ParamOptions, AppOptions, HookName, CommandOptions
} from "../types";
import { Core } from "./core";

const core = new Core();

/**
 *
 *
 * @export
 * @param {AppOptions} [config]
 * @returns
 */
export function App(config?: AppOptions) {
    return (target) => {
        core.controller
            .init(target)
            .then(() => {
                core.run(config);
            })
    }
}
/**
 *
 *
 * @export
 * @param {(string | CommandOptions)} options
 * @returns
 */
export function Command(options: string | CommandOptions) {
    return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (typeof options === 'string') {
            core.controller.registerLane({ name: propertyKey, options: { description: options } });
        } else {
            core.controller.registerLane({ name: propertyKey, options: options });
        }
    }
}

/**
 *
 *
 * @export
 * @param {(string | any)} schedule
 * @returns
 */
export function Job(schedule: string | any) {
    return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
        const job: JobModel = { name: propertyKey, lane: { name: propertyKey, options: { description: null } }, schedule: schedule, scheduler: null }
        core.controller.registerJob(job);
    }
}
/**
 *
 *
 * @export
 * @param {HookName} hook
 * @returns
 */
export function Hook(hook: HookName) {
    return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
        const h: HookModel = { type: hook, lane: { name: propertyKey, options: { description: hook } } }
        core.controller.registerHook(h);
    }
}

/**
 *
 *
 * @export
 * @param {string} path
 * @returns
 */
export function Webhook(path: string) {
    return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
        const hook: WebhookModel = { path: path, lane: { name: propertyKey, options: { description: null } } }
        core.controller.registerWebHook(hook);
    }
}

/**
 *
 *
 * @export
 * @param {string} name
 * @returns
 */
export function Plugin(name: string) {
    return (target: Function) => {

    }
}
/**
 *
 *
 * @export
 * @param {string} description
 * @returns
 */
export function Action(description: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        core.controller.registerAction({ name: propertyKey, plugin: target.constructor.name, description: description });
    }
}

/**
 *
 *
 * @export
 * @param {ParamOptions} options
 * @returns
 */
export function param(options: ParamOptions) {
    return (target: Object, propertyKey: string, parameterIndex: number) => {

        const param: ParamModel = {
            index: parameterIndex,
            name: options.name || propertyKey,
            propertyKey: propertyKey,
            options: options
        }
        core.controller.registerParam(param);
    }
}
/**
 *
 *
 * @export
 * @returns
 */
export function context() {
    return (target: Object, propertyKey: string, parameterIndex: number) => {
        core.controller.registerContext({ contextIndex: parameterIndex, propertyKey: propertyKey });
    }
}
