import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const persoon = z.object({
  functie: z.string(),
  naam: z.string(),
  email: z.string().optional(),
  telefoon: z.string().optional(),
});

const paginaSchema = z.object({
  title: z.string(),
  menu: z.enum(['ontdek', 'lid-worden', 'geen']).default('geen'),
  order: z.number().default(0),
  adres: z.string().optional(),
  bestuur: z.array(persoon).optional(),
  overig: z.array(persoon).optional(),
  tarieven: z.array(z.object({ speltak: z.string(), bedrag: z.string() })).optional(),
  iban: z.string().optional(),
  tenaamstelling: z.string().optional(),
  fotos: z
    .object({
      banner: z.string().optional(),
      kolom1: z.string().optional(),
      kolom2: z.string().optional(),
      snel: z.string().optional(),
      oproep: z.string().optional(),
      groepen: z.string().optional(),
      nieuws: z.string().optional(),
    })
    .optional(),
});

const paginas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paginas' }),
  schema: paginaSchema,
});

const speciaal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/speciaal' }),
  schema: paginaSchema,
});

const speltakken = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/speltakken' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(0),
    leeftijd: z.string(),
    draaitijd: z.string().optional(),
    email: z.string().optional(),
    staf: z.string().optional(),
    image: z.string().optional(),
  }),
});

const nieuws = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/nieuws' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    samenvatting: z.string().optional(),
    image: z.string().optional(),
  }),
});

const agenda = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/agenda' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tijd: z.string().optional(),
    locatie: z.string().optional(),
    wie: z.string().optional(),
    speltakken: z.array(z.string()).default([]),
  }),
});

export const collections = { paginas, speciaal, speltakken, nieuws, agenda };
