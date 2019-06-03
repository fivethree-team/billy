import CoreApi from "./api";

export interface AppOptions {
    name?: string;
    description?: string;
    allowUnknownOptions?: boolean;
}

export interface LaneOptions {
    alias?: string;
    description: string;
}
export interface LaneModel {
    name: string;
    options: LaneOptions;
}

export interface ActionModel {
    name: string;
    plugin: string;
    description: string;
}
export interface JobModel {
    name: string;
    schedule: string;
    lane: LaneModel;
    scheduler: any;
}
export interface HookModel {
    type: HookName;
    lane: LaneModel;
}

export interface ParamModel {
    name: string;
    propertyKey: string;
    value?: string;
    index: number;
    options: ParamOptions;
}
export interface ParamOptions {
    name: string;
    description: string;
    optional?: boolean;
}
export interface WebHookModel {
    path: string;
    lane: LaneModel;
}
export interface ContextModel {
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
export class Context {
    name: string;
    description: string;
    directory: string;
    workingDirectory: string;
    api: CoreApi;
}

export interface HistoryAction{
    description: string;
}

export interface HistoryEntry {
    type: 'Lane' | 'Hook' | 'Webhook' | 'Job' | 'Action';
    time: number;
    name: string;
    description: string;
    history?: HistoryAction[];
}