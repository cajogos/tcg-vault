import React from 'react';
import { useCollection } from '../context/CollectionContext';
import { VaultGrid } from '../components/vault/VaultGrid';

export const DashboardPage: React.FC = () =>
{
  const { collection, handleStatusChange } = useCollection();
  return <VaultGrid items={[...collection].reverse()} onStatusChange={handleStatusChange} />;
};
