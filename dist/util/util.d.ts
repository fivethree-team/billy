export declare function processAsyncArray(array: any[], asyncFunc: any): Promise<void>;
export interface Wrapable {
    name: string;
}
export declare function wrapForEach(instance: any, source: Wrapable[], before?: Function, after?: Function): Promise<any>;
export declare function parseJSON(path: any): any;
export declare function exists(path: any): any;
export declare function createTable(head: string[]): any;
export declare function colorize(color: string, input: string): string;
export declare function msToHuman(millisec: any): string;
export declare function splitCommaSeperated(aliases: string): string[];
export declare const appDir: any;
