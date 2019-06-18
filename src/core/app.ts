import { AppOptions } from './../types/public';
import {
    CommandModel, JobModel, HookModel, ParamModel,
    ContextModel, HookName, HistoryEntry, WebhookModel,
    ActionModel, Context, BodyModel, ErrorModel, HistoryAction
} from "../types";
import { processAsyncArray, colorize, wrapForEach, createTable, appDir } from "../util/util";
import { History } from './history';
import { Questions, prompt } from "inquirer";
import CoreApi from "./api";
import { onStart, beforeAll, onError, afterAll, beforeEach, afterEach } from "./hooks";

export class AppController {

    instance: any;
    config: AppOptions
    history: History;

    //holds the metadata of the method decorators
    commands: CommandModel[] = [];
    jobs: JobModel[] = [];
    hooks: HookModel[] = [];
    webhooks: WebhookModel[] = [];
    actions: ActionModel[] = [];

    //holds the metadata of the method parameter decorators
    params: ParamModel[] = [];
    contexts: ContextModel[] = [];
    bodys: BodyModel[] = [];
    errors: ErrorModel[] = [];

    async init(target, config: AppOptions) {
        this.config = config;
        this.instance = new target();
        await this.initCommands();
        await this.initActions();
    }

    private async initCommands() {
        return wrapForEach(this.instance, this.commands, async (command) => {
            await this.runHook(beforeEach);
            const historyEntry: HistoryEntry = {
                type: 'Command',
                time: Date.now(),
                name: command.name,
                description: command.options.description,
                history: []
            }
            this.history.addToHistory(historyEntry)
        }, async () => {
            await this.runHook(afterEach)
        })

    }

    private async initActions() {
        return wrapForEach(this.instance, this.actions, async (action: ActionModel, ...args: any[]) => {
            if (action.description || action.options.addToHistory) {
                const desc = action.options && action.options.description ? action.options.description(...args) : action.description || '';
                const historyEntry: HistoryAction = {
                    description: desc,
                    name: action.name,
                    time: Date.now()
                }
                if (this.history.getLatest() && !this.history.getLatest().history) {
                    this.history.getLatest().history = [];
                }
                this.history.getLatest() && this.history.getLatest().history.push(historyEntry);
            }
        });
    }

    getHook(type: HookName): HookModel {
        return this.hooks.find(hook => hook.type === type);
    }

    async run(commands: CommandModel[]) {
        this.history = new History()
        return commands.length > 0 ? await this.runCommands(commands) : await this.promptCommand();
    }



    async runCommand(command: CommandModel) {
        if (!command) { return; }
        const params = await this.getArgs(command);
        try {
            const ret = await this.instance[command.name](...params)
            return ret;
        } catch (err) {
            await this.handleCommandError(err);
        }
    }

    async handleCommandError(err) {
        const h = this.getHook(onError);
        if (h && h.lane) {
            const params = await this.getArgs(h.lane);
            const meta = this.errors.find(m => m.propertyKey === h.lane.name);
            if (meta) {
                params.splice(meta.contextIndex, 0, err);
            }
            await this.instance[h.lane.name](...params)
        }
        console.log(colorize('red', err));
        throw err;
    }

    async runHook(hook: HookName, ...args) {
        const h = this.getHook(hook);
        await this.runCommand(h ? h.lane : null);
        return !!h;
    }

    private async runCommands(commands: CommandModel[]) {

        await this.runHook(beforeAll);

        await processAsyncArray(commands, async (command) => {
            await this.runCommand(command);
        })
        await this.runHook(afterAll)
        this.history.clear();
    }

    async promptCommand() {
        await this.printCommands();
        const command = await this.prompt();
        await this.runCommands([command]);
    }

    async printCommands() {
        const table = createTable(["#", "Command", "Description"]);
        this.commands.forEach((command, index) => table.push([`${index + 1}`, command.name, command.options.description]));
        console.log(table.toString());
    }

    private async prompt(): Promise<CommandModel> {
        const question: Questions = [{
            type: 'input',
            name: 'command',
            message: 'Please enter a number or command',
            validate: (input) => this.validateInput(input)
        }];
        const answer = (await prompt(question)).command;
        return isNaN(answer) ? this.commands.find(l => l.name === answer) : this.commands[answer - 1];

    }

    private validateInput(input: number | string) {
        const validationError = (message) => {
            console.log(colorize('red', message));
            return false;
        }
        if (isNaN(+input)) {
            return this.commands.some(lane => lane.name === input ? true : validationError(`Couldn't find lane with name ${input}`));
        }

        return +input > 0 && +input <= this.commands.length ? true : validationError(' Specify a number between 1 and ' + this.commands.length);
    }

    async getArgs(method: CommandModel) {
        const contextMeta = this.contexts.find(m => m.propertyKey === method.name);
        const params: ParamModel[] = await this.resolveParams(method);
        const resolved: any[] = params.map(p => p.value);
        if (contextMeta) {
            resolved.splice(contextMeta.contextIndex, 0, this.getContext(method))
        }
        return resolved;
    }

    private async resolveParams(method: CommandModel): Promise<ParamModel[]> {
        const params = this.params
            .filter(param => param.propertyKey === method.name)
            .sort((a, b) => a.index - b.index);
        if (params.length === 0) {
            return [];
        }
        let ret: ParamModel[] = [];
        await processAsyncArray(params, async (p: ParamModel) => {
            const resolved = await this.resolveParam(p);
            ret.push(resolved);
        })
        return ret;

    }

    private async resolveParam(p: ParamModel) {

        if (p.options.optional && (!p.value && p.value !== false)) {
            return p;
        }
        if (!p.value) {
            const question: Questions = [{
                name: 'answer',
                message: p.options.description,
            }]
            p.value = (await prompt(question)).answer;
        }
        return await this.validateParam(p);

    }

    private async validateParam(p: ParamModel) {

        if (!p.options.validators || p.options.validators.length === 0) { return p; }
        for (const validator of p.options.validators) {
            if (validator.mapBefore) { p.value = await validator.mapBefore(p.value); }
            const isValid = await validator.validate(p.value);
            if (!isValid) {
                console.log((await colorize('red', validator.invalidText(p.name, p.value) || `${p.value} is not a valid parameter for ${p.name}`)));
                p.value = null;
                await this.resolveParam(p);
                break;
            }
            if (validator.mapAfter) { p.value = await validator.mapAfter(p.value); }
        }
        return p;
    }


    private getContext(lane: CommandModel): Context {
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