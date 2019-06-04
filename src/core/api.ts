import { AppController } from './app';
import { WebHook } from './webhook';
import { Scheduler } from './scheduler';
import { HistoryEntry, HistoryAction } from "../types";
import { msToHuman, createTable } from '../util/util';


/**
 * The CoreApi Class can be used to interact with the core application.
 *
 * @export
 * @class CoreApi
 */
export default class CoreApi {

    public webhooks: WebHook;
    public scheduler: Scheduler;

    constructor(private controller: AppController) {
        this.webhooks = new WebHook(this.controller);
        this.scheduler = new Scheduler(this.controller);
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