
export function every(value: number) {
    const ret = {
        seconds: `*/${value} * * * * *`,
        mins: `*/${value} * * * *`,
        hours: `* */${value} * * *`,
        days: `* * */${value} * *`,
        months: `* * * */${value} *`,
        dayOfWeek: `* * * * */${value}`,
    }
    return ret;
}