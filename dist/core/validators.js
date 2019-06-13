"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util/util");
exports.isNumber = {
    validate: (param) => !isNaN(param),
    invalidText: (param) => `The parameter ${param} should be a number.`
};
exports.isNumberArray = () => {
    const validator = {
        validate: (mapped) => mapped.filter(p => exports.isNumber.validate(p)).length === 0,
        mapBefore: (list) => list.replace(', ', ',').split(','),
        invalidText: () => `Please specify a comma separated list of numbers.`
    };
    return validator;
};
exports.isBoolean = () => {
    const validator = {
        validate: (mapped) => mapped,
        mapBefore: (value) => ['false', 'true', true, false, 'yes', 'no', 'y', 'n', '1', '0'].some(s => s === value),
        invalidText: () => `The parameter should be of type boolean. (Usage: [true/false , y/n, ...])`
    };
    return validator;
};
exports.isString = {
    validate: (param) => typeof param === 'string',
    invalidText: (param) => `The parameter ${param} should be a string.`
};
exports.isStringArray = () => {
    const validator = {
        validate: (mapped) => mapped.filter(p => exports.isString.validate(p)).length === 0,
        mapBefore: (list) => list.replace(', ', ',').split(','),
        invalidText: () => `Please specify a comma seperated list.`
    };
    return validator;
};
exports.isExistingPath = {
    validate: (param) => util_1.exists(param.startsWith('/') ? param : process.cwd() + '/' + param),
    invalidText: (param) => `File or directory ${param} doesn't exist. Please choose another one.`
};
exports.isNonExistingPath = {
    validate: (param) => !util_1.exists(param.startsWith('/') ? param : process.cwd() + '/' + param),
    invalidText: (param) => `File or directory ${param} already exists. Please choose another one.`
};
