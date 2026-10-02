import type { APIRoute } from 'astro';
import { ontvangers } from '../lib/ontvangers';

export const GET: APIRoute = async () => {
  const lijst = await ontvangers();
  const perId = Object.fromEntries(lijst.map(({ id, label, email }) => [id, { label, email }]));
  return new Response(JSON.stringify(perId), { headers: { 'Content-Type': 'application/json' } });
};
