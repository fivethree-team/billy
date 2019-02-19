import { Core } from "./core";
import { JobType, HistoryEntry } from "./types";
import Table from 'cli-table';


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
export class BillyAPI {

    private application: Core;

    constructor(application: Core) {
        this.application = application
    }

    /**
     * start all the scheduled lanes in your billy application
     *
     * @returns {JobType[]}
     * @memberof BillyAPI
     */
    scheduleAll(): JobType[] {
        this.application.jobs
            .forEach(job => {
                const instance = scheduler.scheduleJob(job.schedule, async (fireDate) => {
                    console.log('run scheduled lane ' + job.lane.name + ': ' + fireDate);
                    this.application.addToHistory({ name: job.lane.name, description: 'running scheduled lane', type: 'Scheduled', time: Date.now() })
                    await this.application.runHook(this.application.getHook('BEFORE_ALL'));
                    await this.application.runLane(job.lane);
                    await this.application.runHook(this.application.getHook('AFTER_ALL'));
                });
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
    cancelScheduled(): JobType[] {
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
                express.post(hook.path, async (req, res) => {
                    console.log(`💌  running webhook ${hook.lane.name}`);
                    this.application.addToHistory({ name: hook.lane.name, description: 'running webhook', type: 'Webhook', time: Date.now() })
                    res.sendStatus(200)
                    await this.application.runLane(hook.lane, req.body);
                })
            })

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
    async promptLaneAndRun() {
        return this.application.promptLaneAndRun();
    }

    getArgs(): string[] {
        return this.application.getProgram().rawArgs.filter((arg, i) => i > 1);
    }

    getHistory(): HistoryEntry[] {
        return this.application.getHistory();
    }

    printHistory() {
        const history = this.getHistory();
        const table = new Table({

            head: ["Number", "Name", "Type", "Description"],
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
                , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
                , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
                , 'right': '║', 'right-mid': '╢', 'middle': '│'
            }
        });
        history.forEach((h, index) => table.push([`${index + 1}`, h.name, h.type, h.description || '']));
        console.log('The application started at ' + new Date(history[0].time));
        console.log(table.toString());
        console.log('The application took ' + this.msToHuman(history[history.length - 1].time - history[0].time));
    }

    private msToHuman(millisec) {

        const seconds = (millisec / 1000);

        const minutes = (millisec / (1000 * 60));

        const hours = (millisec / (1000 * 60 * 60));

        const days = (millisec / (1000 * 60 * 60 * 24));

        if (seconds < 60) {
            return seconds.toFixed(1) + " Sec";
        } else if (minutes < 60) {
            return minutes.toFixed(1)  + " Min";
        } else if (hours < 24) {
            return hours.toFixed(1)  + " Hrs";
        } else {
            return days.toFixed(1)  + " Days"
        }
    }
}