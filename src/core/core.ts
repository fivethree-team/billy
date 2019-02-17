import { LaneType, LaneContext, JobType, HookType, WebHookType, ParamType, MethodMeta, HookName, History, AppOptions } from './types';
import { Provided, Provider, Singleton } from 'typescript-ioc';
import Table from 'cli-table';
import { parseJSON, processAsyncArray } from './util';
import { BillyAPI } from './api';
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
    actions = [];
    plugins = [];
    params: ParamType[] = [];
    meta: MethodMeta[] = [];
    appDir = path.resolve(path.dirname(require.main.filename) + '/../..');
    instance: any;
    private program;
    config: AppOptions = {};
    private history: History;


    /**
     * This is called once the AppDecorator is assigned.
     * At this point all the lanes, plugins and params have been loaded into core
     *
     * @memberof Core
     */
    async run() {
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

    async promptLaneAndRun() {
        await this.presentLanes();
        const lane = await this.promptLane();
        await this.startProgram(lane);
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
            const ret = await this.instance[lane.name](...params, ...args)
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
    private async getArgs(lane: LaneType) {
        const contextMeta = this.meta.find(m => m.propertyKey === lane.name);
        const params = await this.resolveParams(lane);

        const sortedParams: any[] = [];

        params.forEach(param => {
            sortedParams.push(param.value);
        })

        if (contextMeta) {
            sortedParams.splice(contextMeta.contextIndex, 0, this.getLaneContext(lane))
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
    private async resolveParams(lane: LaneType): Promise<ParamType[]> {
        const params = this.params
            .filter(param => param.lane === lane.name)
            .sort((a, b) => {
                return a.index - b.index;
            });
        if (params.length === 0) {
            return [];
        }
        let ret: ParamType[] = [];
        await processAsyncArray(params, async (p: ParamType) => {
            console.log('process param', p);
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
    private getLaneContext(lane: LaneType): LaneContext {
        const context: LaneContext = {
            name: lane.name,
            description: lane.description,
            directory: this.appDir,
            api: new BillyAPI(this)
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

        try {
            const ret = await this.instance[lane.name](...params, ...args)
            return ret;
        } catch (err) {
            await this.runHook(this.getHook('ERROR'), ...args, err);

            console.error(err);
        }
    }

    getProgram() {
        return this.program;
    }
}





