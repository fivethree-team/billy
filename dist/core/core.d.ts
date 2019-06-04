import { AppOptions } from './../types';
import { AppController } from './app';
import commander from 'commander';
export declare class Core {
    controller: AppController;
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
    run(config: AppOptions): void;
    private command;
    /**
     * parsing of the cli parameters passed via --VARIABLE (ex. --name Gary).
     * If values have been passed in, the values will be stored in the ParamModel array
     *
     * @private
     * @param {*} program commander.js instance
     * @memberof Core
     */
    parseArgs(program: commander.Command): void;
    private parseArg;
}
