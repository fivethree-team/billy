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
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
// const clear = require('clear');
const path = require('path');
const appProvider = {
    get: () => { return new Application(); }
};
let Application = class Application {
    constructor() {
        this.plugins = [];
        this.lanes = [];
        this.appDir = path.dirname(require.main.filename);
        this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fileExists(`${this.appDir}/../plugins.json`)) {
                const file = this.parseJSON(`${this.appDir}/../plugins.json`);
                this.plugins = this.loadPlugins(file.plugins);
            }
            else {
                console.error('no pluginfile found');
            }
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fileExists(`${this.appDir}/../plugins.json`)) {
                const params = this.getParamLanes();
                if (params.length === 0) {
                    yield this.presentLanes();
                }
                else {
                    yield this.takeMultiple(params);
                }
            }
            else {
                console.log('no pluginfile found, aborting');
            }
        });
    }
    fileExists(path) {
        return fs.existsSync(path);
    }
    parseJSON(path) {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
    loadPlugins(plugins) {
        const temp = [];
        plugins
            .forEach((plugin) => {
            const p = new (require(`${this.appDir}/../node_modules/` + plugin)).default();
            console.log(p);
            temp.push(p);
        });
        return temp;
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
        const lane = this.lanes
            .forEach(lane => {
            if (program[lane.name]) {
                lanes.push(lane);
            }
        });
        return lanes;
    }
    presentLanes() {
        return __awaiter(this, void 0, void 0, function* () {
            // clear();
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
            this.takeLane(answer.lane);
        });
    }
    takeLane(lane) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk.green(`taking lane ${lane.name}`));
            yield lane.lane(this.getLaneContext(lane), lane.args);
        });
    }
    takeMultiple(lanes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.processLanes(lanes, (lane) => __awaiter(this, void 0, void 0, function* () {
                yield this.takeLane(lane);
            }));
        });
    }
    processLanes(lanes, asyncFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const lane of lanes) {
                yield asyncFunc(lane);
            }
            ;
        });
    }
    getLaneContext(lane) {
        const context = {
            lane: lane,
            app: this,
        };
        const actions = this.plugins.map(plugin => plugin.actions).reduce((prev, curr) => [...prev, ...curr]);
        actions
            .forEach(action => context[action.name] = action.action);
        this.lanes
            .forEach(lane => context[lane.name] = lane.lane);
        return context;
    }
};
Application = __decorate([
    typescript_ioc_1.Provided(appProvider),
    typescript_ioc_1.Singleton,
    __metadata("design:paramtypes", [])
], Application);
exports.Application = Application;
function App() {
    return new Decorators().AppDecorator();
}
exports.App = App;
function Lane(description) {
    return new Decorators().LaneDecorator(description);
}
exports.Lane = Lane;
function Plugin(name) {
    return new Decorators().PluginDecorator(name);
}
exports.Plugin = Plugin;
function Action(name) {
    return new Decorators().ActionDecorator(name);
}
exports.Action = Action;
let Decorators = class Decorators {
    AppDecorator() {
        return (target) => {
            //this is called once the app is done loading
            this.app.run();
        };
    }
    LaneDecorator(description) {
        return (target, propertyKey, descriptor) => {
            const lanes = this.app.lanes;
            lanes.push({ name: propertyKey, description: description, lane: target[propertyKey] });
        };
    }
    PluginDecorator(name) {
        return (target) => {
            target.prototype['name'] = name;
        };
    }
    ActionDecorator(name) {
        return function (target, propertyKey, descriptor) {
            const actions = target['actions'] || [];
            actions.push({ name: name, key: propertyKey, action: target[propertyKey] });
            target['actions'] = actions;
        };
    }
};
__decorate([
    typescript_ioc_1.Inject,
    __metadata("design:type", Application)
], Decorators.prototype, "app", void 0);
Decorators = __decorate([
    typescript_ioc_1.Singleton
], Decorators);
exports.Decorators = Decorators;
