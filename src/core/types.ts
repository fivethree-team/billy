import { BillyAPI } from "./api";

export interface AppOptions {
    name?: string;
    description?: string;
    allowUnknownOptions?: boolean;
}
export interface LaneType {
    name: string;
    description: string;
}
export interface JobType {
    name: string;
    schedule: string;
    lane: LaneType;
    scheduler: any;
}
export interface HookType {
    name: HookName;
    lane: LaneType;
}

export interface ParamType {
    name: string;
    description: string;
    value?: string;
    optional?: boolean;
    lane?: string;
    index: number;
}
export interface ParamOptions {
    name: string;
    description: string;
    optional?: boolean;
}
export interface WebHookType {
    path: string;
    lane: LaneType;
}
export interface MethodMeta {
    propertyKey: string;
    contextIndex: number;
}

export type HookName = 'ON_START' | 'ERROR' | 'BEFORE_ALL' | 'AFTER_ALL' | 'BEFORE_EACH' | 'AFTER_EACH';

export interface LaneContext {
    name: string;
    description: string;
    directory: string;
    api: BillyAPI;
}

export class History {
    constructor() {
        this.entries = [];
    }
    entries: HistoryEntry[];
}

export interface HistoryEntry {
    type: 'Lane' | 'Hook' | 'Webhook' | 'Scheduled' | 'Action';
    time: number;
    name: string;
    description: string;
}

export interface ActionType {
    name: string;
    plugin: string;
    description: string;
}