import {
    LaneModel, JobModel, HookModel, WebHookModel, ActionModel, ParamModel,
    ContextModel, HookName, HistoryEntry, Context, onError, beforeAll, afterAll, onStart
} from "./types";
import { processAsyncArray, createTable, colorize, wrapForEach, appDir } from "../util/util";
import { History } from './history';
import { Questions, prompt } from "inquirer";
import CoreApi from "./api";

export class AppController {

    instance: any;
    history: History;

    lanes: LaneModel[] = [];
    jobs: JobModel[] = [];
    hooks: HookModel[] = [];
    webhooks: WebHookModel[] = [];
    actions: ActionModel[] = [];
    params: ParamModel[] = [];
    contexts: ContextModel[] = [];

    async init(target) {
        this.instance = new target();
        await this.initLanes();
        await this.initActions();
    }

    registerLane(lane: LaneModel) {
        this.lanes.push(lane);
    }

    registerJob(job: JobModel) {
        this.jobs.push(job);
    }

    registerContext(context: ContextModel) {
        this.contexts.push(context);
    }
    registerParam(param: ParamModel) {
        this.params.push(param);
    }
    registerAction(action: ActionModel) {
        this.actions.push(action);
    }
    registerWebHook(hook: WebHookModel) {
        this.webhooks.push(hook);
    }
    registerHook(hook: HookModel) {
        this.hooks.push(hook);
    }

    private async initLanes() {
        return wrapForEach(this.instance, this.lanes, async (lane: LaneModel) => {
            const beforeEach = this.getHook('BEFORE_EACH');
            await this.runLane(beforeEach ? beforeEach.lane : null);
            const historyEntry: HistoryEntry = {
                type: 'Lane',
                time: Date.now(),
                name: lane.name,
                description: lane.options.description,
                history: []
            }
            this.history.addToHistory(historyEntry)
        }, async () => {
            const afterEach = this.getHook('AFTER_EACH');
            await this.runLane(afterEach ? afterEach.lane : null);
        })

    }

    private async initActions() {
        return wrapForEach(this.instance, this.actions, async (action: ActionModel) => {
            const historyEntry: HistoryEntry = {
                type: 'Action',
                time: Date.now(),
                name: action.name,
                description: action.description,
                history: []
            }
            this.history.addToHistory(historyEntry)
        });
    }

    getHook(type: HookName): HookModel {
        return this.hooks.find(hook => hook.type === type);
    }

    async run(lanes: LaneModel[]) {
        this.history = new History()
        if (lanes.length === 0) {
            if (!(await this.runHook(onStart))) {
                await this.promptLaneAndRun();
            }
        } else {
            await this.runLanes(lanes);
        }
    }

    async runLane(lane: LaneModel, ...args) {
        if (!lane) { return; }
        try {
            const params = await this.getArgs(lane);
            const ret = await this.instance[lane.name](...params, ...args)
            return ret;
        } catch (err) {
            await this.runHook(onError, err);
            console.error(colorize('red', err));
            throw err;
        }
    }

    async runHook(hook: HookName, ...args) {
        const h = this.getHook(hook);
        await this.runLane(h ? h.lane : null, ...args);
        return !!h;
    }

    private async runLanes(lanes: LaneModel[]) {

        await this.runHook(beforeAll);

        await processAsyncArray(lanes, async (lane) => {
            await this.runLane(lane);
        })
        await this.runHook(afterAll)
    }

    async promptLaneAndRun() {
        await this.presentLanes();
        const lane = await this.promptLane();
        await this.runLanes([lane]);
    }

    async presentLanes() {
        const table = createTable(["Number", "Lane", "Description"]);
        this.lanes.forEach((lane, index) => table.push([colorize('blue', `${index + 1}`), lane.name, lane.options.description]));
        console.log(table.toString());
    }

    private async promptLane(): Promise<LaneModel> {
        const question: Questions = [{
            type: 'input',
            name: 'lane',
            message: 'please enter number or lane name',
            validate: (input) => {
                if (!!input && isNaN(input)) {
                    if (this.lanes.some(lane => lane.name === input)) {
                        return true;
                    }
                    else {
                        console.log(colorize('red', `  | couldn't find lane with name ${input}`));
                        return false;
                    }
                }
                else {
                    if (+input > 0 && +input <= this.lanes.length) {
                        return true;
                    }
                    else {
                        console.log(colorize('red', '  | specify a number between 1 and ' + this.lanes.length));
                        return false;
                    }
                }
            }
        }];
        const answer = (await prompt(question)).lane;
        return isNaN(answer) ? this.lanes.find(l => l.name === answer) : this.lanes[answer - 1];

    }

    private async getArgs(method: LaneModel) {
        const contextMeta = this.contexts.find(m => m.propertyKey === method.name);
        const params = await this.resolveParams(method);

        const sortedParams: any[] = [];

        params.forEach(param => {
            sortedParams.push(param.value);
        })

        if (contextMeta) {
            sortedParams.splice(contextMeta.contextIndex, 0, this.getContext(method))
        }

        return sortedParams;
    }

    private async resolveParams(method: LaneModel): Promise<ParamModel[]> {
        const params = this.params
            .filter(param => param.propertyKey === method.name)
            .sort((a, b) => {
                return a.index - b.index;
            });
        if (params.length === 0) {
            return [];
        }
        let ret: ParamModel[] = [];
        await processAsyncArray(params, async (p: ParamModel) => {
            if (p.value) { return ret.push(p) }
            if (p.options.optional) {
                p.value = null;
            } else {
                const question: Questions = [{
                    name: 'answer',
                    message: p.options.description,
                }
                ]
                const value = (await prompt(question)).answer;
                p.value = value;
            }

            ret.push(p);
        })


        return ret;

    }

    private getContext(lane: LaneModel): Context {
        const context: Context = {
            name: lane.name,
            description: lane.options.description,
            directory: appDir,
            workingDirectory: process.cwd(),
            api: new CoreApi(this)
        }
        return context;
    }

}