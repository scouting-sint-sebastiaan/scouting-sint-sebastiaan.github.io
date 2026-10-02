import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import site from '../../data/site.json';
import { activiteiten, ical } from '../../lib/agenda';

export const getStaticPaths = (async () =>
  (await getCollection('speltakken')).map((s) => ({ params: { slug: s.id }, props: { naam: s.data.title } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props, site: basis }) =>
  new Response(
    await ical(await activiteiten(params.slug), `${site.naam} – ${props.naam}`, new URL(`/groepen/${params.slug}/`, basis).toString()),
    { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } },
  );
