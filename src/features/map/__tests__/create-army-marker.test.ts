import {
  createArmyMarkerElement,
  markerOffset,
  type ArmyMarker,
} from '../lib/create-army-marker';

const army: ArmyMarker = {
  id: 'army-1',
  position: [30.1, 40.1],
  color: '#b91c1c',
  label: '1000',
  title: 'Osmanlı Beyliği ordusu: 1000 asker',
  index: 0,
  count: 1,
  selectable: true,
};

describe('markerOffset', () => {
  it('centres a single army and spreads several side by side', () => {
    expect(markerOffset(0, 1)).toEqual([0, 0]);
    const [a] = markerOffset(0, 2);
    const [b] = markerOffset(1, 2);
    expect(a).toBeLessThan(0);
    expect(b).toBeGreaterThan(0);
    expect(a + b).toBe(0);
  });
});

describe('createArmyMarkerElement', () => {
  it('renders an accessible button in the faction colour', () => {
    const el = createArmyMarkerElement(army, false, () => {});

    expect(el.tagName).toBe('BUTTON');
    expect(el.textContent).toBe('1000');
    expect(el.getAttribute('aria-label')).toBe(army.title);
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(el.style.backgroundColor).not.toBe('');
  });

  it('marks the selected army', () => {
    const el = createArmyMarkerElement(army, true, () => {});
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.className).toContain('ring-gold');
  });

  it('reports the click without letting it reach the map', () => {
    const onSelect = vi.fn();
    const onMapClick = vi.fn();
    const parent = document.createElement('div');
    parent.addEventListener('click', onMapClick);
    const el = createArmyMarkerElement(army, false, onSelect);
    parent.append(el);

    el.click();

    expect(onSelect).toHaveBeenCalledWith('army-1');
    expect(onMapClick).not.toHaveBeenCalled();
  });
});
