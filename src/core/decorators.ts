import {
    JobModel, HookModel, WebhookModel, ParamModel,
    ParamOptions, AppOptions, HookName, CommandOptions, ActionOptions
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
            .init(target, config)
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
            core.controller.commands.push({ name: propertyKey, options: { description: options } });
        } else {
            core.controller.commands.push({ name: propertyKey, options: options });
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
        core.controller.jobs.push(job);
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
        core.controller.hooks.push(h);
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
        core.controller.webhooks.push(hook);
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
export function Action(description: string | ActionOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (typeof description === 'string') {
            core.controller.actions.push({ name: propertyKey, plugin: target.constructor.name, description: description });
        } else {
            core.controller.actions.push({ name: propertyKey, plugin: target.constructor.name, options: description });
        }
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
        core.controller.params.push(param);
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
        core.controller.contexts.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
    }
}

/**
 *
 *
 * @export
 * @returns
 */
export function body() {
    return (target: Object, propertyKey: string, parameterIndex: number) => {
        core.controller.bodys.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
    }
}

/**
 *
 *
 * @export
 * @returns
 */
export function error() {
    return (target: Object, propertyKey: string, parameterIndex: number) => {
        core.controller.errors.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
    }
}
