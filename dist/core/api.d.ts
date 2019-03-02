import { Core } from "./core";
import { JobType, HistoryEntry } from "./types";
/**
 * The CoreApi Class can be used to interact with the core application.
 * It is used to start the scheduling of Scheduled Lanes and make the Webhooks start listening.
 *
 * @export
 * @class CoreApi
 */
export declare class CoreApi {
    private application;
    constructor(application: Core);
    /**
     * start all the scheduled lanes in your billy application
     *
     * @returns {JobType[]}
     * @memberof CoreApi
     */
    scheduleAll(): JobType[];
    /**
     * cancel all scheduled lanes
     *
     * @returns {JobType[]}
     * @memberof CoreApi
     */
    cancelScheduled(): JobType[];
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
     * Presents the Standard Billy Lane Selection Screen
     *
     * @returns
     * @memberof CoreApi
     */
    promptLaneAndRun(): Promise<void>;
    getArgs(): string[];
    getHistory(): HistoryEntry[];
    printHistory(): void;
    private msToHuman;
}
