import React from 'react';
import { useCollection } from '../context/CollectionContext';
import { VaultTable } from '../components/vault/VaultTable';

export const LedgerPage: React.FC = () =>
{
  const { collection, handleStatusChange } = useCollection();
  return <VaultTable items={collection} onStatusChange={handleStatusChange} />;
};
