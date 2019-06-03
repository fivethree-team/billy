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
    startApp(config) {
        return (target) => {
            this.app.controller
                .init(target)
                .then(() => {
                this.app.run(config);
            });
        };
    }
    /**
     * register lane metadata in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreFactory
     */
    registerLane(options) {
        return (target, propertyKey, descriptor) => {
            if (typeof options === 'string') {
                this.app.controller.registerLane({ name: propertyKey, options: { description: options } });
            }
            else {
                this.app.controller.registerLane({ name: propertyKey, options: options });
            }
        };
    }
    /**
     * register scheduled lanes metadata in core application
     *
     * @param {(string | any)} schedule
     * @returns
     * @memberof CoreFactory
     */
    registerJob(schedule) {
        return (target, propertyKey, descriptor) => {
            const job = { name: propertyKey, lane: { name: propertyKey, options: { description: null } }, schedule: schedule, scheduler: null };
            this.app.controller.registerJob(job);
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
            const hook = { type: name, lane: { name: propertyKey, options: { description: name } } };
            this.app.controller.registerHook(hook);
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
            const hook = { path: path, lane: { name: propertyKey, options: { description: null } } };
            this.app.controller.registerWebHook(hook);
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
            this.app.controller.registerAction({ name: propertyKey, plugin: target.constructor.name, description: description });
        };
    }
    /**
     * register params
     *
     * @param {(ParamOptions | string)} options
     * @returns {*}
     * @memberof CoreFactory
     */
    registerParam(options) {
        return (target, propertyKey, parameterIndex) => {
            const param = {
                index: parameterIndex,
                name: options.name || propertyKey,
                propertyKey: propertyKey,
                options: options
            };
            this.app.controller.registerParam(param);
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
            this.app.controller.registerContext({ contextIndex: parameterIndex, propertyKey: propertyKey });
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
    return new CoreFactory().registerLane(description);
}
exports.Lane = Lane;
function Scheduled(schedule) {
    return new CoreFactory().registerJob(schedule);
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
    return new CoreFactory().registerParam(options);
}
exports.param = param;
function context() {
    return new CoreFactory().registerContextInjections();
}
exports.context = context;
