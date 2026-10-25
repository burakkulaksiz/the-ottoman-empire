import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import Encyclopedia from '../encyclopedia';
import EncyclopediaEntryPage, {
  clientLoader as entryLoader,
} from '../encyclopedia-entry';
import Home from '../home';

function renderAt(path: string) {
  const Stub = createRoutesStub([
    { path: '/', Component: Home },
    { path: '/encyclopedia', Component: Encyclopedia },
    {
      path: '/encyclopedia/:entryId',
      Component: EncyclopediaEntryPage as never,
      loader: entryLoader as never,
      ErrorBoundary: () => <p>Madde bulunamadı</p>,
    },
  ]);
  render(<Stub initialEntries={[path]} />);
}

describe('Encyclopedia', () => {
  it('is reachable from the main menu', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('link', { name: /ansiklopedi/i }),
    ).toHaveAttribute('href', '/encyclopedia');
  });

  it('lists entries and finds them by search', async () => {
    renderAt('/encyclopedia');

    expect(
      await screen.findByRole('link', { name: /Osman Bey \(Osman Gazi\)/ }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Madde ara' }), {
      target: { value: 'tımar' },
    });
    expect(screen.getByRole('link', { name: /Tımar sistemi/ })).toHaveAttribute(
      'href',
      '/encyclopedia/timar',
    );
    expect(screen.queryByRole('link', { name: /Osman Bey/ })).toBeNull();
  });

  it('filters by category', async () => {
    renderAt('/encyclopedia');

    fireEvent.click(await screen.findByRole('button', { name: 'Savaşlar' }));
    expect(
      screen.getByRole('link', { name: /Koyunhisar/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Tımar sistemi/ })).toBeNull();
  });

  it('shows an entry with its in-game meaning and related entries', async () => {
    renderAt('/encyclopedia/timar');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tımar sistemi' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sipahiler hazineden maaş almaz.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tımarlı sipahi' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tımarlı sipahi' }),
    ).toBeInTheDocument();
  });

  it('reports unknown entries', async () => {
    renderAt('/encyclopedia/olmayan');
    expect(await screen.findByText('Madde bulunamadı')).toBeInTheDocument();
  });
});
