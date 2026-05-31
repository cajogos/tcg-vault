import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectorProvider, useInspector } from '../../frontend/context/InspectorContext';
import { InspectorPanel } from '../../frontend/components/layout/InspectorPanel';

function InspectTrigger()
{
  const { inspect } = useInspector();
  return (
    <button
      onClick={() => inspect(
        'https://example.com/card.png',
        { name: 'Charizard', setId: 'base1', info: 'HP 120' }
      )}
    >
      Inspect
    </button>
  );
}

describe('InspectorPanel', () =>
{
  it('shows empty state by default', () =>
  {
    render(
      <InspectorProvider>
        <InspectorPanel />
      </InspectorProvider>
    );
    expect(screen.getByText(/hover over cards/i)).toBeInTheDocument();
  });

  it('renders card image after inspect() is called', async () =>
  {
    const user = userEvent.setup();
    render(
      <InspectorProvider>
        <InspectTrigger />
        <InspectorPanel />
      </InspectorProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Inspect' }));
    expect(screen.getByRole('img', { name: 'Inspected Asset' })).toHaveAttribute(
      'src',
      'https://example.com/card.png'
    );
  });

  it('displays card name and info after inspect() is called', async () =>
  {
    const user = userEvent.setup();
    render(
      <InspectorProvider>
        <InspectTrigger />
        <InspectorPanel />
      </InspectorProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Inspect' }));
    expect(screen.getByText('Charizard')).toBeInTheDocument();
    expect(screen.getByText('HP 120')).toBeInTheDocument();
  });

  it('hides the empty state after inspect() is called', async () =>
  {
    const user = userEvent.setup();
    render(
      <InspectorProvider>
        <InspectTrigger />
        <InspectorPanel />
      </InspectorProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Inspect' }));
    expect(screen.queryByText(/hover over cards/i)).not.toBeInTheDocument();
  });
});
