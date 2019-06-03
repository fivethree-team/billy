import { AppController } from './app';
import { JobModel, HistoryEntry, HistoryAction } from "./types";
/**
 * The CoreApi Class can be used to interact with the core application.
 *
 * @export
 * @class CoreApi
 */
export default class CoreApi {
    private controller;
    constructor(controller: AppController);
    /**
     * start all the scheduled Jobs in your billy application
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    startJobs(): JobModel[];
    /**
     * schedule a single job
     *
     * @param {JobModel} job job that will be scheduled
     * @returns {JobModel} returns the updated job, with scheduler attached
     * @memberof CoreApi
     */
    startJob(job: JobModel): JobModel;
    /**
     * cancel all scheduled lanes
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    cancelJobs(): JobModel[];
    /**
     * start the webhooks server
     *
     * @param {number} [port=7777]
     * @memberof CoreApi
     */
    startWebhooks(port?: number): void;
    /**
     * Stop webhooks server
     *
     * @memberof CoreApi
     */
    stopWebhooks(): void;
    /**
     * Presents the Selection Screen
     *
     * @returns
     * @memberof CoreApi
     */
    promptLaneAndRun(): Promise<void>;
    getHistory(): HistoryEntry[];
    addToHistory(...historyItem: HistoryEntry[]): void;
    getLatestHistoryEntry(): {
        latest: HistoryEntry;
        addToHistory: (...historyItem: HistoryAction[]) => void;
    };
    printHistory(): void;
}
