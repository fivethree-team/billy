import { LaneType, Context, JobType, HookType, WebHookType, ParamType, HookName, History, AppOptions, HistoryEntry, ActionType, ContextType } from './types';
import { Provided, Provider, Singleton } from 'typescript-ioc';
import Table from 'cli-table';
import { parseJSON, processAsyncArray } from './util';
import { CoreApi } from './api';
require('dotenv').config();

const inquirer = require('inquirer');
const chalk = require('chalk');
const commander = require('commander');
const path = require('path');

const appProvider: Provider = {
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
@Provided(appProvider)
@Singleton
export class Core {
    lanes: LaneType[] = [];
    jobs: JobType[] = [];
    hooks: HookType[] = [];
    webhooks: WebHookType[] = [];
    actions: ActionType[] = [];
    params: ParamType[] = [];
    contexts: ContextType[] = [];
    private appDir = path.resolve(path.dirname(require.main.filename) + '/..');
    private program;
    private config: AppOptions = {};
    private history: History;

    /**
     * The Application instance
     *
     * @type {*}
     * @memberof Core
     */
    private application: any;

    /**
     * initialize the @App Decorator target (application)
     *
     * @param {*} target @App Decorator target
     * @memberof Core
     */
    init(target): any {
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
    private initLanes() {
        this.lanes
            .forEach(async (lane: LaneType) => {
                const originalLane = this.application[lane.name].bind(this.application)
                //replace original Lane with wrapped one
                this.application[lane.name] = async (...args) => {

                    await this.runHook(this.getHook('BEFORE_EACH'));
                    console.log(chalk.green(`taking lane ${lane.name}`));

                    const historyEntry: HistoryEntry = {
                        type: 'Lane',
                        time: Date.now(),
                        name: lane.name,
                        description: lane.description
                    }

                    this.addToHistory(historyEntry)
                    const ret = await originalLane(...args);
                    await this.runHook(this.getHook('AFTER_EACH'));
                    return ret;
                }

            });
    }
    /**
    *  * add to history
    *
    * @private
    * @memberof Core
    */
    private initActions(): any {
        this.actions
            .forEach(async (action: ActionType) => {
                const originalAction = this.application[action.name].bind(this.application)
                this.application[action.name] = (...args) => {

                    const historyEntry: HistoryEntry = {
                        type: 'Action',
                        time: Date.now(),
                        name: action.name,
                        description: action.description
                    }

                    this.addToHistory(historyEntry)
                    return originalAction(...args);
                    
                }

            });
    }


    /**
     * This is called once the AppDecorator is assigned.
     * At this point all the lanes, plugins and params have been loaded into core
     *
     * @memberof Core
     */
    async run() {
        this.history = new History();
        const startupHook = this.getHook('ON_START');
        this.program = this.initProgram(this.config.allowUnknownOptions);
        this.initParameters(this.program);
        const lanes = this.getLanesFromCommand(this.program);
        if (lanes.length === 0) {
            if (startupHook) {
                // handle root command yourself instead of displaying the lane prompt
                await this.runHook(startupHook);
            } else {
                await this.promptLaneAndRun();
            }
        } else {
            await this.runMultipleLanes(lanes);
        }
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
    private initProgram(allowUnknownOptions = false) {
        const packageJSON = parseJSON(`${this.appDir}/package.json`);

        let program = commander
            .version(packageJSON.version, '-v, --version')

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
    async promptLaneAndRun() {
        await this.presentLanes();
        const lane = await this.promptLane();
        await this.startProgram(lane);
    }

    /**
     * parsing of the cli parameters passed via --VARIABLE (ex. --name Gary).
     * If values have been passed in, the values will be stored in the ParamType array
     *
     * @private
     * @param {*} program commander.js instance
     * @memberof Core
     */
    private initParameters(program) {
        this.params
            .forEach(param => {
                const hasValue = program[param.name] && typeof program[param.name] !== 'function';
                if (hasValue) { param.value = program[param.name] }
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
    private getLanesFromCommand(program): LaneType[] {

        const lanes: LaneType[] = []
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
    private async presentLanes() {
        const table = new Table({
            head: ["Number", "Lane", "Description"],
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
                , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
                , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
                , 'right': '║', 'right-mid': '╢', 'middle': '│'
            }
        });
        this.lanes.forEach((lane, index) => table.push([chalk.blueBright(`${index + 1}`), lane.name, lane.description]));
        console.log(table.toString());
    }

    /**
     * starts the lane from index or name
     *
     * @private
     * @param {*} lane
     * @memberof Core
     */
    private async startProgram(lane: any) {
        await this.runHook(this.getHook('BEFORE_ALL'));
        if (isNaN(lane)) {
            await this.runLane(this.lanes.find(l => l.name === lane));
        }
        else {
            await this.runLane(this.lanes[lane - 1]);
        }
        await this.runHook(this.getHook('AFTER_ALL'));
    }

    /**
     * prompts the user to input a lane index or lane name
     *
     * @private
     * @returns a lane specified as index or name
     * @memberof Core
     */
    private async promptLane() {
        return (await inquirer.prompt([{
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
    }

    /**
     * take a lane, when an error is thrown inside a lane, the error hook (if specified) will be run
     *
     * @param {LaneType} lane
     * @param {*} args
     * @returns returns the lanes return value as Promise
     * @memberof Core
     */
    async runLane(lane: LaneType, ...args) {

        const params = await this.getArgs(lane);

        try {
            const ret = await this.application[lane.name](...params, ...args)
            return ret;
        } catch (err) {
            await this.runHook(this.getHook('ERROR'), ...args, err);

            console.error(err);
        }
    }

    /**
     *
     * @private
     * @param {LaneType} lane
     * @returns the params, sorted as they are injected into the lane via @param and @context
     * @memberof Core
     */
    private async getArgs(method: LaneType) {
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

    /**
     * gets missing required param values via prompting the user,
     * skips optional if empty
     *
     * @private
     * @param {LaneType} lane
     * @returns {Promise<ParamType[]>}
     * @memberof Core
     */
    private async resolveParams(method:LaneType): Promise<ParamType[]> {
        const params = this.params
            .filter(param => param.propertyKey === method.name)
            .sort((a, b) => {
                return a.index - b.index;
            });
        if (params.length === 0) {
            return [];
        }
        let ret: ParamType[] = [];
        await processAsyncArray(params, async (p: ParamType) => {
            if (p.value) { return ret.push(p) }
            if (p.optional) {
                p.value = null;
            } else {
                const value = (await inquirer.prompt([{
                    name: 'answer',
                    message: p.description,
                }
                ])).answer;
                p.value = value;
            }

            ret.push(p);
        })


        return ret;

    }

    /**
     * takes a LaneType array and runs them sequentially
     *
     * @private
     * @param {LaneType[]} lanes
     * @memberof Core
     */
    private async runMultipleLanes(lanes: LaneType[]) {
        await this.runHook(this.getHook('BEFORE_ALL'));
        await processAsyncArray(lanes, async (lane) => {
            await this.runLane(lane);
        })
        await this.runHook(this.getHook('AFTER_ALL'));
    }

    /**
     *
     *
     * @param {('BEFORE_ALL' | 'AFTER_ALL' | 'AFTER_EACH' | 'BEFORE_EACH' | 'ERROR')} type
     * @returns the Hooktype object of a given type
     * @memberof Core
     */
    getHook(type: HookName): LaneType {
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
    private getContext(lane: LaneType): Context {
        const context: Context = {
            name: lane.name,
            description: lane.description,
            directory: this.appDir,
            api: new CoreApi(this)
        }
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
    async runHook(lane: LaneType, ...args) {
        if (!lane) { return }

        const params = await this.getArgs(lane);
        this.addToHistory({ type: 'Hook', time: Date.now(), name: lane.name, description: lane.description })
        try {
            const ret = await this.application[lane.name](...params, ...args)
            return ret;
        } catch (err) {
            await this.runHook(this.getHook('ERROR'), ...args, err);

            console.error(err);
        }
    }

    getProgram() {
        return this.program;
    }

    addToHistory(...historyItem: HistoryEntry[]) {
        this.history.entries.push(...historyItem);
    }

    getHistory(): HistoryEntry[] {
        return this.history.entries;
    }

    getApplication() {
        return this.application;
    }

    setConfig(config: AppOptions): any {
        this.config.allowUnknownOptions = config.allowUnknownOptions;
        this.config.name = config.name;
        this.config.description = config.description;
    }
}






