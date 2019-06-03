"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var Core_1;
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const typescript_ioc_1 = require("typescript-ioc");
const util_1 = require("../util/util");
const commander_1 = __importDefault(require("commander"));
require('dotenv').config();
let Core = Core_1 = class Core {
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
        this.controller.lanes
            .forEach(lane => {
            const command = commander_1.default.command(lane.name);
            command.alias(lane.options.alias);
            const params = this.controller.params.filter(param => param.propertyKey === lane.name);
            params.forEach(param => command.option(`--${param.name || param.name} ${param.options.optional ? '[var]' : '<var>'}`, param.options.description, param.value));
            command.action((cmd) => {
                this.parseArgs(cmd);
                this.controller.run([lane]);
            });
        });
        const command = commander_1.default.parse(process.argv);
        if (command.args.length === 0) {
            this.controller.run([]);
        }
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
            .forEach(param => {
            const hasValue = program[param.name] && typeof program[param.name] !== 'function';
            if (hasValue) {
                param.value = program[param.name];
            }
        });
    }
};
Core = Core_1 = __decorate([
    typescript_ioc_1.Provided({ get: () => { return new Core_1(); } }),
    typescript_ioc_1.Singleton
], Core);
exports.Core = Core;
