// Controleert de eigen HTML onder Geavanceerd. Kapotte of niet-toegestane HTML wordt overgeslagen:
// dat blok toont dan de normale versie, en de rest van de site wordt gewoon bijgewerkt.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { HtmlValidate } from 'html-validate';

const BRON = new URL('../src/data/geavanceerd.json', import.meta.url);
const MELDINGEN = new URL('../.geavanceerd-meldingen.json', import.meta.url);
const MODULE = 'virtual:geavanceerd';
const VELDEN = ['footer', 'snelNaar', 'oproep'];

const validator = new HtmlValidate({
  root: true,
  rules: { 'close-order': 'error', 'close-attr': 'error', 'no-dup-attr': 'error' },
});

const VERBODEN = [
  [/<\s*(script|style|iframe|link|object|embed|frame|frameset)\b/i, (m) => `<${m[1].toLowerCase()}> is niet toegestaan`],
  [/\son[a-z]+\s*=/i, () => 'attributen als onclick= zijn niet toegestaan'],
  [/(href|src|action)\s*=\s*["']?\s*javascript:/i, () => 'javascript:-links zijn niet toegestaan'],
];

export async function controleerHtml(velden) {
  const fouten = [];
  for (const [veld, html] of Object.entries(velden)) {
    if (!html?.trim()) continue;
    for (const [patroon, melding] of VERBODEN) {
      const m = html.match(patroon);
      if (m) fouten.push({ veld, melding: melding(m) });
    }
    const { results } = await validator.validateString(html);
    for (const r of results) for (const m of r.messages) fouten.push({ veld, melding: `regel ${m.line}: ${m.message}` });
  }
  return fouten;
}

export default function controleerEigenHtml() {
  return {
    name: 'controleer-html',
    hooks: {
      'astro:config:setup': ({ updateConfig, logger }) => {
        rmSync(MELDINGEN, { force: true });
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'geavanceerd-gecontroleerd',
                resolveId: (id) => (id === MODULE ? `\0${MODULE}` : undefined),
                load: async (id) => {
                  if (id !== `\0${MODULE}`) return undefined;
                  const data = JSON.parse(readFileSync(BRON, 'utf8'));
                  const fouten = await controleerHtml(Object.fromEntries(VELDEN.map((v) => [v, data[v]])));
                  const schoon = Object.fromEntries(VELDEN.map((v) => [v, fouten.some((f) => f.veld === v) ? '' : (data[v] ?? '')]));
                  if (fouten.length) writeFileSync(MELDINGEN, JSON.stringify(fouten, null, 2));
                  for (const f of fouten) logger.warn(`Geavanceerd, ${f.veld} overgeslagen (normale versie getoond): ${f.melding}`);
                  return `export default ${JSON.stringify(schoon)};`;
                },
              },
            ],
          },
        });
      },
    },
  };
}
