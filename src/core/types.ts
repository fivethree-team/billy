import { CoreApi } from "./api";

export interface AppOptions {
    name?: string;
    description?: string;
    allowUnknownOptions?: boolean;
}
export interface LaneType {
    name: string;
    description: string;
}

export interface ActionType {
    name: string;
    plugin: string;
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
    propertyKey: string;
    description: string;
    value?: string;
    optional?: boolean;
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
export interface ContextType {
    propertyKey: string;
    contextIndex: number;
}

export type HookName = 'ON_START' | 'ERROR' | 'BEFORE_ALL' | 'AFTER_ALL' | 'BEFORE_EACH' | 'AFTER_EACH';

export const onStart: HookName = 'ON_START';
export const onError: HookName = 'ERROR';
export const beforeAll: HookName = 'BEFORE_ALL';
export const afterAll: HookName = 'AFTER_ALL';
export const beforeEach: HookName = 'BEFORE_EACH';
export const afterEach: HookName = 'AFTER_EACH';
export interface Context {
    name: string;
    description: string;
    directory: string;
    api: CoreApi;
}

export class History {
    constructor() {
        this.entries = [];
    }
    entries: HistoryEntry[];
}

export interface HistoryEntry {
    type: 'Lane' | 'Hook' | 'Webhook' | 'Scheduled' | 'Action';
    time: number;
    name: string;
    description: string;
}