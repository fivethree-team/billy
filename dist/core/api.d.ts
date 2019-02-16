import { Core } from "./core";
import { JobType } from "./types";
/**
 * The BillyApi Class can be used to interact with the core application.
 * It is used to start the scheduling of Scheduled Lanes and make the Webhooks start listening.
 *
 * @export
 * @class BillyAPI
 */
export declare class BillyAPI {
    private application;
    constructor(application: Core);
    /**
     * start all the scheduled lanes in your billy application
     *
     * @returns {JobType[]}
     * @memberof BillyAPI
     */
    scheduleAll(): JobType[];
    /**
     * cancel all scheduled lanes
     *
     * @returns {JobType[]}
     * @memberof BillyAPI
     */
    cancelScheduled(): JobType[];
    /**
     * start the webhooks server
     *
     * @param {number} [port=7777]
     * @memberof BillyAPI
     */
    startWebhooks(port?: number): void;
    /**
     * Stop webhooks server
     *
     * @memberof BillyAPI
     */
    stopWebhooks(): void;
    /**
     * Presents the Standard Billy Lane Selection Screen
     *
     * @returns
     * @memberof BillyAPI
     */
    promptLaneAndRun(): Promise<void>;
}
