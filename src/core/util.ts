const fs = require('fs');

export async function processAsyncArray(array: any[], asyncFunc) {
    for (const el of array) {
        await asyncFunc(el);
    };
}

export function parseJSON(path): any {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export function exists(path): any {
    return fs.existsSync(path);
}