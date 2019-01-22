import { LaneType, LaneContext, JobType, HookType, HookName } from './types';
export declare class Core {
    lanes: LaneType[];
    jobs: JobType[];
    hooks: HookType[];
    appDir: any;
    instance: any;
    run(): Promise<void>;
    private parseJSON;
    getParamLanes(): LaneType[];
    presentLanes(): Promise<void>;
    takeLane(lane: LaneType, ...args: any[]): Promise<any>;
    takeMultiple(lanes: LaneType[]): Promise<void>;
    processAsyncArray(array: any[], asyncFunc: any): Promise<void>;
    getHook(type: 'BEFORE_ALL' | 'AFTER_ALL' | 'AFTER_EACH' | 'BEFORE_EACH' | 'ERROR'): HookType;
    getLaneContext(lane: LaneType): LaneContext;
    runHook(lane: LaneType, ...args: any[]): Promise<any>;
    schedule(): JobType[];
    cancelScheduled(): void;
}
export declare function App(): (target: any) => void;
export declare function Lane(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Scheduled(schedule: string | any): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Hook(hook: HookName): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Plugin(name: string): (target: Function) => void;
export declare function Action(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare class Decorators {
    app: Core;
    AppDecorator(): (target: any) => void;
    LaneDecorator(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    ScheduledDecorator(schedule: string | any): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    HookDecorator(name: HookName): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    PluginDecorator(name: string): (target: Function) => void;
    ActionDecorator(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
}
