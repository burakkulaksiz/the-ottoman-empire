import {
  settingsFromSearch,
  settingsLabel,
  settingsToSearch,
} from '../game-settings';

describe('game settings in the address', () => {
  it('default to normal without historical mode', () => {
    expect(settingsFromSearch(new URLSearchParams(''))).toEqual({
      difficulty: 'normal',
      historicalMode: false,
    });
    expect(
      settingsToSearch({ difficulty: 'normal', historicalMode: false }),
    ).toBe('');
  });

  it('round-trip through the query string', () => {
    const settings = { difficulty: 'hard', historicalMode: true } as const;
    const query = settingsToSearch(settings);
    expect(query).toBe('?difficulty=hard&historical=1');
    expect(settingsFromSearch(new URLSearchParams(query))).toEqual(settings);
  });

  it('ignore unknown difficulties', () => {
    expect(
      settingsFromSearch(new URLSearchParams('?difficulty=imkansiz'))
        .difficulty,
    ).toBe('normal');
  });

  it('have a short label', () => {
    expect(settingsLabel({ difficulty: 'easy', historicalMode: true })).toBe(
      'Kolay · Tarihe sadık',
    );
    expect(settingsLabel({ difficulty: 'normal', historicalMode: false })).toBe(
      'Normal',
    );
  });
});
