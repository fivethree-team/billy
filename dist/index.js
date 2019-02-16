"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./core/core"));
__export(require("./core/decorators"));
__export(require("./core/api"));
var typescript_mix_1 = require("typescript-mix");
exports.usesPlugins = typescript_mix_1.use;
