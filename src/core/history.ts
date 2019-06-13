import { HistoryEntry } from "../types";

export class History {

    private entries: HistoryEntry[] = [];

    addToHistory(...historyItem: HistoryEntry[]) {
        this.entries.push(...historyItem);
    }

    getHistory(): HistoryEntry[] {
        return this.entries;
    }

    getLatest(): HistoryEntry {
        return this.entries[this.entries.length - 1];
    }

    clear() {
        this.entries = [];
    }

}
