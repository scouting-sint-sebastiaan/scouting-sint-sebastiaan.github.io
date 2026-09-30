# Scouting St. Sebastiaan – website

Statische website (Astro) met een eenvoudige beheeromgeving (Sveltia CMS) op `/admin/`.
Gehost gratis op Cloudflare Pages; de inhoud staat als Markdown-bestanden in deze GitHub-repo.

## Eenmalige inrichting (voor de beheerder)

1. **GitHub-repo**: `scouting-sint-sebastiaan/scouting-sint-sebastiaan.github.io` (organisatie `scouting-sint-sebastiaan`, eigenaar `petervv1`). Push deze map daarheen; `repo:` in `public/admin/config.yml` staat al goed.
2. **Cloudflare Pages** koppelen aan de repo:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `NODE_VERSION=22`
   - Custom domain: `www.scoutingsintsebastiaan.nl`
3. **Inloggen voor vrijwilligers** (kies een van beide):
   - *OAuth-proxy (aanbevolen)*: deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) als Cloudflare Worker met een GitHub OAuth-app, en zet de worker-URL in `config.yml` bij `base_url`. Vrijwilligers loggen dan in met de knop "Inloggen met GitHub".
   - *Zonder worker*: vrijwilligers loggen in met een persoonlijk toegangstoken (PAT) met schrijfrechten op alleen deze repo.
4. **Vrijwilligers uitnodigen** als collaborator op de GitHub-repo (schrijfrechten). Ze hebben een gratis GitHub-account nodig.

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
| `src/content/agenda/` | Activiteiten (verleden datums verdwijnen vanzelf uit de agenda) |
| `src/content/speltakken/` | Bevers, Welpen, Verkenners, Rowans, Stam |
| `src/content/paginas/` | Losse pagina's; het menu wordt automatisch opgebouwd uit `menu` en `order` |
| `src/content/speciaal/` | Home, Contact, Contributie |
| `src/data/site.json` | Adres, e-mail en sociale media (footer) |
| `public/uploads/` | Foto's en bestanden |
| `public/_redirects` | Doorverwijzingen van de oude `.html`-adressen |

## Uitleg voor vrijwilligers

1. Ga naar `https://www.scoutingsintsebastiaan.nl/admin/` en log in.
2. Kies links wat je wilt aanpassen: **Nieuws**, **Agenda**, **Speltakken**, **Pagina's** of **Home, contact en contributie**.
3. Pas de tekst aan, of kies "Nieuw" om iets toe te voegen. Foto's kun je slepen naar het afbeeldingsveld.
4. Klik op **Publiceren**. Na ongeveer een minuut staat de wijziging op de site.

Let op: alles wat je publiceert is openbaar. Zet geen foto's van kinderen online zonder toestemming van de ouders.

## Bekende aandachtspunten

- De inhoud is overgenomen uit het archief van de oude site (juni 2026). Veel oorspronkelijke foto's waren niet gearchiveerd en ontbreken (o.a. de foto uit 1981 en de Scoutfit-foto's).
- Het voorbeeldnieuwsbericht en het voorbeeld in de agenda mogen verwijderd worden.
- Het oude contactformulier is vervangen door e-mailadressen.
