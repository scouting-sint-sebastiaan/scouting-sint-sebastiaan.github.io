import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../data/site.json';
import { isoDag } from './format';

export type Activiteit = CollectionEntry<'agenda'>;

export async function activiteiten(speltak?: string): Promise<Activiteit[]> {
  const alle = (await getCollection('agenda')).sort((a, b) => +a.data.date - +b.data.date);
  // Zonder speltakken is een activiteit voor de hele groep en hoort ze bij elke speltak.
  return speltak ? alle.filter((e) => e.data.speltakken.length === 0 || e.data.speltakken.includes(speltak)) : alle;
}

export const aankomend = (lijst: Activiteit[]) => {
  const vandaag = isoDag(new Date());
  return lijst.filter((e) => isoDag(e.data.date) >= vandaag);
};

export async function voorWie(e: Activiteit): Promise<string | undefined> {
  const namen = new Map((await getCollection('speltakken')).map((s) => [s.id, s.data.title]));
  const delen = [...e.data.speltakken.map((id) => namen.get(id) ?? id), ...(e.data.wie ? [e.data.wie] : [])];
  return delen.length > 0 ? delen.join(', ') : undefined;
}

const tekst = (v: string) => v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function vouw(regel: string): string {
  const enc = new TextEncoder();
  const delen: string[] = [];
  let huidig = '';
  for (const teken of regel) {
    const max = delen.length === 0 ? 75 : 74;
    if (enc.encode(huidig + teken).length > max) {
      delen.push(huidig);
      huidig = '';
    }
    huidig += teken;
  }
  delen.push(huidig);
  return delen.join('\r\n ');
}

const kaleTekst = (md: string) =>
  md
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 ($2)')
    .replace(/[*_`#>]/g, '')
    .trim();

function tijden(dag: string, tijd?: string) {
  const compact = dag.replace(/-/g, '');
  const m = tijd?.match(/(\d{1,2})[:.](\d{2})(?:\s*(?:-|–|tot)\s*(\d{1,2})[:.](\d{2}))?/);
  if (!m) {
    const volgende = new Date(`${dag}T12:00:00Z`);
    volgende.setUTCDate(volgende.getUTCDate() + 1);
    return [`DTSTART;VALUE=DATE:${compact}`, `DTEND;VALUE=DATE:${volgende.toISOString().slice(0, 10).replace(/-/g, '')}`];
  }
  const [, sh, sm, eh, em] = m;
  const start = Number(sh) * 60 + Number(sm);
  let eind = eh ? Number(eh) * 60 + Number(em) : start + 60;
  let einddag = dag;
  if (eind <= start || eind >= 24 * 60) {
    const d = new Date(`${dag}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    einddag = d.toISOString().slice(0, 10);
    eind = eind % (24 * 60);
  }
  const uur = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}${String(min % 60).padStart(2, '0')}00`;
  return [
    `DTSTART;TZID=Europe/Amsterdam:${compact}T${uur(start)}`,
    `DTEND;TZID=Europe/Amsterdam:${einddag.replace(/-/g, '')}T${uur(eind)}`,
  ];
}

const tijdzone = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Amsterdam',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export async function ical(lijst: Activiteit[], naam: string, agendaUrl: string): Promise<string> {
  const stempel = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const events: string[] = [];
  const vanaf = isoDag(new Date(Date.now() - 183 * 864e5));
  for (const e of lijst.filter((x) => isoDag(x.data.date) >= vanaf)) {
    const d = e.data;
    const wie = await voorWie(e);
    const beschrijving = [wie && `Voor: ${wie}`, e.body && kaleTekst(e.body)].filter(Boolean).join('\n\n');
    events.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@scoutingsintsebastiaan.nl`,
      `DTSTAMP:${stempel}`,
      ...tijden(isoDag(d.date), d.tijd),
      `SUMMARY:${tekst(d.title)}`,
      ...(d.locatie ? [`LOCATION:${tekst(d.locatie)}`] : []),
      ...(beschrijving ? [`DESCRIPTION:${tekst(beschrijving)}`] : []),
      `URL:${agendaUrl}`,
      'END:VEVENT',
    );
  }
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${site.naam}//Website//NL`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${tekst(naam)}`,
    'X-WR-TIMEZONE:Europe/Amsterdam',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
    ...tijdzone,
    ...events,
    'END:VCALENDAR',
  ]
    .map(vouw)
    .join('\r\n')
    .concat('\r\n');
}
