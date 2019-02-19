"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_table_1 = __importDefault(require("cli-table"));
const scheduler = require('node-schedule');
const chalk = require('chalk');
const express = require('express')();
const bodyParser = require('body-parser');
express.use(bodyParser.json());
/**
 * The BillyApi Class can be used to interact with the core application.
 * It is used to start the scheduling of Scheduled Lanes and make the Webhooks start listening.
 *
 * @export
 * @class BillyAPI
 */
class BillyAPI {
    constructor(application) {
        this.application = application;
    }
    /**
     * start all the scheduled lanes in your billy application
     *
     * @returns {JobType[]}
     * @memberof BillyAPI
     */
    scheduleAll() {
        this.application.jobs
            .forEach(job => {
            const instance = scheduler.scheduleJob(job.schedule, (fireDate) => __awaiter(this, void 0, void 0, function* () {
                console.log('run scheduled lane ' + job.lane.name + ': ' + fireDate);
                this.application.addToHistory({ name: job.lane.name, description: 'running scheduled lane', type: 'Scheduled', time: Date.now() });
                yield this.application.runHook(this.application.getHook('BEFORE_ALL'));
                yield this.application.runLane(job.lane);
                yield this.application.runHook(this.application.getHook('AFTER_ALL'));
            }));
            job.scheduler = instance;
        });
        return this.application.jobs;
    }
    /**
     * cancel all scheduled lanes
     *
     * @returns {JobType[]}
     * @memberof BillyAPI
     */
    cancelScheduled() {
        this.application.jobs
            .forEach(job => {
            job.scheduler.cancel();
        });
        return this.application.jobs;
    }
    /**
     * start the webhooks server
     *
     * @param {number} [port=7777]
     * @memberof BillyAPI
     */
    startWebhooks(port = 7777) {
        console.log(chalk.green(`starting webooks server on port ${port}...`));
        this.application.webhooks
            .forEach(hook => {
            express.post(hook.path, (req, res) => __awaiter(this, void 0, void 0, function* () {
                console.log(`💌  running webhook ${hook.lane.name}`);
                this.application.addToHistory({ name: hook.lane.name, description: 'running webhook', type: 'Webhook', time: Date.now() });
                res.sendStatus(200);
                yield this.application.runLane(hook.lane, req.body);
            }));
        });
        express.listen(port);
    }
    /**
     * Stop webhooks server
     *
     * @memberof BillyAPI
     */
    stopWebhooks() {
        express.close();
    }
    /**
     * Presents the Standard Billy Lane Selection Screen
     *
     * @returns
     * @memberof BillyAPI
     */
    promptLaneAndRun() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.application.promptLaneAndRun();
        });
    }
    getArgs() {
        return this.application.getProgram().rawArgs.filter((arg, i) => i > 1);
    }
    getHistory() {
        return this.application.getHistory();
    }
    printHistory() {
        const history = this.getHistory();
        const table = new cli_table_1.default({
            head: ["Number", "Name", "Type", "Description"],
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
                'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
                'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
                'right': '║', 'right-mid': '╢', 'middle': '│'
            }
        });
        history.forEach((h, index) => table.push([`${index + 1}`, h.name, h.type, h.description || '']));
        console.log('The application started at ' + new Date(history[0].time));
        console.log(table.toString());
        console.log('The application took ' + this.msToHuman(history[history.length - 1].time - history[0].time));
    }
    msToHuman(millisec) {
        const seconds = (millisec / 1000);
        const minutes = (millisec / (1000 * 60));
        const hours = (millisec / (1000 * 60 * 60));
        const days = (millisec / (1000 * 60 * 60 * 24));
        if (seconds < 60) {
            return seconds.toFixed(1) + " Sec";
        }
        else if (minutes < 60) {
            return minutes.toFixed(1) + " Min";
        }
        else if (hours < 24) {
            return hours.toFixed(1) + " Hrs";
        }
        else {
            return days.toFixed(1) + " Days";
        }
    }
}
exports.BillyAPI = BillyAPI;
