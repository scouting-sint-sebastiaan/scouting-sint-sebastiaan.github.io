// Laat de build mislukken op kapotte eigen HTML, zodat de live site op de vorige versie blijft staan.
import { readFileSync } from 'node:fs';
import { HtmlValidate } from 'html-validate';

const validator = new HtmlValidate({
  root: true,
  rules: { 'close-order': 'error', 'close-attr': 'error', 'no-dup-attr': 'error' },
});

export async function controleerHtml(velden) {
  const fouten = [];
  for (const [veld, html] of Object.entries(velden)) {
    if (!html?.trim()) continue;
    const { results } = await validator.validateString(html);
    for (const r of results) {
      for (const m of r.messages) fouten.push(`${veld}, regel ${m.line}: ${m.message}`);
    }
  }
  return fouten;
}

export default function controleerEigenHtml() {
  return {
    name: 'controleer-html',
    hooks: {
      'astro:build:start': async () => {
        const { footer, snelNaar, oproep } = JSON.parse(readFileSync(new URL('../src/data/geavanceerd.json', import.meta.url), 'utf8'));
        const fouten = await controleerHtml({ footer, snelNaar, oproep });
        if (fouten.length) throw new Error(`Kapotte eigen HTML onder Geavanceerd:\n${fouten.join('\n')}`);
      },
    },
  };
}
