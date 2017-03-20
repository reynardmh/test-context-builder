import * as Promise from 'bluebird';

export type TestContextDefineFn = (context?: any) => Promise<any>;

export class TestContext {

  static sharedContexts: any = {};
  static define(name: string, dependencies: TestContextDefineFn | string[], fn?: TestContextDefineFn) {
    if (this.sharedContexts[name]) {
      throw(`Context '${name}' is already defined`);
    } else {
      if (typeof dependencies === "function") {
        fn = dependencies;
        dependencies = [];
      }
      this.sharedContexts[name] = {
        dependencies: dependencies,
        fn: fn
      };
    }
  }
  static clearDefinition() {
    this.sharedContexts = {};
  }

  private loadedContext = new Set();

  constructor(public context = {}) {}

  load(names: string[] | string): Promise<any> {
    if (names.constructor === String) {
      names = <string[]>[names];
    }

    return Promise.each(<string[]>names, (name) => {
      if (!TestContext.sharedContexts[name]) {
        throw(`Context '${name}' is not defined`);
      } else {
        let sharedCtx = TestContext.sharedContexts[name];
        return Promise.each(sharedCtx.dependencies, (dependency) => {
          if (this.loadedContext.has(dependency)) {
            return Promise.resolve(this.context);
          } else {
            return this.load(<string>dependency);
          }
        }).then(() => {
          if (this.loadedContext.has(name)) {
            return Promise.resolve(this.context);
          } else {
            return sharedCtx.fn(this.context).then((newContext) => {
              this.loadedContext.add(name);
              this.mergeContext(newContext);
              return this.context;
            });
          }
        });
      }
    }).then((res) => this.context);
  }

  mergeContext(newContext) {
    Object.keys(newContext).forEach((key) => {
      if (this.context[key]) {
        throw(`Context key: ${key} is already defined.`);
      } else {
        this.context[key] = newContext[key];
      }
    });
  }

  clearContext() {
    this.context = {};
    this.loadedContext = new Set();
  }

  get(name): any {
    return this.context[name];
  }
}
