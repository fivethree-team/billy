"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
const types_1 = require("./types");
const typescript_ioc_1 = require("typescript-ioc");
const cli_table_1 = __importDefault(require("cli-table"));
const util_1 = require("./util");
const api_1 = require("./api");
require('dotenv').config();
const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
const path = require('path');
const appProvider = {
    get: () => { return new Core(); }
};
/**
 * The Core Application
 *
 * The Core Class holds all the meta data and
 * is responsible for coordinating the lanes
 *
 * @export
 * @class Core
 */
let Core = class Core {
    /**
     * The Core Application
     *
     * The Core Class holds all the meta data and
     * is responsible for coordinating the lanes
     *
     * @export
     * @class Core
     */
    constructor() {
        this.lanes = [];
        this.jobs = [];
        this.hooks = [];
        this.webhooks = [];
        this.actions = [];
        this.params = [];
        this.contexts = [];
        this.appDir = path.resolve(path.dirname(require.main.filename) + '/../..');
        this.config = {};
    }
    /**
     * initialize the @App Decorator target (application)
     *
     * @param {*} target @App Decorator target
     * @memberof Core
     */
    init(target) {
        this.application = new target();
        this.initLanes();
        this.initActions();
    }
    /**
     *  * wrap every lane with the before each and after each hook.
     *  * add taking lane output before execution.
     *  * add to history
     *
     * @private
     * @memberof Core
     */
    initLanes() {
        this.lanes
            .forEach((lane) => __awaiter(this, void 0, void 0, function* () {
            const originalLane = this.application[lane.name].bind(this.application);
            //replace original Lane with wrapped one
            this.application[lane.name] = (...args) => __awaiter(this, void 0, void 0, function* () {
                yield this.runHook(this.getHook('BEFORE_EACH'));
                console.log(chalk.green(`taking lane ${lane.name}`));
                const historyEntry = {
                    type: 'Lane',
                    time: Date.now(),
                    name: lane.name,
                    description: lane.description
                };
                this.addToHistory(historyEntry);
                const ret = yield originalLane(...args);
                yield this.runHook(this.getHook('AFTER_EACH'));
                return ret;
            });
        }));
    }
    /**
    *  * add to history
    *
    * @private
    * @memberof Core
    */
    initActions() {
        this.actions
            .forEach((action) => __awaiter(this, void 0, void 0, function* () {
            const originalAction = this.application[action.name].bind(this.application);
            this.application[action.name] = (...args) => {
                const historyEntry = {
                    type: 'Action',
                    time: Date.now(),
                    name: action.name,
                    description: action.description
                };
                this.addToHistory(historyEntry);
                return originalAction(...args);
            };
        }));
    }
    /**
     * This is called once the AppDecorator is assigned.
     * At this point all the lanes, plugins and params have been loaded into core
     *
     * @memberof Core
     */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.history = new types_1.History();
            const startupHook = this.getHook('ON_START');
            this.program = this.initProgram(this.config.allowUnknownOptions);
            this.initParameters(this.program);
            const lanes = this.getLanesFromCommand(this.program);
            if (lanes.length === 0) {
                if (startupHook) {
                    // handle root command yourself instead of displaying the lane prompt
                    yield this.runHook(startupHook);
                }
                else {
                    yield this.promptLaneAndRun();
                }
            }
            else {
                yield this.runMultipleLanes(lanes);
            }
        });
    }
    /**
     * This will initialize the cli using commander.js
     *
     * The params (--name) and lanes (lane) will be added to the programs options
     *
     *
     * @private
     * @returns returns the commander.js program
     * @memberof Core
     */
    initProgram(allowUnknownOptions = false) {
        const packageJSON = util_1.parseJSON(`${this.appDir}/package.json`);
        let program = commander
            .version(packageJSON.version, '-v, --version');
        allowUnknownOptions ? program.allowUnknownOption() : false;
        this.lanes
            .forEach(lane => program = program.option(lane.name, lane.description));
        this.params
            .forEach(param => program = program.option(`--${param.name} [var]`, param.description));
        program.parse(process.argv);
        return program;
    }
    /**
    * Present lane selection table and wait for user input. Then start the program.
    *
    * @memberof Core
    */
    promptLaneAndRun() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.presentLanes();
            const lane = yield this.promptLane();
            yield this.startProgram(lane);
        });
    }
    /**
     * parsing of the cli parameters passed via --VARIABLE (ex. --name Gary).
     * If values have been passed in, the values will be stored in the ParamType array
     *
     * @private
     * @param {*} program commander.js instance
     * @memberof Core
     */
    initParameters(program) {
        this.params
            .forEach(param => {
            const hasValue = program[param.name] && typeof program[param.name] !== 'function';
            if (hasValue) {
                param.value = program[param.name];
            }
        });
    }
    /**
     * parses the command line options and returns all the lanes that were passed in
     *
     * @private
     * @param {*} program
     * @returns {LaneType[]} Lanes to be run
     * @memberof Core
     */
    getLanesFromCommand(program) {
        const lanes = [];
        this.lanes
            .forEach(lane => program[lane.name] ? lanes.push(lane) : false);
        return lanes;
    }
    /**
     * Print the table for all Lanes
     *
     * @private
     * @memberof Core
     */
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
        });
    }
    /**
     * starts the lane from index or name
     *
     * @private
     * @param {*} lane
     * @memberof Core
     */
    startProgram(lane) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runHook(this.getHook('BEFORE_ALL'));
            if (isNaN(lane)) {
                yield this.runLane(this.lanes.find(l => l.name === lane));
            }
            else {
                yield this.runLane(this.lanes[lane - 1]);
            }
            yield this.runHook(this.getHook('AFTER_ALL'));
        });
    }
    /**
     * prompts the user to input a lane index or lane name
     *
     * @private
     * @returns a lane specified as index or name
     * @memberof Core
     */
    promptLane() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield inquirer.prompt([{
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
        });
    }
    /**
     * take a lane, when an error is thrown inside a lane, the error hook (if specified) will be run
     *
     * @param {LaneType} lane
     * @param {*} args
     * @returns returns the lanes return value as Promise
     * @memberof Core
     */
    runLane(lane, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = yield this.getArgs(lane);
            try {
                const ret = yield this.application[lane.name](...params, ...args);
                return ret;
            }
            catch (err) {
                yield this.runHook(this.getHook('ERROR'), ...args, err);
                console.error(err);
            }
        });
    }
    /**
     *
     * @private
     * @param {LaneType} lane
     * @returns the params, sorted as they are injected into the lane via @param and @context
     * @memberof Core
     */
    getArgs(method) {
        return __awaiter(this, void 0, void 0, function* () {
            const contextMeta = this.contexts.find(m => m.propertyKey === method.name);
            const params = yield this.resolveParams(method);
            const sortedParams = [];
            params.forEach(param => {
                sortedParams.push(param.value);
            });
            if (contextMeta) {
                sortedParams.splice(contextMeta.contextIndex, 0, this.getContext(method));
            }
            return sortedParams;
        });
    }
    /**
     * gets missing required param values via prompting the user,
     * skips optional if empty
     *
     * @private
     * @param {LaneType} lane
     * @returns {Promise<ParamType[]>}
     * @memberof Core
     */
    resolveParams(method) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.params
                .filter(param => param.propertyKey === method.name)
                .sort((a, b) => {
                return a.index - b.index;
            });
            if (params.length === 0) {
                return [];
            }
            let ret = [];
            yield util_1.processAsyncArray(params, (p) => __awaiter(this, void 0, void 0, function* () {
                if (p.value) {
                    return ret.push(p);
                }
                if (p.optional) {
                    p.value = null;
                }
                else {
                    const value = (yield inquirer.prompt([{
                            name: 'answer',
                            message: p.description,
                        }
                    ])).answer;
                    p.value = value;
                }
                ret.push(p);
            }));
            return ret;
        });
    }
    /**
     * takes a LaneType array and runs them sequentially
     *
     * @private
     * @param {LaneType[]} lanes
     * @memberof Core
     */
    runMultipleLanes(lanes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runHook(this.getHook('BEFORE_ALL'));
            yield util_1.processAsyncArray(lanes, (lane) => __awaiter(this, void 0, void 0, function* () {
                yield this.runLane(lane);
            }));
            yield this.runHook(this.getHook('AFTER_ALL'));
        });
    }
    /**
     *
     *
     * @param {('BEFORE_ALL' | 'AFTER_ALL' | 'AFTER_EACH' | 'BEFORE_EACH' | 'ERROR')} type
     * @returns the Hooktype object of a given type
     * @memberof Core
     */
    getHook(type) {
        const hook = this.hooks.find(hook => hook.name === type);
        return hook && hook.lane ? hook.lane : null;
    }
    /**
     * composes the lane context
     *
     * @private
     * @param {LaneType} lane
     * @returns {LaneContext}
     * @memberof Core
     */
    getContext(lane) {
        const context = {
            name: lane.name,
            description: lane.description,
            directory: this.appDir,
            api: new api_1.CoreApi(this)
        };
        return context;
    }
    /**
     * run a specified hook
     *
     * @param {LaneType} lane
     * @param {*} args
     * @returns
     * @memberof Core
     */
    runHook(lane, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lane) {
                return;
            }
            const params = yield this.getArgs(lane);
            this.addToHistory({ type: 'Hook', time: Date.now(), name: lane.name, description: lane.description });
            try {
                const ret = yield this.application[lane.name](...params, ...args);
                return ret;
            }
            catch (err) {
                yield this.runHook(this.getHook('ERROR'), ...args, err);
                console.error(err);
            }
        });
    }
    getProgram() {
        return this.program;
    }
    addToHistory(...historyItem) {
        this.history.entries.push(...historyItem);
    }
    getHistory() {
        return this.history.entries;
    }
    getApplication() {
        return this.application;
    }
    setConfig(config) {
        this.config.allowUnknownOptions = config.allowUnknownOptions;
        this.config.name = config.name;
        this.config.description = config.description;
    }
};
Core = __decorate([
    typescript_ioc_1.Provided(appProvider),
    typescript_ioc_1.Singleton
], Core);
exports.Core = Core;
