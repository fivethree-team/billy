import { Core } from './core';

export interface LaneType {
    name: string;
    description: string;
    // lane: Function;
    args?: any[];
}
export interface JobType {
    name: string;
    schedule: string;
    lane: LaneType;
    scheduler: any;
    args?: any[];
}
export interface HookType {
    name: HookName;
    lane: LaneType;
    args?: any[];
}

export type HookName = 'ERROR' | 'BEFORE_ALL' | 'AFTER_ALL' | 'BEFORE_EACH' | 'AFTER_EACH';

export interface LaneContext {
    lane: LaneType,
    app: Core
}