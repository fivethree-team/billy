import { HistoryEntry } from "./types";

export class History {
    private entries: HistoryEntry[] = [];

    addToHistory(...historyItem: HistoryEntry[]) {
        this.entries.push(...historyItem);
    }

    getHistory(): HistoryEntry[] {
        return this.entries;
    }

    getLatest(): HistoryEntry {
        return this.entries.reverse()
        .find(entry => entry.type !== 'Action')
    }
}
