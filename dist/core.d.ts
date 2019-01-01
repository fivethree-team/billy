import { PluginType, LaneType } from './types';
export declare class Application {
    plugins: PluginType[];
    lanes: LaneType[];
    appDir: any;
    constructor();
    load(): Promise<void>;
    run(): Promise<void>;
    private fileExists;
    private parseJSON;
    private loadPlugins;
    getParamLanes(): LaneType[];
    presentLanes(): Promise<void>;
    takeLane(lane: LaneType): Promise<void>;
    takeMultiple(lanes: LaneType[]): Promise<void>;
    processLanes(lanes: LaneType[], asyncFunc: any): Promise<void>;
    private getLaneContext;
}
export declare function App(): (target: any) => void;
export declare function Lane(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Plugin(name: string): (target: Function) => void;
export declare function Action(name: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare class Decorators {
    app: Application;
    AppDecorator(): (target: any) => void;
    LaneDecorator(description: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    PluginDecorator(name: string): (target: Function) => void;
    ActionDecorator(name: string): (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
}
