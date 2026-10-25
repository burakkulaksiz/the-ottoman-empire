import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import { SaveSlotList, type SaveSlotRow } from '../components/save-slot-list';

const rows: SaveSlotRow[] = [
  {
    slot: 'auto',
    label: 'Otomatik kayıt',
    summary: { title: '1299 · Kuruluş', detail: 'Yaz 1299 · Tur 2' },
    canSave: false,
  },
  { slot: 'slot-1', label: 'Yuva 1', summary: null, canSave: true },
  {
    slot: 'slot-2',
    label: 'Yuva 2',
    summary: { title: '1299 · Kuruluş', detail: 'Kış 1300 · Tur 8' },
    canSave: true,
  },
];

function renderList(props: Partial<Parameters<typeof SaveSlotList>[0]>) {
  const Stub = createRoutesStub([
    { path: '/', Component: () => <SaveSlotList rows={rows} {...props} /> },
  ]);
  render(<Stub initialEntries={['/']} />);
}

describe('SaveSlotList', () => {
  it('shows what each slot holds', async () => {
    renderList({});

    expect(await screen.findByText('Otomatik kayıt')).toBeInTheDocument();
    expect(screen.getByText('Boş')).toBeInTheDocument();
    expect(screen.getByText('Kış 1300 · Tur 8')).toBeInTheDocument();
  });

  it('saves into empty and filled slots but never into the auto slot', async () => {
    const onSave = vi.fn();
    renderList({ onSave });

    await screen.findByText('Yuva 1');
    expect(
      screen.queryByRole('button', { name: 'Otomatik kayıt: kaydet' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Kaydet')).toBeInTheDocument();
    expect(screen.getByText('Üzerine yaz')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yuva 2: kaydet' }));
    expect(onSave).toHaveBeenCalledWith('slot-2');
  });

  it('links filled slots to the game and lets the player delete them', async () => {
    const onDelete = vi.fn();
    renderList({
      loadHref: (slot) => `/play/kurulus-1299?slot=${slot}`,
      onDelete,
    });

    expect(
      await screen.findByRole('link', { name: 'Yuva 2: yükle' }),
    ).toHaveAttribute('href', '/play/kurulus-1299?slot=slot-2');
    expect(
      screen.queryByRole('link', { name: 'Yuva 1: yükle' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yuva 2: sil' }));
    expect(onDelete).toHaveBeenCalledWith('slot-2');
  });
});
