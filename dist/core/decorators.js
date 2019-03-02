"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_ioc_1 = require("typescript-ioc");
const core_1 = require("./core");
/**
 * adds metadata to the core application and runs it
 *
 * @class CoreFactory
 */
let CoreFactory = class CoreFactory {
    /**
     *
     *
     * @memberof CoreFactory
     */
    startApp(config) {
        if (config) {
            this.app.setConfig(config);
        }
        return (target) => {
            //this is called once the app is done loading
            this.app.init(target);
            this.app.run();
        };
    }
    /**
     * register lane metadata in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreFactory
     */
    registerLanes(description) {
        return (target, propertyKey, descriptor) => {
            const lanes = this.app.lanes;
            lanes.push({ name: propertyKey, description: description });
        };
    }
    /**
     * register scheduled lanes metadata in core application
     *
     * @param {(string | any)} schedule
     * @returns
     * @memberof CoreFactory
     */
    registerScheduled(schedule) {
        return (target, propertyKey, descriptor) => {
            const job = { name: propertyKey, lane: { name: propertyKey, description: null }, schedule: schedule, scheduler: null };
            this.app.jobs.push(job);
        };
    }
    /**
     * register hooks in core application
     *
     * @param {HookName} name
     * @returns
     * @memberof CoreFactory
     */
    registerHooks(name) {
        return (target, propertyKey, descriptor) => {
            const hook = { name: name, lane: { name: propertyKey, description: null } };
            this.app.hooks.push(hook);
        };
    }
    /**
     * register webhooks in core application
     *
     * @param {string} path
     * @returns
     * @memberof CoreFactory
     */
    registerWebhooks(path) {
        return (target, propertyKey, descriptor) => {
            const hook = { path: path, lane: { name: propertyKey, description: null } };
            this.app.webhooks.push(hook);
        };
    }
    /**
     * register loaded plugins
     *
     * @param {string} name
     * @returns
     * @memberof CoreFactory
     */
    registerPlugins(name) {
        return (target) => {
        };
    }
    /**
     *register actions in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreFactory
     */
    registerActions(description) {
        return (target, propertyKey, descriptor) => {
            this.app.actions.push({ name: propertyKey, plugin: target.constructor.name, description: description });
        };
    }
    /**
     * register params
     *
     * @param {(ParamOptions | string)} options
     * @returns {*}
     * @memberof CoreFactory
     */
    registerParams(options) {
        return (target, propertyKey, parameterIndex) => {
            if (typeof options === 'string') {
                const param = {
                    index: parameterIndex,
                    description: `Enter ${options}`,
                    name: options,
                    propertyKey: propertyKey
                };
                this.app.params.push(param);
            }
            else {
                const param = {
                    index: parameterIndex,
                    description: options.description || `Enter ${options.name}`,
                    name: options.name,
                    propertyKey: propertyKey,
                    optional: options.optional
                };
                this.app.params.push(param);
            }
        };
    }
    /**
     * register LaneContext injections
     *
     * @returns
     * @memberof CoreFactory
     */
    registerContextInjections() {
        return (target, propertyKey, parameterIndex) => {
            this.app.contexts.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
        };
    }
};
__decorate([
    typescript_ioc_1.Inject,
    __metadata("design:type", core_1.Core)
], CoreFactory.prototype, "app", void 0);
CoreFactory = __decorate([
    typescript_ioc_1.Singleton
], CoreFactory);
function App(config) {
    return new CoreFactory().startApp(config);
}
exports.App = App;
function Lane(description) {
    return new CoreFactory().registerLanes(description);
}
exports.Lane = Lane;
function Scheduled(schedule) {
    return new CoreFactory().registerScheduled(schedule);
}
exports.Scheduled = Scheduled;
function Hook(hook) {
    return new CoreFactory().registerHooks(hook);
}
exports.Hook = Hook;
function Webhook(path) {
    return new CoreFactory().registerWebhooks(path);
}
exports.Webhook = Webhook;
function Plugin(name) {
    return new CoreFactory().registerPlugins(name);
}
exports.Plugin = Plugin;
function Action(description) {
    return new CoreFactory().registerActions(description);
}
exports.Action = Action;
function param(options) {
    return new CoreFactory().registerParams(options);
}
exports.param = param;
function context() {
    return new CoreFactory().registerContextInjections();
}
exports.context = context;
