"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var TestContext = (function () {
    function TestContext(context) {
        if (context === void 0) { context = {}; }
        this.context = context;
        this.loadedContext = new Set();
    }
    TestContext.define = function (name, dependencies, fn) {
        if (this.sharedContexts[name]) {
            throw ("Context '" + name + "' is already defined");
        }
        else {
            if (typeof dependencies === "function") {
                fn = dependencies;
                dependencies = [];
            }
            this.sharedContexts[name] = {
                dependencies: dependencies,
                fn: fn
            };
        }
    };
    TestContext.clearDefinition = function () {
        this.sharedContexts = {};
    };
    TestContext.prototype.load = function (names) {
        var _this = this;
        if (names.constructor === String) {
            names = [names];
        }
        return Promise.each(names, function (name) {
            if (!TestContext.sharedContexts[name]) {
                throw ("Context '" + name + "' is not defined");
            }
            else {
                var sharedCtx_1 = TestContext.sharedContexts[name];
                return Promise.each(sharedCtx_1.dependencies, function (dependency) {
                    if (_this.loadedContext.has(dependency)) {
                        return Promise.resolve(_this.context);
                    }
                    else {
                        return _this.load(dependency);
                    }
                }).then(function () {
                    if (_this.loadedContext.has(name)) {
                        return Promise.resolve(_this.context);
                    }
                    else {
                        return sharedCtx_1.fn(_this.context).then(function (newContext) {
                            _this.loadedContext.add(name);
                            _this.mergeContext(newContext);
                            return _this.context;
                        });
                    }
                });
            }
        }).then(function (res) { return _this.context; });
    };
    TestContext.prototype.mergeContext = function (newContext) {
        var _this = this;
        Object.keys(newContext).forEach(function (key) {
            if (_this.context[key]) {
                throw ("Context key: " + key + " is already defined.");
            }
            else {
                _this.context[key] = newContext[key];
            }
        });
    };
    TestContext.prototype.clearContext = function () {
        this.context = {};
        this.loadedContext = new Set();
    };
    TestContext.prototype.get = function (name) {
        return this.context[name];
    };
    return TestContext;
}());
TestContext.sharedContexts = {};
exports.TestContext = TestContext;
//# sourceMappingURL=test-context.js.map