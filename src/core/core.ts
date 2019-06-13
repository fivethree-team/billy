import { AppOptions, ParamModel, CommandModel } from './../types';
import { AppController } from './app';
import { parseJSON, exists, appDir } from '../util/util';
import commander from 'commander';

require('dotenv').config();

export class Core {
    controller: AppController = new AppController();

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
    public run(config: AppOptions) {
        if (!exists(`${appDir}/package.json`)) {
            console.error(`no package.json found in ${appDir}`)
        }

        const packageJSON = parseJSON(`${appDir}/package.json`);
        commander.version(packageJSON.version, '-v, --version')

        config && config.allowUnknownOptions ? commander.allowUnknownOption() : false;

        this.controller.commands
            .forEach(command => this.command(command));

        commander.on('command:*', () => {
            this.controller.run([]);
        });

        const command = commander.parse(process.argv);
        if (command.args.length === 0) {
            this.controller.run([]);
        }

    }

    private command(cmd: CommandModel): commander.Command {
        const command = commander.command(cmd.name);
        command.alias(cmd.options.alias);
        const params = this.controller.params.filter(param => param.propertyKey === cmd.name);
        params.forEach(param => command.option(`--${param.name} [var]`, param.options.description, param.value))
        command.action((c: commander.Command) => {
            this.parseArgs(c);
            this.controller.run([cmd]);
        });

        return command;
    }

    /**
     * parsing of the cli parameters passed via --VARIABLE (ex. --name Gary).
     * If values have been passed in, the values will be stored in the ParamModel array
     *
     * @private
     * @param {*} program commander.js instance
     * @memberof Core
     */
    parseArgs(program: commander.Command) {
        this.controller.params
            .forEach(param => this.parseArg(program, param));
    }

    private parseArg(program: commander.Command, param: ParamModel) {
        const hasValue = program[param.name] && typeof program[param.name] !== 'function';
        if (hasValue) {
            param.value = program[param.name]
        }
    }

}






