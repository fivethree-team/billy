import { exists } from "../util/util";
import { Validator } from "../types";

export const isNumber: Validator = {
    validate: (param) => !isNaN(param),
    invalidText: (param) => `The parameter ${param} should be a number.`
}
export const isNumberArray: Validator = {
    validate: (mapped) => mapped.filter(p => isNumber.validate(p)).length === 0,
    mapBefore: (list: any) => list.replace(', ', ',').split(','),
    invalidText: () => `Please specify a comma separated list of numbers.`
}

export const isBoolean: Validator = {
    validate: (value: any) => ['false', 'true', true, false, 'yes', 'no', 'y', 'n', '1', '0'].some(s => s === value),
    mapAfter: (value: any) => {
        return ['true', true, 'yes', 'y', '1'].some(s => s === value);
    },
    invalidText: () => `The parameter should be of type boolean. (Usage: [true/false , y/n, ...])`
}

export const isString: Validator = {
    validate: (param: any) => typeof param === 'string',
    invalidText: (param) => `The parameter ${param} should be a string.`
}
export const isStringArray: Validator = {
    validate: (mapped) => mapped.filter(p => isString.validate(p)).length === 0,
    mapBefore: (list: any) => list.replace(', ', ',').split(','),
    invalidText: () => `Please specify a comma seperated list.`
}


export const isExistingPath: Validator = {
    validate: (param) => exists(param.startsWith('/') ? param : process.cwd() + '/' + param),
    invalidText: (param) => `File or directory ${param} doesn't exist. Please choose another one.`
}

export const isNonExistingPath: Validator = {
    validate: (param) => !exists(param.startsWith('/') ? param : process.cwd() + '/' + param),
    invalidText: (param) => `File or directory ${param} already exists. Please choose another one.`
}