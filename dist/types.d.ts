import { Core } from './core';
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
export declare type HookName = 'ERROR' | 'BEFORE_ALL' | 'AFTER_ALL' | 'BEFORE_EACH' | 'AFTER_EACH';
export interface LaneContext {
    lane: LaneType;
    app: Core;
}
