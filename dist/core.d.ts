import { PluginType, LaneType, JobType, HookType, HookName } from './types';
export declare class Application {
    plugins: PluginType[];
    lanes: LaneType[];
    jobs: JobType[];
    hooks: HookType[];
    appDir: any;
    constructor();
    load(): Promise<void>;
    run(): Promise<void>;
    private fileExists;
    private parseJSON;
    private loadPlugins;
    getParamLanes(): LaneType[];
    presentLanes(): Promise<void>;
    takeLane(lane: LaneType, ...args: any[]): Promise<any>;
    takeMultiple(lanes: LaneType[]): Promise<void>;
    processAsyncArray(array: any[], asyncFunc: any): Promise<void>;
    private getLaneContext;
    runHook(hookName: HookName, lane: LaneType): Promise<void>;
    schedule(): JobType[];
    cancelScheduled(): void;
}
export declare function App(): (target: any) => void;
export declare function Lane(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Scheduled(schedule: string | any): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Hook(hook: HookName): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Plugin(name: string): (target: Function) => void;
export declare function Action(name: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare class Decorators {
    app: Application;
    AppDecorator(): (target: any) => void;
    LaneDecorator(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    ScheduledDecorator(schedule: string | any): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    HookDecorator(name: HookName): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    PluginDecorator(name: string): (target: Function) => void;
    ActionDecorator(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
}
