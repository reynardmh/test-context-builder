/// <reference types="bluebird" />
import * as Promise from 'bluebird';
export declare type TestContextDefineFn = (context?: any) => Promise<any>;
export declare class TestContext {
    context: {};
    static sharedContexts: any;
    static define(name: string, dependencies: TestContextDefineFn | string[], fn?: TestContextDefineFn): void;
    static clearDefinition(): void;
    private loadedContext;
    constructor(context?: {});
    load(names: string[] | string): Promise<any>;
    mergeContext(newContext: any): void;
    clearContext(): void;
    get(name: any): any;
}
