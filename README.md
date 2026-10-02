# Scouting St. Sebastiaan – website

Statische website (Astro) met een eenvoudige beheeromgeving (Sveltia CMS) op `/admin/`.
Gehost gratis op Cloudflare Pages; de inhoud staat als Markdown-bestanden in deze GitHub-repo.

## Eenmalige inrichting (voor de beheerder)

1. **GitHub-repo**: `scouting-sint-sebastiaan/scouting-sint-sebastiaan.github.io` (organisatie `scouting-sint-sebastiaan`, eigenaar `petervv1`). Push deze map daarheen; `repo:` in `public/admin/config.yml` staat al goed.
2. **Cloudflare Pages** koppelen aan de repo:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `NODE_VERSION=22`
   - Custom domains: `www.scoutingsintsebastiaan.nl` en `preview.scoutingsintsebastiaan.nl` (beide een CNAME naar `scouting-sint-sebastiaan.pages.dev` bij Strato); het domein zonder www stuurt via Strato door naar www.
   - Livegang: zolang **Website openbaar maken** in het beheer uit staat, toont www een tijdelijke pagina (`functions/_middleware.js`). Aanzetten en publiceren maakt de site daar binnen een minuut openbaar.
   - Zoekmachines: `public/_headers` zet `X-Robots-Tag: noindex` op de pages.dev-adressen en op `preview.scoutingsintsebastiaan.nl`; het echte domein wordt wel geïndexeerd.
3. **Inloggen voor vrijwilligers**: de map `functions/` bevat de GitHub-inlogkoppeling (Cloudflare Pages Functions, `/auth` en `/callback`). Maak in de GitHub-organisatie een OAuth-app (Settings → Developer settings → OAuth Apps) met als callback-URL `<site>/callback` en zet `GITHUB_CLIENT_ID` en `GITHUB_CLIENT_SECRET` als variabelen (secret) van het Cloudflare Pages-project. Pas `base_url` in `public/admin/config.yml` aan als het domein verandert, en werk de callback-URL van de OAuth-app bij. Wil je ook vanaf een preview-adres inloggen, zet dan `ALLOWED_ORIGINS` (kommagescheiden, bijvoorbeeld `https://*.scouting-sint-sebastiaan.pages.dev`). Zonder dit kunnen vrijwilligers ook inloggen met een persoonlijk toegangstoken (PAT).
4. **Vrijwilligers uitnodigen** als collaborator op de GitHub-repo (schrijfrechten). Ze hebben een gratis GitHub-account nodig.
5. **Contactformulier** (`functions/api/contact.js`): verstuurt berichten via SMTP. Variabelen van het Pages-project: `SMTP_HOST`, `SMTP_PORT` (465 of 587), `SMTP_USER`, `SMTP_PASS` (secret), `SMTP_FROM` (afzender), `TURNSTILE_SECRET` (secret) en optioneel `CONTACT_CC` (kopie van elk bericht, kommagescheiden). Lukt versturen via SMTP niet, dan gaat het bericht via Brevo als `BREVO_API_KEY` (secret) is gezet; het domein moet dan in Brevo geauthenticeerd zijn (DKIM-records), anders weigert de ontvanger het door DMARC. De sitekey van Cloudflare Turnstile staat in `src/data/site.json`. De ontvangers komen uit de content: algemene vragen naar het algemene e-mailadres, lid worden naar de secretaris en speltakvragen naar het adres van de speltak.

## Lokaal draaien

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # bouwt naar dist/
npm run check    # typecontrole
```

Zonder lokale Node kan het via Docker:
`docker run --rm -it -v "$PWD":/app -w /app -p 4321:4321 node:22-alpine sh -c "npm install && npm run dev -- --host"`

## Structuur

| Pad | Inhoud |
| --- | --- |
| `src/content/nieuws/` | Nieuwsberichten |
| `src/content/agenda/` | Activiteiten (verleden datums verdwijnen vanzelf uit de agenda); met `speltakken` verschijnen ze ook op die speltakpagina's, zonder speltakken gelden ze voor de hele groep |
| `src/content/speltakken/` | Bevers, Welpen, Verkenners, Rowans, Stam |
| `src/content/paginas/` | Losse pagina's; het menu wordt automatisch opgebouwd uit `menu` en `order` |
| `src/content/speciaal/` | Home, Contact, Contributie |
| `src/data/site.json` | Adres, e-mail, sociale media en de coördinaten voor de kaart |
| `src/data/melding.json` | De melding bovenaan elke pagina (in het beheer: "Melding bovenaan de site") |
| `integrations/fotos.mjs` | Maakt bij de build verkleinde WebP-versies (400/800/1600 px) van alle foto's in `/uploads/` en past de HTML daarop aan |
| `public/uploads/` | Foto's en bestanden; `kaart-blokhut.png` is een vaste kaart van OpenStreetMap (bij verhuizing opnieuw maken) |
| `public/_redirects` | Doorverwijzingen van de oude `.html`-adressen |

## Uitleg voor vrijwilligers

1. Ga naar `https://www.scoutingsintsebastiaan.nl/admin/` en log in.
2. Kies links wat je wilt aanpassen: **Nieuws**, **Agenda**, **Speltakken**, **Pagina's** of **Home, contact en contributie**.
3. Pas de tekst aan, of kies "Nieuw" om iets toe te voegen. Foto's kun je slepen naar het afbeeldingsveld.
4. Klik op **Publiceren**. Na ongeveer een minuut staat de wijziging op de site.

Gaat een opkomst niet door? Zet dan onder **Melding bovenaan de site** "Melding tonen" aan en vul de tekst in. Met "Tonen tot en met" verdwijnt de melding daarna vanzelf.

Ouders kunnen de agenda in hun telefoon zetten via de knop "Zet in je agenda" op de agendapagina of op de pagina van een speltak (`/agenda.ics`, `/groepen/<speltak>.ics`).

Let op: alles wat je publiceert is openbaar. Zet geen foto's van kinderen online zonder toestemming van de ouders.

## Bekende aandachtspunten

- De inhoud is overgenomen uit het archief van de oude site (juni 2026). Veel oorspronkelijke foto's waren niet gearchiveerd en ontbreken (o.a. de foto uit 1981 en de Scoutfit-foto's).
- Het voorbeeldnieuwsbericht en het voorbeeld in de agenda mogen verwijderd worden.
- Het oude contactformulier is vervangen door e-mailadressen.
