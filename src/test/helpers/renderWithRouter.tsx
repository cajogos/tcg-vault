import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

interface Options extends Omit<RenderOptions, 'wrapper'>
{
  initialPath?: string;
}

export function renderWithRouter(
  ui: React.ReactElement,
  { initialPath = '/', ...options }: Options = {}
)
{
  return render(ui,
  {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialPath]}>
        {children}
      </MemoryRouter>
    ),
    ...options,
  });
}
