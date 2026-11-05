// Mailt tech@ als eigen HTML onder Geavanceerd is overgeslagen, maar alleen als die velden in deze push zijn gewijzigd.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const NAMEN = { footer: 'de footer', snelNaar: '"Snel naar"', oproep: '"Vrijwilligers gezocht"' };
const AAN = 'tech@scoutingsintsebastiaan.nl';
const { VOOR, NA, BREVO_API_KEY, RUN_URL, DRY_RUN } = process.env;

if (!existsSync('.geavanceerd-meldingen.json')) process.exit(0);
const fouten = JSON.parse(readFileSync('.geavanceerd-meldingen.json', 'utf8'));
if (!fouten.length) process.exit(0);

if (!VOOR || /^0+$/.test(VOOR)) {
  console.log('Geen vorige versie om mee te vergelijken; geen mail.');
  process.exit(0);
}
try {
  execFileSync('git', ['diff', '--quiet', VOOR, NA, '--', 'src/data/geavanceerd.json']);
  console.log('Eigen HTML is in deze push niet gewijzigd; geen mail.');
  process.exit(0);
} catch (e) {
  if (e.status !== 1) throw e;
}

const regels = fouten.map((f) => `- ${NAMEN[f.veld] ?? f.veld}: ${f.melding}`);
const tekst = [
  'Hallo,',
  '',
  'De eigen HTML die onder "Geavanceerd (HTML)" in het beheer is opgeslagen, is niet gebruikt:',
  '',
  ...regels,
  '',
  'Op de website staat voor dat blok de normale versie. De rest van de site is gewoon bijgewerkt.',
  '',
  'Herstel de HTML, of maak het veld leeg en klik op Opslaan:',
  'https://www.scoutingsintsebastiaan.nl/admin/#/collections/geavanceerd/entries/geavanceerd',
  '',
  ...(RUN_URL ? ['Details van deze update:', RUN_URL, ''] : []),
  'Dit is een automatisch bericht van de website.',
].join('\n');

if (DRY_RUN) {
  console.log(tekst);
  process.exit(0);
}
const res = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({
    sender: { name: 'Website Scouting St. Sebastiaan', email: AAN },
    to: [{ email: AAN }],
    subject: 'Website: eigen HTML niet gebruikt',
    textContent: tekst,
  }),
});
if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
console.log(`Mail verstuurd naar ${AAN}.`);
