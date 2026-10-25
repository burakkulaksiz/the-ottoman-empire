import { fireEvent, render, screen } from '@testing-library/react';

import { ArmyPanel } from '../components/army-panel';
import { ProvincePanel } from '../components/province-panel';
import { formatUnits } from '../config/unit-labels';

describe('formatUnits', () => {
  it('lists the unit types in a fixed order and skips empty ones', () => {
    expect(formatUnits({ sipahi: 600, akinci: 400, topcu: 0 })).toBe(
      'Akıncı 400 · Sipahi 600',
    );
    expect(formatUnits({})).toBe('Birlik yok');
  });
});

describe('ArmyPanel', () => {
  const base = {
    factionName: 'Osmanlı Beyliği',
    provinceName: 'Bilecik',
    units: { sipahi: 600 },
    morale: 80,
    destinationNames: ['Bursa', 'Kütahya'],
    onCancel: () => {},
  };

  it('shows units, morale and where the army can march', () => {
    render(<ArmyPanel {...base} movesLeft={1} />);

    expect(screen.getByText('Osmanlı Beyliği ordusu')).toBeInTheDocument();
    expect(screen.getByText('Sipahi 600')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Moral' })).toHaveAttribute(
      'aria-valuenow',
      '80',
    );
    expect(screen.getByText('Bursa, Kütahya')).toBeInTheDocument();
  });

  it('explains why there is nothing to do', () => {
    const { rerender } = render(<ArmyPanel {...base} movesLeft={0} />);
    expect(screen.getByText(/hareket hakkı kalmadı/)).toBeInTheDocument();

    rerender(<ArmyPanel {...base} movesLeft={1} destinationNames={[]} />);
    expect(screen.getByText(/gidebileceği bölge yok/)).toBeInTheDocument();
  });

  it('lets the player drop the selection', () => {
    const onCancel = vi.fn();
    render(<ArmyPanel {...base} movesLeft={1} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Seçimi kaldır' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('ProvincePanel', () => {
  const base = {
    name: 'Bursa',
    country: 'Türkiye',
    ownerName: 'Bizans İmparatorluğu',
    neighborNames: ['Bilecik', 'Yalova'],
  };

  it('lists armies and only lets the player select its own', () => {
    const onSelectArmy = vi.fn();
    render(
      <ProvincePanel
        {...base}
        onSelectArmy={onSelectArmy}
        armies={[
          {
            id: 'army-1',
            factionName: 'Osmanlı Beyliği',
            units: { sipahi: 10 },
            morale: 90,
            mine: true,
            selected: false,
          },
          {
            id: 'army-2',
            factionName: 'Bizans İmparatorluğu',
            units: { akinci: 5 },
            morale: 70,
            mine: false,
            selected: false,
          },
        ]}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelectArmy).toHaveBeenCalledWith('army-1');
  });

  it('shows terrain, fortification and the cities of the province', () => {
    render(
      <ProvincePanel
        {...base}
        terrainLabel="Engebeli"
        fortification={2}
        placeNames={['Bursa (Prusa)', 'İznik (Nikaia)']}
        armies={[]}
        onSelectArmy={() => {}}
      />,
    );

    expect(screen.getByText(/Engebeli/)).toBeInTheDocument();
    expect(screen.getByText('Kale seviyesi:')).toBeInTheDocument();
    expect(
      screen.getByText('Bursa (Prusa), İznik (Nikaia)'),
    ).toBeInTheDocument();
  });

  it('leaves out the terrain and fortress lines when there is nothing to say', () => {
    render(<ProvincePanel {...base} armies={[]} onSelectArmy={() => {}} />);

    expect(screen.queryByText('Arazi:')).not.toBeInTheDocument();
    expect(screen.queryByText('Kale seviyesi:')).not.toBeInTheDocument();
    expect(screen.queryByText('Şehirler:')).not.toBeInTheDocument();
  });

  it('offers recruitment and explains the options that are not possible', () => {
    const onRecruit = vi.fn();
    render(
      <ProvincePanel
        {...base}
        armies={[]}
        onSelectArmy={() => {}}
        recruit={{
          onRecruit,
          options: [
            { unit: 'akinci', label: 'Akıncı', cost: 4 },
            {
              unit: 'sipahi',
              label: 'Sipahi',
              cost: 10,
              disabledReason: 'Yeterli akçe yok',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Devşirme')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Akıncı +100 (4 akçe)' }),
    );
    expect(onRecruit).toHaveBeenCalledWith('akinci');

    const blocked = screen.getByRole('button', {
      name: 'Sipahi +100 (10 akçe)',
    });
    expect(blocked).toBeDisabled();
    expect(blocked).toHaveAttribute('title', 'Yeterli akçe yok');
  });

  it('says so when no army is there', () => {
    render(<ProvincePanel {...base} armies={[]} onSelectArmy={() => {}} />);
    expect(screen.getByText('Bu bölgede ordu yok.')).toBeInTheDocument();
    expect(screen.getByText(/Bilecik, Yalova/)).toBeInTheDocument();
  });
});
