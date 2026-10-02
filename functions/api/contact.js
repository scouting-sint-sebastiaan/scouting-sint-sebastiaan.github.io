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

  const cc = (env.CONTACT_CC || '').split(',').map((a) => a.trim()).filter(Boolean);
  const mail = {
    from: { name: 'Website Scouting St. Sebastiaan', email: env.SMTP_FROM || env.SMTP_USER },
    to: ontvanger.email,
    cc: cc.length > 0 ? cc : undefined,
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
  };

  try {
    await viaSmtp(env, mail);
  } catch (e) {
    console.error('contactformulier: SMTP mislukt', melding(e));
    if (!env.BREVO_API_KEY) return terug(request, 'fout');
    try {
      await viaBrevo(env, mail);
      console.log('contactformulier: verstuurd via Brevo');
    } catch (e2) {
      console.error('contactformulier: Brevo mislukt', melding(e2));
      return terug(request, 'fout');
    }
  }
  return terug(request, 'verzonden');
}

const melding = (e) => (e instanceof Error ? e.message : String(e));

function viaSmtp(env, mail) {
  const port = Number(env.SMTP_PORT || 465);
  return WorkerMailer.send(
    {
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      startTls: port !== 465,
      credentials: { username: env.SMTP_USER, password: env.SMTP_PASS },
      authType: ['plain', 'login'],
      socketTimeoutMs: 10_000,
    },
    mail,
  );
}

async function viaBrevo(env, mail) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: mail.from,
      to: [{ email: mail.to }],
      ...(mail.cc && { cc: mail.cc.map((email) => ({ email })) }),
      replyTo: mail.reply,
      subject: mail.subject,
      textContent: mail.text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
}
