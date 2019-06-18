"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const util_1 = require("../util/util");
const commander_1 = __importDefault(require("commander"));
require('dotenv').config();
class Core {
    constructor() {
        this.controller = new app_1.AppController();
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
    run(config) {
        if (!util_1.exists(`${util_1.appDir}/package.json`)) {
            console.error(`no package.json found in ${util_1.appDir}`);
        }
        const packageJSON = util_1.parseJSON(`${util_1.appDir}/package.json`);
        commander_1.default.version(packageJSON.version, '-v, --version');
        config && config.allowUnknownOptions ? commander_1.default.allowUnknownOption() : false;
        this.controller.commands
            .forEach(command => this.command(command));
        commander_1.default.on('command:*', () => {
            this.controller.run([]);
        });
        const onStart = this.controller.hooks.find(hook => hook.type === 'ON_START');
        if (onStart) {
            this.controller.params
                .filter(param => param.propertyKey === onStart.lane.name)
                .forEach(param => commander_1.default.option(`--${param.name} [var]`, param.options.description, param.value));
        }
        const command = commander_1.default.parse(process.argv);
        if (command.args.length === 0) {
            if (onStart) {
                this.parseArgs(command);
                this.controller.run([onStart.lane]);
            }
            else {
                this.controller.run([]);
            }
        }
    }
    command(cmd) {
        const command = commander_1.default.command(cmd.name);
        command.alias(cmd.options.alias);
        const params = this.controller.params.filter(param => param.propertyKey === cmd.name);
        params.forEach(param => command.option(`--${param.name} [var]`, param.options.description, param.value));
        command.action((c) => {
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
    parseArgs(program) {
        this.controller.params
            .forEach(param => this.parseArg(program, param));
    }
    parseArg(program, param) {
        const hasValue = program[param.name] && typeof program[param.name] !== 'function';
        if (hasValue) {
            param.value = program[param.name];
        }
    }
}
exports.Core = Core;
