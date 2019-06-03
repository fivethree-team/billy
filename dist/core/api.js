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
const util_1 = require("../util/util");
const node_schedule_1 = __importDefault(require("node-schedule"));
const express = require('express')();
const bodyParser = require('body-parser');
express.use(bodyParser.json());
/**
 * The CoreApi Class can be used to interact with the core application.
 *
 * @export
 * @class CoreApi
 */
class CoreApi {
    constructor(controller) {
        this.controller = controller;
    }
    /**
     * start all the scheduled Jobs in your billy application
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    startJobs() {
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
    startJob(job) {
        const instance = node_schedule_1.default.scheduleJob(job.schedule, (fireDate) => __awaiter(this, void 0, void 0, function* () {
            this.controller.history.addToHistory({ name: job.lane.name, description: 'running scheduled lane', type: 'Job', time: Date.now(), history: [] });
            const beforeAll = this.controller.getHook('BEFORE_ALL');
            yield this.controller.runLane(beforeAll ? beforeAll.lane : null);
            yield this.controller.runLane(job.lane);
            const afterAll = this.controller.getHook('AFTER_ALL');
            yield this.controller.runLane(afterAll ? afterAll.lane : null);
        }));
        job.scheduler = instance;
        return job;
    }
    /**
     * cancel all scheduled lanes
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    cancelJobs() {
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
            express.post(hook.path, (req, res) => __awaiter(this, void 0, void 0, function* () {
                this.controller.history.addToHistory({ name: hook.lane.name, description: 'running webhook', type: 'Webhook', time: Date.now(), history: [] });
                res.sendStatus(200);
                yield this.controller.runLane(hook.lane, req.body);
            }));
        });
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
    promptLaneAndRun() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.controller.promptLaneAndRun();
        });
    }
    getHistory() {
        return this.controller.history.getHistory();
    }
    addToHistory(...historyItem) {
        return this.controller.history.addToHistory(...historyItem);
    }
    getLatestHistoryEntry() {
        const latest = this.controller.history.getLatest();
        const addToHistory = (...historyItem) => {
            latest.history.push(...historyItem);
        };
        return { latest: latest, addToHistory: addToHistory };
    }
    printHistory() {
        const history = this.getHistory();
        const table = util_1.createTable(["Number", "Name", "Type", "Description"]);
        history.forEach((h, index) => {
            table.push([`${index + 1}`, h.name, h.type, h.description || '']);
            h.history.forEach((st, i) => {
                table.push(['', '', '', st.description]);
            });
        });
        console.log('The application started at ' + new Date(history[0].time));
        console.log(table.toString());
        console.log('The application took ' + util_1.msToHuman(history[history.length - 1].time - history[0].time));
    }
}
exports.default = CoreApi;
