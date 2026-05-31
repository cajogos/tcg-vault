import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CollectionProvider } from './context/CollectionContext';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { LedgerPage } from './pages/LedgerPage';
import { AddAssetPage } from './pages/AddAssetPage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { ExportPage } from './pages/ExportPage';

const App: React.FC = () =>
{
  return (
    <BrowserRouter>
      <CollectionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="vault/add" element={<AddAssetPage />} />
            <Route path="vault/item/:id" element={<ItemDetailsPage />} />
            <Route path="export" element={<ExportPage />} />
          </Route>
        </Routes>
      </CollectionProvider>
    </BrowserRouter>
  );
};

export default App;
