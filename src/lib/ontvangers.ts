import { getCollection, getEntry } from 'astro:content';
import site from '../data/site.json';

export interface Ontvanger {
  id: string;
  label: string;
  email: string;
  speltak?: boolean;
}

// Wie een bericht via het contactformulier krijgt; de adressen komen uit de content, zodat ze in het beheer te wijzigen zijn.
export async function ontvangers(): Promise<Ontvanger[]> {
  const contact = await getEntry('speciaal', 'contact');
  const secretaris = contact?.data.bestuur?.find((p) => p.functie.toLowerCase() === 'secretaris')?.email;
  const speltakken = (await getCollection('speltakken')).sort((a, b) => a.data.order - b.data.order);
  return [
    { id: 'algemeen', label: 'Algemene vraag', email: site.email },
    { id: 'lid-worden', label: 'Lid worden', email: secretaris || site.email },
    ...speltakken
      .filter((s) => s.data.email)
      .map((s) => ({ id: s.id, label: s.data.title, email: s.data.email!, speltak: true })),
  ];
}
