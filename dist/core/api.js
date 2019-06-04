"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const webhook_1 = require("./webhook");
const scheduler_1 = require("./scheduler");
const util_1 = require("../util/util");
/**
 * The CoreApi Class can be used to interact with the core application.
 *
 * @export
 * @class CoreApi
 */
class CoreApi {
    constructor(controller) {
        this.controller = controller;
        this.webhooks = new webhook_1.WebHook(this.controller);
        this.scheduler = new scheduler_1.Scheduler(this.controller);
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
