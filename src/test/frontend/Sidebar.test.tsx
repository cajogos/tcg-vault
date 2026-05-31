import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../helpers/renderWithRouter';
import { Sidebar } from '../../frontend/components/layout/Sidebar';

describe('Sidebar navigation', () =>
{
  it('marks Binder View active at /', () =>
  {
    renderWithRouter(<Sidebar />, { initialPath: '/' });
    expect(screen.getByText('Binder View').closest('a')).toHaveClass('bg-indigo-600/15');
  });

  it('marks Ledger Sheet active at /ledger', () =>
  {
    renderWithRouter(<Sidebar />, { initialPath: '/ledger' });
    expect(screen.getByText('Ledger Sheet').closest('a')).toHaveClass('bg-indigo-600/15');
  });

  it('does not mark Binder View active at /ledger', () =>
  {
    renderWithRouter(<Sidebar />, { initialPath: '/ledger' });
    expect(screen.getByText('Binder View').closest('a')).not.toHaveClass('bg-indigo-600/15');
  });

  it('marks Vault New Asset active at /vault/add', () =>
  {
    renderWithRouter(<Sidebar />, { initialPath: '/vault/add' });
    expect(screen.getByText('Vault New Asset').closest('a')).toHaveClass('bg-indigo-600/15');
  });
});
