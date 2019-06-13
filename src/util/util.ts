import { resolve, dirname } from 'path';
import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import Table from 'cli-table';
import { CommandModel, ActionModel } from '../types';

export async function processAsyncArray<T>(array: T[], asyncFunction: (item: T) => Promise<any>) {
    for (const el of array) {
        await asyncFunction(el);
    };
}

export async function wrapForEach<T extends CommandModel | ActionModel>(instance, source: T[], before?: (s: T, ...args: any[]) => Promise<any>, after?: (s: T, ...args: any[]) => Promise<any>) {
    await processAsyncArray(source, async (s: T) => {
        const original = instance[s.name].bind(instance)
        instance[s.name] = async (...args) => {
            if (before) {
                await before(s, ...args);
            }
            const ret = await original(...args);
            if (after) {
                await after(s, ...args);
            }
            return ret;
        }
    });
    return instance;
}

export function parseJSON(path): any {
    return JSON.parse(readFileSync(path, 'utf8'));
}

export function exists(path): boolean {
    return existsSync(path);
}

export function createTable(head: string[], blank = false, color = 'green') {
    return new Table({
        head: head,
        style: { 'head': [color, 'bold'], 'padding-left': 1, 'padding-right': 2 },
        chars: blank ? {
            'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
            , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
            , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
            , 'right': '', 'right-mid': '', 'middle': ' '
        } : {}
    });
}

export function colorize(color: string, input: string) {
    return chalk.keyword(color)(input);
}

export function bold(input: string) {
    return chalk.bold(input);
}

export function msToHuman(millisec) {

    const seconds = (millisec / 1000);

    const minutes = (millisec / (1000 * 60));

    const hours = (millisec / (1000 * 60 * 60));

    const days = (millisec / (1000 * 60 * 60 * 24));

    if (seconds < 60) {
        return seconds.toFixed(1) + " s";
    } else if (minutes < 60) {
        return minutes.toFixed(1) + " min";
    } else if (hours < 24) {
        return hours.toFixed(1) + " h";
    } else {
        return days.toFixed(1) + " days"
    }
}

export function splitCommaSeperated(aliases: string) {
    if (aliases) {
        return aliases.replace(' ', '').split(',');
    }
}

export const appDir = resolve(dirname(require.main.filename) + '/..');
