import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import { APP_NAME } from '@/config/app';

import Home from '../home';

describe('Home', () => {
  it('renders the main menu with a link to start a new game', async () => {
    const Stub = createRoutesStub([{ path: '/', Component: Home }]);
    render(<Stub initialEntries={['/']} />);

    expect(
      await screen.findByRole('heading', { name: APP_NAME }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /yeni oyun/i })).toHaveAttribute(
      'href',
      '/play',
    );
  });
});
