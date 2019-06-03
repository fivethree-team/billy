import { AppController } from './app';
import { JobModel, HistoryEntry, HistoryAction } from "./types";
import { msToHuman, createTable } from '../util/util';

import scheduler from 'node-schedule';

const express = require('express')();
const bodyParser = require('body-parser');
express.use(bodyParser.json());


/**
 * The CoreApi Class can be used to interact with the core application.
 *
 * @export
 * @class CoreApi
 */
export default class CoreApi {

    constructor(private controller: AppController) { }

    /**
     * start all the scheduled Jobs in your billy application
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    startJobs(): JobModel[] {
        this.controller.jobs
            .forEach(job => {
                job = this.startJob(job);
            });
        return this.controller.jobs;
    }

    /**
     * schedule a single job
     *
     * @param {JobModel} job job that will be scheduled
     * @returns {JobModel} returns the updated job, with scheduler attached
     * @memberof CoreApi
     */
    startJob(job: JobModel): JobModel {
        const instance = scheduler.scheduleJob(job.schedule, async (fireDate) => {
            this.controller.history.addToHistory({ name: job.lane.name, description: 'running scheduled lane', type: 'Job', time: Date.now(), history: [] })
            const beforeAll = this.controller.getHook('BEFORE_ALL');
            await this.controller.runLane(beforeAll ? beforeAll.lane : null);
            await this.controller.runLane(job.lane);
            const afterAll = this.controller.getHook('AFTER_ALL');
            await this.controller.runLane(afterAll ? afterAll.lane : null);
        });
        job.scheduler = instance;
        return job;
    }

    /**
     * cancel all scheduled lanes
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    cancelJobs(): JobModel[] {
        this.controller.jobs
            .forEach(job => {
                job.scheduler.cancel();
            });

        return this.controller.jobs;
    }

    /**
     * start the webhooks server
     *
     * @param {number} [port=7777]
     * @memberof CoreApi
     */
    startWebhooks(port = 7777) {

        this.controller.webhooks
            .forEach(hook => {
                express.post(hook.path, async (req, res) => {
                    this.controller.history.addToHistory({ name: hook.lane.name, description: 'running webhook', type: 'Webhook', time: Date.now(), history: [] })
                    res.sendStatus(200)
                    await this.controller.runLane(hook.lane, req.body);
                })
            })

        express.listen(port);
    }

    /**
     * Stop webhooks server
     *
     * @memberof CoreApi
     */
    stopWebhooks() {
        express.close();
    }

    /**
     * Presents the Selection Screen
     *
     * @returns
     * @memberof CoreApi
     */
    async promptLaneAndRun() {
        return this.controller.promptLaneAndRun();
    }


    getHistory(): HistoryEntry[] {
        return this.controller.history.getHistory();
    }

    addToHistory(...historyItem: HistoryEntry[]) {
        return this.controller.history.addToHistory(...historyItem);
    }

    getLatestHistoryEntry(): { latest: HistoryEntry, addToHistory: (...historyItem: HistoryAction[]) => void } {
        const latest = this.controller.history.getLatest();
        const addToHistory = (...historyItem: HistoryAction[]) => {
            latest.history.push(...historyItem);
        }
        return { latest: latest, addToHistory: addToHistory };
    }


    printHistory() {
        const history = this.getHistory();
        const table = createTable(["Number", "Name", "Type", "Description"]);
        history.forEach((h, index) => {
            table.push([`${index + 1}`, h.name, h.type, h.description || '']);
            h.history.forEach((st, i) => {
                table.push(['', '', '', st.description]);
            })
        });
        console.log('The application started at ' + new Date(history[0].time));
        console.log(table.toString());
        console.log('The application took ' + msToHuman(history[history.length - 1].time - history[0].time));
    }

}