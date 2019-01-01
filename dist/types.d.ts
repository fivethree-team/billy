import { Application } from './core';
export interface Pluginfile {
    plugins: string[];
}
export interface PluginType {
    name: string;
    actions: ActionType[];
}
export interface ActionType {
    name: string;
    key: string;
    action: Function;
}
export interface LaneType {
    name: string;
    description: string;
    lane: Function;
    args?: any[];
}
export interface LaneContext {
    lane: LaneType;
    app: Application;
    [action: string]: any;
}
