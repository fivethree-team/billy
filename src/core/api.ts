import { Core } from "./core";
import { JobType } from "./types";

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
}