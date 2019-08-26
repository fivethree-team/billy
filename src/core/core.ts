import { AppOptions, ParamModel, CommandModel } from "./../types";
import { AppController } from "./app";
import { parseJSON, exists, appDir } from "../util/util";
import commander from "commander";
import camelcase from "camelcase";

require("dotenv").config();

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
      console.error(`no package.json found in ${appDir}`);
    }

    const packageJSON = parseJSON(`${appDir}/package.json`);
    commander.version(packageJSON.version, "-v, --version");
    config && config.allowUnknownOptions
      ? commander.allowUnknownOption()
      : false;

    const onStart = this.controller.hooks.find(
      hook => hook.type === "ON_START"
    );

    this.controller.commands.forEach(command => this.command(command));

    if (onStart) {
      this.controller.params
        .filter(param => param.propertyKey === onStart.lane.name)
        .forEach(p => this.param(commander, p));
    }

    commander.on("command:*", args => {
      if (onStart) {
        this.parseArgs(args);
        this.controller.run([onStart.lane]);
      } else {
        this.controller.run([]);
      }
    });

    const command = commander.parse(process.argv);
    if (command.args.length === 0) {
      if (onStart) {
        this.parseArgs(commander);
        this.controller.run([onStart.lane]);
      } else {
        this.controller.run([]);
      }
    }
  }

  private command(cmd: CommandModel): commander.Command {
    const command = commander.command(cmd.name);
    command.alias(cmd.options.alias);
    command.description(cmd.options.description);
    const params = this.controller.params.filter(
      param => param.propertyKey === cmd.name
    );
    const gitStyle = params.find(p => p.options.gitStyle);
    params.forEach(p => this.param(command, p));
    command.action(options => {
      if (gitStyle && typeof options === "string") {
        command[gitStyle.name] = options;
      }
      this.parseArgs(command);
      this.controller.run([cmd]);
    });

    return command;
  }

  private param(cmd: commander.Command, param: ParamModel) {
    if (param.options.gitStyle) {
      return cmd.option(
        `[${param.name}]`,
        param.options.description,
        param.value
      );
    }
    if (param.name.indexOf("--") > -1) {
      return cmd.option(
        `${param.name} [var]`,
        param.options.description,
        param.value
      );
    }
    return cmd.option(
      `--${param.name} [var]`,
      param.options.description,
      param.value
    );
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

  private parseArg(options: any, param: ParamModel) {
    const flag = param.name.indexOf("--");
    const name =
      flag === -1 ? camelcase(param.name) : camelcase(param.name.slice(flag));

    if (options[name] && typeof options[name] !== "function") {
      return (param.value = options[name]);
    }

    if (
      options.parent &&
      options.parent[name] &&
      typeof options[name] !== "function"
    ) {
      return (param.value = options.parent[name]);
    }

    if (options && typeof options === "string") {
      return (param.value = options);
    }
    if (options && Array.isArray(options)) {
      return (param.value = options[0]);
    }
  }
}
