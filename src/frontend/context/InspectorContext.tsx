import React, { createContext, useContext, useState, useCallback } from 'react';

interface InspectorMetadata
{
  name: string;
  setId: string;
  info: string;
}

interface InspectorContextType
{
  activeImageUrl: string | null;
  activeCardMetadata: InspectorMetadata | null;
  inspect: (url: string | null, metadata?: InspectorMetadata) => void;
  clearInspect: () => void;
}

const InspectorContext = createContext<InspectorContextType | undefined>(undefined);

export const InspectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [activeCardMetadata, setActiveCardMetadata] = useState<InspectorMetadata | null>(null);

  const inspect = useCallback((url: string | null, metadata?: InspectorMetadata) =>
  {
    setActiveImageUrl(url);
    setActiveCardMetadata(metadata || null);
  }, []);

  const clearInspect = useCallback(() =>
  {
    setActiveImageUrl(null);
    setActiveCardMetadata(null);
  }, []);

  return (
    <InspectorContext.Provider value={{ activeImageUrl, activeCardMetadata, inspect, clearInspect }}>
      {children}
    </InspectorContext.Provider>
  );
};

export const useInspector = () =>
{
  const context = useContext(InspectorContext);
  if (!context)
  {
    throw new Error('useInspector must be wrapped inside an InspectorProvider');
  }
  return context;
};
