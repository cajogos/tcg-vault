import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InventoryItem, Status } from '../types';

interface CollectionContextValue
{
  collection: InventoryItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  handleStatusChange: (itemId: string, newStatus: Status) => Promise<void>;
  handleDelete: (itemId: string) => Promise<void>;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const [collection, setCollection] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () =>
  {
    setLoading(true);
    try
    {
      const response = await fetch('/api/inventory');
      if (!response.ok)
      {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const data = await response.json();
      setCollection(data);
      setError(null);
    }
    catch (err)
    {
      console.error('Failed to fetch inventory:', err);
      setError('Could not retrieve vault items. Ensure SQLite local backend is running.');
    }
    finally
    {
      setLoading(false);
    }
  }, []);

  useEffect(() =>
  {
    fetchCollection();
  }, [fetchCollection]);

  const handleStatusChange = async (itemId: string, newStatus: Status) =>
  {
    try
    {
      const response = await fetch(`/api/inventory/${itemId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok)
      {
        setCollection(prev =>
          prev.map(item => item.id === itemId ? { ...item, status: newStatus } : item)
        );
      }
      else
      {
        console.error('Failed to update status');
      }
    }
    catch (err)
    {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (itemId: string) =>
  {
    try
    {
      const response = await fetch(`/api/inventory/${itemId}`,
      {
        method: 'DELETE',
      });
      if (response.ok)
      {
        fetchCollection();
      }
      else
      {
        console.error('Failed to delete item');
      }
    }
    catch (err)
    {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <CollectionContext.Provider value={{ collection, loading, error, refresh: fetchCollection, handleStatusChange, handleDelete }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = (): CollectionContextValue =>
{
  const ctx = useContext(CollectionContext);
  if (!ctx)
  {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return ctx;
};
