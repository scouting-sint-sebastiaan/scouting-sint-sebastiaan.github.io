// Ontvangt het contactformulier en verstuurt het bericht via de SMTP-mailbox.
import { WorkerMailer } from 'worker-mailer';

const regel = (v, max) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
const isEmail = (v) => /^[^\s@<>"(),;:\\]+@[^\s@<>"(),;:\\]+\.[^\s@<>"(),;:\\]+$/.test(v);

const terug = (request, status) =>
  Response.redirect(new URL(`/contact/?formulier=${status}#formulier`, request.url).toString(), 303);

async function turnstileOk(token, request, secret) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: request.headers.get('CF-Connecting-IP') ?? '' }),
  }).catch(() => null);
  const data = res ? await res.json().catch(() => ({})) : {};
  return data.success === true;
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData().catch(() => null);
  if (!form) return terug(request, 'onvolledig');
  // Verborgen veld dat alleen bots invullen; doe alsof het gelukt is.
  if (form.get('website')) return terug(request, 'verzonden');

  const onderwerp = regel(form.get('onderwerp'), 50);
  const naam = regel(form.get('naam'), 100).replace(/["<>]/g, '');
  const email = regel(form.get('email'), 200);
  const bericht = String(form.get('bericht') ?? '').trim().slice(0, 5000).replace(/\r?\n/g, '\r\n');
  if (!naam || !isEmail(email) || !bericht) return terug(request, 'onvolledig');

  if (!(await turnstileOk(String(form.get('cf-turnstile-response') ?? ''), request, env.TURNSTILE_SECRET))) {
    return terug(request, 'controle');
  }

  const lijst = await env.ASSETS.fetch(new URL('/contact-ontvangers.json', request.url)).then((r) => r.json());
  const ontvanger = Object.hasOwn(lijst, onderwerp) ? lijst[onderwerp] : null;
  if (!ontvanger) return terug(request, 'onvolledig');

  const port = Number(env.SMTP_PORT || 465);
  try {
    await WorkerMailer.send(
      {
        host: env.SMTP_HOST,
        port,
        secure: port === 465,
        startTls: port !== 465,
        credentials: { username: env.SMTP_USER, password: env.SMTP_PASS },
        authType: ['plain', 'login'],
      },
      {
        from: { name: 'Website Scouting St. Sebastiaan', email: env.SMTP_FROM || env.SMTP_USER },
        to: ontvanger.email,
        cc: env.CONTACT_CC ? env.CONTACT_CC.split(',').map((a) => a.trim()).filter(Boolean) : undefined,
        reply: { name: naam, email },
        subject: `[Website] ${ontvanger.label}: ${naam}`,
        text: [
          `Bericht via het contactformulier op de website (${ontvanger.label}).`,
          '',
          `Naam: ${naam}`,
          `E-mail: ${email}`,
          '',
          bericht,
          '',
          '--',
          `Met "beantwoorden" stuur je je antwoord rechtstreeks naar ${naam}.`,
        ].join('\r\n'),
      },
    );
  } catch (e) {
    console.error('contactformulier: versturen mislukt', e instanceof Error ? e.message : e);
    return terug(request, 'fout');
  }
  return terug(request, 'verzonden');
}
