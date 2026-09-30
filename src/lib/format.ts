const tz = 'Europe/Amsterdam';
const nl = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('nl-NL', { timeZone: tz, ...o });

export const datum = (d: Date) => nl(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const korteDatum = (d: Date) => nl(d, { day: 'numeric', month: 'long', year: 'numeric' });
export const isoDag = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: tz });
