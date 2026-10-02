import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { activiteiten, ical } from '../lib/agenda';

export const GET: APIRoute = async ({ site: basis }) =>
  new Response(await ical(await activiteiten(), site.naam, new URL('/agenda/', basis).toString()), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
