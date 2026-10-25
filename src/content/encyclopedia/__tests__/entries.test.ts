import { PLACES } from '../../world/places';
import { ENTRIES, getEntry, placeEntryId, searchEntries } from '../entries';

describe('encyclopedia entries', () => {
  it('have unique ids and only point to entries that exist', () => {
    const ids = ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of ENTRIES) {
      for (const related of entry.related) {
        expect(ids, `${entry.id} → ${related}`).toContain(related);
      }
    }
  });

  it('have a title, a summary and text', () => {
    for (const entry of ENTRIES.filter((e) => e.category !== 'place')) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.body.length).toBeGreaterThan(0);
    }
  });

  it('cover every place on the map', () => {
    for (const place of PLACES) {
      expect(getEntry(placeEntryId(place.id))?.title).toBe(place.name);
    }
  });

  it('link places back to the entries that mention them', () => {
    expect(getEntry(placeEntryId('bursa'))?.related).toContain('bursa-fethi');
    expect(getEntry(placeEntryId('bursa'))?.body.join(' ')).toMatch(
      /1\. seviye kale/,
    );
  });

  it('can be searched in Turkish and filtered by category', () => {
    expect(searchEntries('osman').map((e) => e.id)).toContain('osman-gazi');
    // Türkçe büyük İ / küçük i.
    expect(searchEntries('İZNİK').map((e) => e.id)).toContain(
      placeEntryId('iznik'),
    );
    const battles = searchEntries('', 'battle');
    expect(battles.every((e) => e.category === 'battle')).toBe(true);
    expect(battles.map((e) => e.id)).toEqual(
      expect.arrayContaining(['koyunhisar', 'bursa-fethi']),
    );
    expect(searchEntries('olmayan bir şey')).toEqual([]);
  });
});
