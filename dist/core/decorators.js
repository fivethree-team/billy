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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_ioc_1 = require("typescript-ioc");
const core_1 = require("./core");
const chalk = require('chalk');
/**
 * adds metadata to the core application and runs it
 *
 * @class CoreDecorators
 */
let CoreDecorators = class CoreDecorators {
    /**
     * add hooks to lanes and run the app
     *
     * @memberof CoreDecorators
     */
    startApp() {
        return (target) => {
            //this is called once the app is done loading
            this.app.instance = new target();
            this.app.lanes
                .forEach((lane, index) => __awaiter(this, void 0, void 0, function* () {
                const func = this.app.instance[lane.name].bind(this.app.instance);
                this.app.instance[lane.name] = (...args) => __awaiter(this, void 0, void 0, function* () {
                    yield this.app.runHook(this.app.getHook('BEFORE_EACH'));
                    console.log(chalk.green(`taking lane ${lane.name}`));
                    const ret = yield func(...args);
                    yield this.app.runHook(this.app.getHook('AFTER_EACH'));
                    return ret;
                });
            }));
            this.app.run();
        };
    }
    /**
     * register lane metadata in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreDecorators
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
     * @memberof CoreDecorators
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
     * @memberof CoreDecorators
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
     * @memberof CoreDecorators
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
     * @memberof CoreDecorators
     */
    registerPlugins(name) {
        return (target) => {
            this.app.plugins.push(name);
        };
    }
    /**
     *register actions in core application
     *
     * @param {string} description
     * @returns
     * @memberof CoreDecorators
     */
    registerActions(description) {
        return (target, propertyKey, descriptor) => {
            this.app.actions.push(propertyKey);
        };
    }
    /**
     * register params
     *
     * @param {(ParamOptions | string)} options
     * @returns {*}
     * @memberof CoreDecorators
     */
    registerParams(options) {
        return (target, propertyKey, parameterIndex) => {
            if (typeof options === 'string') {
                const param = {
                    index: parameterIndex,
                    description: `Enter ${options}`,
                    name: options,
                    lane: propertyKey
                };
                this.app.params.push(param);
            }
            else {
                const param = {
                    index: parameterIndex,
                    description: options.description || `Enter ${options.name}`,
                    name: options.name,
                    lane: propertyKey
                };
                this.app.params.push(param);
            }
        };
    }
    /**
     * register LaneContext injections
     *
     * @returns
     * @memberof CoreDecorators
     */
    registerContextInjections() {
        return (target, propertyKey, parameterIndex) => {
            this.app.meta.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
        };
    }
};
__decorate([
    typescript_ioc_1.Inject,
    __metadata("design:type", core_1.Core)
], CoreDecorators.prototype, "app", void 0);
CoreDecorators = __decorate([
    typescript_ioc_1.Singleton
], CoreDecorators);
//export Decorator factories here
function App() {
    return new CoreDecorators().startApp();
}
exports.App = App;
function Lane(description) {
    return new CoreDecorators().registerLanes(description);
}
exports.Lane = Lane;
function Scheduled(schedule) {
    return new CoreDecorators().registerScheduled(schedule);
}
exports.Scheduled = Scheduled;
function Hook(hook) {
    return new CoreDecorators().registerHooks(hook);
}
exports.Hook = Hook;
function Webhook(path) {
    return new CoreDecorators().registerWebhooks(path);
}
exports.Webhook = Webhook;
function Plugin(name) {
    return new CoreDecorators().registerPlugins(name);
}
exports.Plugin = Plugin;
function Action(description) {
    return new CoreDecorators().registerActions(description);
}
exports.Action = Action;
function param(options) {
    return new CoreDecorators().registerParams(options);
}
exports.param = param;
function context() {
    return new CoreDecorators().registerContextInjections();
}
exports.context = context;
