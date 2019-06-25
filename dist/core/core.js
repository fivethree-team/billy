"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const util_1 = require("../util/util");
const commander_1 = __importDefault(require("commander"));
const camelcase_1 = __importDefault(require("camelcase"));
require("dotenv").config();
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
        commander_1.default.version(packageJSON.version, "-v, --version");
        config && config.allowUnknownOptions
            ? commander_1.default.allowUnknownOption()
            : false;
        const onStart = this.controller.hooks.find(hook => hook.type === "ON_START");
        this.controller.commands.forEach(command => this.command(command));
        commander_1.default.on("command:*", args => {
            if (onStart) {
                this.parseArgs(args);
                this.controller.run([onStart.lane]);
            }
            else {
                this.controller.run([]);
            }
        });
        if (onStart) {
            this.controller.params
                .filter(param => param.propertyKey === onStart.lane.name)
                .forEach(p => this.param(commander_1.default, p));
        }
        const command = commander_1.default.parse(process.argv);
        if (command.args.length === 0) {
            if (onStart) {
                this.parseArgs(commander_1.default);
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
        command.description(cmd.options.description);
        const params = this.controller.params.filter(param => param.propertyKey === cmd.name);
        params.forEach(p => this.param(command, p));
        command.action(options => {
            this.parseArgs(options);
            this.controller.run([cmd]);
        });
        return command;
    }
    param(cmd, param) {
        if (param.options.gitStyle) {
            return cmd.option(`[${param.name}]`, param.options.description, param.value);
        }
        if (param.name.indexOf("--") > -1) {
            return cmd.option(`${param.name} [var]`, param.options.description, param.value);
        }
        return cmd.option(`--${param.name} [var]`, param.options.description, param.value);
    }
    /**
     * parsing of the cli parameters passed via --VARIABLE (ex. --name Gary).
     * If values have been passed in, the values will be stored in the ParamModel array
     *
     * @private
     * @param {*} program commander.js instance
     * @memberof Core
     */
    parseArgs(options) {
        this.controller.params.forEach(param => this.parseArg(options, param));
    }
    parseArg(options, param) {
        const flag = param.name.indexOf("--");
        const name = flag === -1 ? camelcase_1.default(param.name) : camelcase_1.default(param.name.slice(flag));
        if (options[name] && typeof options[name] !== "function") {
            param.value = options[name];
        }
        if (options && typeof options === "string") {
            param.value = options;
        }
        if (options && Array.isArray(options)) {
            param.value = options[0];
        }
    }
}
exports.Core = Core;
