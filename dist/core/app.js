"use strict";
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
const util_1 = require("../util/util");
const history_1 = require("./history");
const inquirer_1 = require("inquirer");
const api_1 = __importDefault(require("./api"));
const hooks_1 = require("./hooks");
class AppController {
    constructor() {
        this.lanes = [];
        this.jobs = [];
        this.hooks = [];
        this.webhooks = [];
        this.actions = [];
        this.params = [];
        this.contexts = [];
    }
    init(target) {
        return __awaiter(this, void 0, void 0, function* () {
            this.instance = new target();
            yield this.initLanes();
            yield this.initActions();
        });
    }
    registerLane(lane) {
        this.lanes.push(lane);
    }
    registerJob(job) {
        this.jobs.push(job);
    }
    registerContext(context) {
        this.contexts.push(context);
    }
    registerParam(param) {
        this.params.push(param);
    }
    registerAction(action) {
        this.actions.push(action);
    }
    registerWebHook(hook) {
        this.webhooks.push(hook);
    }
    registerHook(hook) {
        this.hooks.push(hook);
    }
    initLanes() {
        return __awaiter(this, void 0, void 0, function* () {
            return util_1.wrapForEach(this.instance, this.lanes, (lane) => __awaiter(this, void 0, void 0, function* () {
                yield this.runHook(hooks_1.beforeEach);
                const historyEntry = {
                    type: 'Command',
                    time: Date.now(),
                    name: lane.name,
                    description: lane.options.description,
                    history: []
                };
                this.history.addToHistory(historyEntry);
            }), () => __awaiter(this, void 0, void 0, function* () {
                yield this.runHook(hooks_1.afterEach);
            }));
        });
    }
    initActions() {
        return __awaiter(this, void 0, void 0, function* () {
            return util_1.wrapForEach(this.instance, this.actions, (action) => __awaiter(this, void 0, void 0, function* () {
                const historyEntry = {
                    type: 'Action',
                    time: Date.now(),
                    name: action.name,
                    description: action.description,
                    history: []
                };
                this.history.addToHistory(historyEntry);
            }));
        });
    }
    getHook(type) {
        return this.hooks.find(hook => hook.type === type);
    }
    run(lanes) {
        return __awaiter(this, void 0, void 0, function* () {
            this.history = new history_1.History();
            if (lanes.length === 0) {
                yield this.start();
            }
            else {
                yield this.runLanes(lanes);
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.runHook(hooks_1.onStart))) {
                yield this.promptLaneAndRun();
            }
        });
    }
    runLane(lane, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lane) {
                return;
            }
            try {
                const params = yield this.getArgs(lane);
                const ret = yield this.instance[lane.name](...params, ...args);
                return ret;
            }
            catch (err) {
                yield this.runHook(hooks_1.onError, err);
                console.error(util_1.colorize('red', err));
                throw err;
            }
        });
    }
    runHook(hook, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const h = this.getHook(hook);
            yield this.runLane(h ? h.lane : null, ...args);
            return !!h;
        });
    }
    runLanes(lanes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runHook(hooks_1.beforeAll);
            yield util_1.processAsyncArray(lanes, (lane) => __awaiter(this, void 0, void 0, function* () {
                yield this.runLane(lane);
            }));
            yield this.runHook(hooks_1.afterAll);
            this.history.clear();
        });
    }
    promptLaneAndRun() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.presentLanes();
            const lane = yield this.promptLane();
            yield this.runLanes([lane]);
        });
    }
    presentLanes() {
        return __awaiter(this, void 0, void 0, function* () {
            const table = util_1.createTable(["Number", "Command", "Description"]);
            this.lanes.forEach((lane, index) => table.push([util_1.colorize('blue', `${index + 1}`), lane.name, lane.options.description]));
            console.log(table.toString());
        });
    }
    promptLane() {
        return __awaiter(this, void 0, void 0, function* () {
            const question = [{
                    type: 'input',
                    name: 'lane',
                    message: 'please enter number or lane name',
                    validate: (input) => this.validateInput(input)
                }];
            const answer = (yield inquirer_1.prompt(question)).lane;
            return isNaN(answer) ? this.lanes.find(l => l.name === answer) : this.lanes[answer - 1];
        });
    }
    validateInput(input) {
        if (!!input && isNaN(+input)) {
            if (this.lanes.some(lane => lane.name === input)) {
                return true;
            }
            else {
                console.log(util_1.colorize('red', `  | couldn't find lane with name ${input}`));
                return false;
            }
        }
        else {
            if (+input > 0 && +input <= this.lanes.length) {
                return true;
            }
            else {
                console.log(util_1.colorize('red', '  | specify a number between 1 and ' + this.lanes.length));
                return false;
            }
        }
    }
    getArgs(method) {
        return __awaiter(this, void 0, void 0, function* () {
            const contextMeta = this.contexts.find(m => m.propertyKey === method.name);
            const params = (yield this.resolveParams(method));
            const resolved = params.map(p => p.value);
            if (contextMeta) {
                resolved.splice(contextMeta.contextIndex, 0, this.getContext(method));
            }
            return resolved;
        });
    }
    resolveParams(method) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.params
                .filter(param => param.propertyKey === method.name)
                .sort((a, b) => a.index - b.index);
            if (params.length === 0) {
                return [];
            }
            let ret = [];
            yield util_1.processAsyncArray(params, (p) => __awaiter(this, void 0, void 0, function* () {
                const resolved = yield this.resolveParam(p);
                ret.push(resolved);
            }));
            return ret;
        });
    }
    resolveParam(p) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!p.options.optional && !p.value) {
                const question = [{
                        name: 'answer',
                        message: p.options.description,
                    }];
                const value = (yield inquirer_1.prompt(question)).answer;
                p.value = value;
            }
            return p;
        });
    }
    getContext(lane) {
        const context = {
            name: lane.name,
            description: lane.options.description,
            directory: util_1.appDir,
            workingDirectory: process.cwd(),
            api: new api_1.default(this)
        };
        return context;
    }
}
exports.AppController = AppController;
