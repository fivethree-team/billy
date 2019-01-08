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
require('dotenv').config();
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
const path = require('path');
const scheduler = require('node-schedule');
const appProvider = {
    get: () => { return new Core(); }
};
let Core = class Core {
    constructor() {
        this.lanes = [];
        this.jobs = [];
        this.hooks = [];
        this.appDir = path.dirname(require.main.filename);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.getParamLanes();
            if (params.length === 0) {
                yield this.presentLanes();
            }
            else {
                yield this.takeMultiple(params);
            }
        });
    }
    parseJSON(path) {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
    getParamLanes() {
        const packageJSON = this.parseJSON(`${this.appDir}/../package.json`);
        let program = commander
            .version(packageJSON.version);
        this.lanes
            .forEach(lane => {
            program = program.option(lane.name, lane.description);
        });
        program.parse(process.argv);
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
            const answer = yield inquirer.prompt([
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
            yield this.runHook('BEFORE_ALL', answer.lane);
            yield this.takeLane(answer.lane);
            yield this.runHook('AFTER_ALL', answer.lane);
        });
    }
    takeLane(lane, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.runHook('BEFORE_EACH', lane);
                console.log(chalk.green(`taking lane ${lane.name}`));
                const ret = yield this.instance[lane.name](this.getLaneContext(lane), ...args);
                yield this.runHook('AFTER_EACH', lane);
                return ret;
            }
            catch (err) {
                const errorHook = this.hooks.find(hook => hook.name === 'ERROR');
                if (errorHook) {
                    yield errorHook.lane.lane(err, this.getLaneContext(lane), ...args);
                }
                throw new Error(err.message || err);
            }
        });
    }
    takeMultiple(lanes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runHook('BEFORE_ALL', lanes[0]);
            yield this.processAsyncArray(lanes, (lane) => __awaiter(this, void 0, void 0, function* () {
                yield this.takeLane(lane);
            }));
            yield this.runHook('AFTER_ALL', lanes[lanes.length - 1]);
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
    getLaneContext(lane) {
        const context = {
            lane: lane,
            app: this,
        };
        return context;
    }
    runHook(hookName, lane) {
        return __awaiter(this, void 0, void 0, function* () {
            const hooks = this.hooks.filter(hook => hook.name === hookName);
            if (hooks.length > 0) {
                yield this.processAsyncArray(hooks, (hook) => __awaiter(this, void 0, void 0, function* () {
                    yield hook.lane.lane(this.getLaneContext(lane));
                }));
            }
        });
    }
    schedule() {
        this.jobs
            .forEach(job => {
            console.log('schedule job', job.name);
            const instance = scheduler.scheduleJob(job.schedule, (fireDate) => {
                console.log('run scheduled lane ' + job.lane.name + ': ' + fireDate);
                this.takeLane(job.lane);
            });
            job.scheduler = instance;
        });
        console.log('all jobs', this.jobs);
        return this.jobs;
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
function Plugin(name) {
    return new Decorators().PluginDecorator(name);
}
exports.Plugin = Plugin;
function Action(description) {
    return new Decorators().ActionDecorator(description);
}
exports.Action = Action;
let Decorators = class Decorators {
    AppDecorator() {
        return (target) => {
            //this is called once the app is done loading
            this.app.instance = new target();
            this.app.run();
        };
    }
    LaneDecorator(description) {
        return (target, propertyKey, descriptor) => {
            const lanes = this.app.lanes;
            lanes.push({ name: propertyKey, description: description, lane: target[propertyKey] });
        };
    }
    ScheduledDecorator(schedule) {
        return (target, propertyKey, descriptor) => {
            const job = { name: propertyKey, lane: { name: propertyKey, description: null, lane: target[propertyKey] }, schedule: schedule, scheduler: null };
            this.app.jobs.push(job);
        };
    }
    HookDecorator(name) {
        return (target, propertyKey, descriptor) => {
            const hook = { name: name, lane: { name: propertyKey, description: null, lane: target[propertyKey] } };
            this.app.hooks.push(hook);
        };
    }
    PluginDecorator(name) {
        return (target) => {
        };
    }
    ActionDecorator(description) {
        return function (target, propertyKey, descriptor) {
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
