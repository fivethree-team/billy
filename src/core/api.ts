import { AppController } from './app';
import { WebHook } from './webhook';
import { Scheduler } from './scheduler';
import { HistoryEntry, HistoryAction } from "../types";
import { msToHuman, createTable, colorize, bold } from '../util/util';


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
        return this.controller.promptCommand();
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
        const now = Date.now();
        const table = createTable(["#", "Description"]);
        const history = this.getHistory();
        if (!history || history.length === 0) {
            return;
        }
        history.forEach((h, index) => {
            const content = this.getHistoryContent(history, h, index, now);
            table.push([`${index + 1}`, `${bold(h.type)}\n ${colorize('orange', '> ' + h.name)}\n${content}`]);
        });

        console.log('The application started at ' + new Date(history[0].time));
        console.log(table.toString());
        console.log('The application took ' + msToHuman(now - history[0].time));
    }

    private getHistoryContent(history: HistoryEntry[], h: HistoryEntry, index: number, now: number) {
        const duration = h && index + 1 < history.length ? history[index + 1].time - h.time : now - h.time;
        const table = createTable(["Name", "Description", "Duration"], true, 'white');
        h.history.forEach((his, i) => {
            const last = history.length > index + 1 ? history[index + 1].time - his.time : Date.now() - his.time;
            const dur = his && i + 1 < h.history.length ? h.history[i + 1].time - his.time : last;
            table.push([his.name, his.description.match(new RegExp('.{1,' + 60 + '}', 'g')).join('\n'), msToHuman(dur)]);
        });
        table.push(['', '', colorize('green', '~' + msToHuman(duration))])
        return `${h.description}${h.history.length > 0 ? '\n\n' + table.toString() : ''}`;


    }


}