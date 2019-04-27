"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
function processAsyncArray(array, asyncFunc) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const el of array) {
            yield asyncFunc(el);
        }
        ;
    });
}
exports.processAsyncArray = processAsyncArray;
function parseJSON(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}
exports.parseJSON = parseJSON;
function exists(path) {
    return fs.existsSync(path);
}
exports.exists = exists;
