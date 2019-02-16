import { LaneType, LaneContext, JobType, HookType, HookName, WebHookType, ParamType, ParamOptions, MethodMeta } from './types';
export declare class Core {
    lanes: LaneType[];
    jobs: JobType[];
    hooks: HookType[];
    webhooks: WebHookType[];
    actions: any[];
    plugins: any[];
    params: ParamType[];
    appDir: any;
    instance: any;
    meta: MethodMeta[];
    run(): Promise<void>;
    initParameters(program: any): void;
    initProgram(): any;
    private parseJSON;
    getLanesFromCommand(program: any): LaneType[];
    presentLanes(): Promise<void>;
    takeLane(lane: LaneType, ...args: any[]): Promise<any>;
    getArgs(lane: LaneType): Promise<any[]>;
    resolveParams(lane: LaneType): Promise<ParamType[]>;
    takeMultiple(lanes: LaneType[]): Promise<void>;
    processAsyncArray(array: any[], asyncFunc: any): Promise<void>;
    getHook(type: 'BEFORE_ALL' | 'AFTER_ALL' | 'AFTER_EACH' | 'BEFORE_EACH' | 'ERROR'): LaneType;
    getLaneContext(lane: LaneType): LaneContext;
    runHook(lane: LaneType, ...args: any[]): Promise<any>;
    schedule(): JobType[];
    startWebhooks(port?: number): void;
    cancelScheduled(): void;
}
export declare function App(): (target: any) => void;
export declare function Lane(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Scheduled(schedule: string | any): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Hook(hook: HookName): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Webhook(path: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Plugin(name: string): (target: Function) => void;
export declare function Action(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Param(param: ParamType): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function param(options: ParamOptions | string): any;
export declare function context(): (target: Object, propertyKey: string, parameterIndex: number) => void;
export declare class Decorators {
    app: Core;
    AppDecorator(): (target: any) => void;
    LaneDecorator(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    ScheduledDecorator(schedule: string | any): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    HookDecorator(name: HookName): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    WebhookDecorator(path: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    PluginDecorator(name: string): (target: Function) => void;
    ActionDecorator(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    ParamDecorator(param: ParamType): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    paramDecorator(options: ParamOptions | string): any;
    contextDecorator(): (target: Object, propertyKey: string, parameterIndex: number) => void;
}
