"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class History {
    constructor() {
        this.entries = [];
    }
    addToHistory(...historyItem) {
        this.entries.push(...historyItem);
    }
    getHistory() {
        return this.entries;
    }
    getLatest() {
        return this.entries.reverse()
            .find(entry => entry.type !== 'Action');
    }
}
exports.History = History;
