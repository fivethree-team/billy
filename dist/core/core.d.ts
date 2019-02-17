import { LaneType, JobType, HookType, WebHookType, ParamType, MethodMeta, HookName, AppOptions } from './types';
/**
 * The Core Application
 *
 * The Core Class holds all the meta data and
 * is responsible for coordinating the lanes
 *
 * @export
 * @class Core
 */
export declare class Core {
    lanes: LaneType[];
    jobs: JobType[];
    hooks: HookType[];
    webhooks: WebHookType[];
    actions: any[];
    plugins: any[];
    params: ParamType[];
    meta: MethodMeta[];
    appDir: any;
    instance: any;
    private program;
    config: AppOptions;
    private history;
    /**
     * This is called once the AppDecorator is assigned.
     * At this point all the lanes, plugins and params have been loaded into core
     *
     * @memberof Core
     */
    run(): Promise<void>;
    promptLaneAndRun(): Promise<void>;
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
    private initProgram;
    /**
     * parsing of the cli parameters passed via --VARIABLE (ex. --name Gary).
     * If values have been passed in, the values will be stored in the ParamType array
     *
     * @private
     * @param {*} program commander.js instance
     * @memberof Core
     */
    private initParameters;
    /**
     * parses the command line options and returns all the lanes that were passed in
     *
     * @private
     * @param {*} program
     * @returns {LaneType[]} Lanes to be run
     * @memberof Core
     */
    private getLanesFromCommand;
    /**
     * Print the table for all Lanes
     *
     * @private
     * @memberof Core
     */
    private presentLanes;
    /**
     * starts the lane from index or name
     *
     * @private
     * @param {*} lane
     * @memberof Core
     */
    private startProgram;
    /**
     * prompts the user to input a lane index or lane name
     *
     * @private
     * @returns a lane specified as index or name
     * @memberof Core
     */
    private promptLane;
    /**
     * take a lane, when an error is thrown inside a lane, the error hook (if specified) will be run
     *
     * @param {LaneType} lane
     * @param {*} args
     * @returns returns the lanes return value as Promise
     * @memberof Core
     */
    runLane(lane: LaneType, ...args: any[]): Promise<any>;
    /**
     *
     * @private
     * @param {LaneType} lane
     * @returns the params, sorted as they are injected into the lane via @param and @context
     * @memberof Core
     */
    private getArgs;
    /**
     * gets missing required param values via prompting the user,
     * skips optional if empty
     *
     * @private
     * @param {LaneType} lane
     * @returns {Promise<ParamType[]>}
     * @memberof Core
     */
    private resolveParams;
    /**
     * takes a LaneType array and runs them sequentially
     *
     * @private
     * @param {LaneType[]} lanes
     * @memberof Core
     */
    private runMultipleLanes;
    /**
     *
     *
     * @param {('BEFORE_ALL' | 'AFTER_ALL' | 'AFTER_EACH' | 'BEFORE_EACH' | 'ERROR')} type
     * @returns the Hooktype object of a given type
     * @memberof Core
     */
    getHook(type: HookName): LaneType;
    /**
     * composes the lane context
     *
     * @private
     * @param {LaneType} lane
     * @returns {LaneContext}
     * @memberof Core
     */
    private getLaneContext;
    /**
     * run a specified hook
     *
     * @param {LaneType} lane
     * @param {*} args
     * @returns
     * @memberof Core
     */
    runHook(lane: LaneType, ...args: any[]): Promise<any>;
    getProgram(): any;
}
