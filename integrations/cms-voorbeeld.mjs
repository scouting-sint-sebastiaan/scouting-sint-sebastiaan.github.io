// Laat het voorbeeld in het beheer de stijl van de site gebruiken: registreert na de build de CSS van de homepagina.
import { readFile, writeFile } from 'node:fs/promises';

export default function cmsVoorbeeld() {
  return {
    name: 'cms-voorbeeld',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const home = await readFile(new URL('index.html', dir), 'utf8');
        const kop = home.slice(0, home.indexOf('</head>'));
        const links = [...kop.matchAll(/<link\b[^>]*>/g)]
          .map((m) => m[0])
          .filter((tag) => /\brel="stylesheet"/.test(tag))
          .map((tag) => tag.match(/\bhref="([^"]+)"/)?.[1])
          .filter(Boolean);
        const inline = [...kop.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
        if (links.length + inline.length === 0) {
          logger.warn('geen CSS gevonden op de homepagina; het voorbeeld in het beheer krijgt geen sitestijl');
          return;
        }

        const regels = [
          ...links.map((href) => `CMS.registerPreviewStyle(${JSON.stringify(href)});`),
          ...inline.map((css) => `CMS.registerPreviewStyle(${JSON.stringify(css).replace(/</g, '\\u003c')}, { raw: true });`),
          `CMS.registerPreviewStyle('/admin/voorbeeld.css');`,
        ];
        const adminPad = new URL('admin/index.html', dir);
        const admin = await readFile(adminPad, 'utf8');
        await writeFile(adminPad, admin.replace('</body>', `<script>\n${regels.join('\n')}\n</script>\n</body>`));
        logger.info(`${links.length + inline.length} stylesheet(s) van de site als voorbeeldstijl in het beheer geregistreerd`);
      },
    },
  };
}
