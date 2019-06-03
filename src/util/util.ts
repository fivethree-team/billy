const fs = require('fs');
const path = require('path');
import chalk from 'chalk';
import Table from 'cli-table';

export async function processAsyncArray(array: any[], asyncFunc) {
    for (const el of array) {
        await asyncFunc(el);
    };
}

export interface Wrapable {
    name: string;
}


export async function wrapForEach(instance, source: Wrapable[], before?: Function, after?: Function) {
    await processAsyncArray(source, async (s) => {
        const original = instance[s.name].bind(instance)
        instance[s.name] = async (...args) => {
            if (before) {
                await before(s);
            }
            const ret = await original(...args);
            if (after) {
                await after(s);
            }
            return ret;
        }
    });
    return instance;
}

export function parseJSON(path): any {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export function exists(path): any {
    return fs.existsSync(path);
}

export function createTable(head: string[]) {
    return new Table({
        head: head,
        chars: {
            'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
            , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
            , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
            , 'right': '║', 'right-mid': '╢', 'middle': '│'
        }
    });
}

export function colorize(color: string, input: string) {
    return chalk.keyword(color)(input);
}

export function msToHuman(millisec) {

    const seconds = (millisec / 1000);

    const minutes = (millisec / (1000 * 60));

    const hours = (millisec / (1000 * 60 * 60));

    const days = (millisec / (1000 * 60 * 60 * 24));

    if (seconds < 60) {
        return seconds.toFixed(1) + " Sec";
    } else if (minutes < 60) {
        return minutes.toFixed(1) + " Min";
    } else if (hours < 24) {
        return hours.toFixed(1) + " Hrs";
    } else {
        return days.toFixed(1) + " Days"
    }
}

export function splitCommaSeperated(aliases: string) {
    if (aliases) {
        return aliases.replace(' ', '').split(',');
    }
}

export const appDir = path.resolve(path.dirname(require.main.filename) + '/..');
