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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_ioc_1 = require("typescript-ioc");
const cli_table_1 = __importDefault(require("cli-table"));
require('dotenv').config();
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
const path = require('path');
const scheduler = require('node-schedule');
const express = require('express')();
const bodyParser = require('body-parser');
express.use(bodyParser.json());
const appProvider = {
    get: () => { return new Core(); }
};
let Core = class Core {
    constructor() {
        this.lanes = [];
        this.jobs = [];
        this.hooks = [];
        this.webhooks = [];
        this.actions = [];
        this.plugins = [];
        this.params = [];
        this.appDir = path.resolve(path.dirname(require.main.filename) + '/../..');
        this.meta = [];
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const program = this.initProgram();
            console.log(program);
            this.initParameters(program);
            const lanes = this.getLanesFromCommand(program);
            if (lanes.length === 0) {
                yield this.presentLanes();
            }
            else {
                yield this.takeMultiple(lanes);
            }
        });
    }
    initParameters(program) {
        this.params
            .forEach(param => {
            if (program[param.name] && typeof program[param.name] !== 'function') {
                param.value = program[param.name];
            }
        });
    }
    initProgram() {
        const packageJSON = this.parseJSON(`${this.appDir}/package.json`);
        let program = commander
            .version(packageJSON.version, '-v, --version');
        this.params.forEach(param => {
            program = program.option(`--${param.name} [var]`, param.description);
        });
        this.lanes
            .forEach(lane => {
            program = program.option(lane.name, lane.description);
        });
        program.parse(process.argv);
        return program;
    }
    parseJSON(path) {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
    getLanesFromCommand(program) {
        const lanes = [];
        this.lanes
            .forEach(lane => {
            if (program[lane.name]) {
                lanes.push(lane);
            }
        });
        return lanes;
    }
    presentLanes() {
        return __awaiter(this, void 0, void 0, function* () {
            const table = new cli_table_1.default({
                head: ["Number", "Lane", "Description"],
                chars: {
                    'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
                    'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
                    'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
                    'right': '║', 'right-mid': '╢', 'middle': '│'
                }
            });
            this.lanes.forEach((lane, index) => table.push([chalk.blueBright(`${index + 1}`), lane.name, lane.description]));
            console.log(table.toString());
            const lane = (yield inquirer.prompt([{
                    type: 'input',
                    name: 'lane',
                    message: 'please enter number or lane name',
                    validate: (input) => {
                        if (!!input && isNaN(input)) {
                            if (this.lanes.some(lane => lane.name === input)) {
                                return true;
                            }
                            else {
                                console.log(chalk.red(`  | couldn't find lane with name ${input}`));
                                return false;
                            }
                        }
                        else {
                            if (+input > 0 && +input <= this.lanes.length) {
                                return true;
                            }
                            else {
                                console.log(chalk.red('  | specify a number between 1 and ' + this.lanes.length));
                                return false;
                            }
                        }
                    }
                }])).lane;
            yield this.runHook(this.getHook('BEFORE_ALL'));
            if (isNaN(lane)) {
                yield this.takeLane(this.lanes.find(l => l.name === lane));
            }
            else {
                yield this.takeLane(this.lanes[lane - 1]);
            }
            yield this.runHook(this.getHook('AFTER_ALL'));
        });
    }
    takeLane(lane, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = yield this.getArgs(lane);
            try {
                const ret = yield this.instance[lane.name](...params, ...args);
                return ret;
            }
            catch (err) {
                yield this.runHook(this.getHook('ERROR'), ...args, err);
                console.error(err);
            }
        });
    }
    getArgs(lane) {
        return __awaiter(this, void 0, void 0, function* () {
            const contextMeta = this.meta.find(m => m.propertyKey === lane.name);
            const params = yield this.resolveParams(lane);
            const sortedParams = [];
            params.forEach(param => {
                sortedParams.push(param.value);
            });
            if (contextMeta) {
                sortedParams.splice(contextMeta.contextIndex, 0, this.getLaneContext(lane));
            }
            return sortedParams;
        });
    }
    resolveParams(lane) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.params
                .filter(param => param.lane === lane.name)
                .sort((a, b) => {
                return a.index - b.index;
            });
            if (params.length === 0) {
                return [];
            }
            let ret = [];
            yield this.processAsyncArray(params, (p) => __awaiter(this, void 0, void 0, function* () {
                if (p.value) {
                    return ret.push(p);
                }
                const value = (yield inquirer.prompt([{
                        name: 'answer',
                        message: p.description,
                    }
                ])).answer;
                p.value = value;
                ret.push(p);
            }));
            return ret;
        });
    }
    takeMultiple(lanes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runHook(this.getHook('BEFORE_ALL'));
            yield this.processAsyncArray(lanes, (lane) => __awaiter(this, void 0, void 0, function* () {
                yield this.takeLane(lane);
            }));
            yield this.runHook(this.getHook('AFTER_ALL'));
        });
    }
    processAsyncArray(array, asyncFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const el of array) {
                yield asyncFunc(el);
            }
            ;
        });
    }
    getHook(type) {
        const hook = this.hooks.find(hook => hook.name === type);
        return hook && hook.lane ? hook.lane : null;
    }
    getLaneContext(lane) {
        const context = {
            lane: lane,
            app: this,
        };
        return context;
    }
    runHook(lane, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lane) {
                return;
            }
            const params = yield this.getArgs(lane);
            try {
                const ret = yield this.instance[lane.name](...params, ...args);
                return ret;
            }
            catch (err) {
                yield this.runHook(this.getHook('ERROR'), ...args, err);
                console.error(err);
            }
        });
    }
    schedule() {
        this.jobs
            .forEach(job => {
            const instance = scheduler.scheduleJob(job.schedule, (fireDate) => __awaiter(this, void 0, void 0, function* () {
                console.log('run scheduled lane ' + job.lane.name + ': ' + fireDate);
                yield this.runHook(this.getHook('BEFORE_ALL'));
                yield this.takeLane(job.lane);
                yield this.runHook(this.getHook('AFTER_ALL'));
            }));
            job.scheduler = instance;
        });
        return this.jobs;
    }
    startWebhooks(port = 7777) {
        console.log(chalk.green(`starting webooks server on port ${port}...`));
        this.webhooks
            .forEach(hook => {
            express.post(hook.path, (req, res) => __awaiter(this, void 0, void 0, function* () {
                console.log(`💌  running webhook ${hook.lane.name}`);
                res.sendStatus(200);
                yield this.takeLane(hook.lane, req.body);
            }));
        });
        express.listen(port);
    }
    cancelScheduled() {
        this.jobs
            .forEach(job => {
            job.scheduler.cancel();
        });
    }
};
Core = __decorate([
    typescript_ioc_1.Provided(appProvider),
    typescript_ioc_1.Singleton
], Core);
exports.Core = Core;
function App() {
    return new Decorators().AppDecorator();
}
exports.App = App;
function Lane(description) {
    return new Decorators().LaneDecorator(description);
}
exports.Lane = Lane;
function Scheduled(schedule) {
    return new Decorators().ScheduledDecorator(schedule);
}
exports.Scheduled = Scheduled;
function Hook(hook) {
    return new Decorators().HookDecorator(hook);
}
exports.Hook = Hook;
function Webhook(path) {
    return new Decorators().WebhookDecorator(path);
}
exports.Webhook = Webhook;
function Plugin(name) {
    return new Decorators().PluginDecorator(name);
}
exports.Plugin = Plugin;
function Action(description) {
    return new Decorators().ActionDecorator(description);
}
exports.Action = Action;
function Param(param) {
    return new Decorators().ParamDecorator(param);
}
exports.Param = Param;
function param(options) {
    return new Decorators().paramDecorator(options);
}
exports.param = param;
function context() {
    return new Decorators().contextDecorator();
}
exports.context = context;
let Decorators = class Decorators {
    AppDecorator() {
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
    LaneDecorator(description) {
        return (target, propertyKey, descriptor) => {
            const lanes = this.app.lanes;
            lanes.push({ name: propertyKey, description: description });
        };
    }
    ScheduledDecorator(schedule) {
        return (target, propertyKey, descriptor) => {
            const job = { name: propertyKey, lane: { name: propertyKey, description: null }, schedule: schedule, scheduler: null };
            this.app.jobs.push(job);
        };
    }
    HookDecorator(name) {
        return (target, propertyKey, descriptor) => {
            const hook = { name: name, lane: { name: propertyKey, description: null } };
            this.app.hooks.push(hook);
        };
    }
    WebhookDecorator(path) {
        return (target, propertyKey, descriptor) => {
            const hook = { path: path, lane: { name: propertyKey, description: null } };
            this.app.webhooks.push(hook);
        };
    }
    PluginDecorator(name) {
        return (target) => {
            this.app.plugins.push(name);
        };
    }
    ActionDecorator(description) {
        return (target, propertyKey, descriptor) => {
            this.app.actions.push(propertyKey);
        };
    }
    ParamDecorator(param) {
        return (target, propertyKey, descriptor) => {
            param.lane = propertyKey;
            this.app.params.push(param);
        };
    }
    paramDecorator(options) {
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
    contextDecorator() {
        return (target, propertyKey, parameterIndex) => {
            this.app.meta.push({ contextIndex: parameterIndex, propertyKey: propertyKey });
        };
    }
};
__decorate([
    typescript_ioc_1.Inject,
    __metadata("design:type", Core)
], Decorators.prototype, "app", void 0);
Decorators = __decorate([
    typescript_ioc_1.Singleton
], Decorators);
exports.Decorators = Decorators;
