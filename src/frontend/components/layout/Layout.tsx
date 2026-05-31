import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, PanelRight, PanelRightClose } from 'lucide-react';
import { InspectorProvider } from '../../context/InspectorContext';
import { useCollection } from '../../context/CollectionContext';
import { Sidebar } from './Sidebar';
import { InspectorPanel } from './InspectorPanel';

const LayoutInner: React.FC = () =>
{
  const { loading, error, refresh } = useCollection();
  const [inspectorDocked, setInspectorDocked] = useState(true);
  const location = useLocation();
  const isExportPage = location.pathname === '/export';

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-hidden">
        <header className="h-14 border-b border-slate-900 px-6 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Offline Node Secured
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Ledger
            </button>
            {!isExportPage && (
              <button
                onClick={() => setInspectorDocked((prev) => !prev)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg font-medium transition-all"
                title={inspectorDocked ? 'Undock inspector' : 'Dock inspector'}
              >
                {inspectorDocked ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </header>

        <div className={`flex-1 relative ${isExportPage ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 z-10">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <span className="text-xs font-medium text-slate-400 tracking-wider font-mono">
                Loading Vault Records...
              </span>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto mt-20 border border-rose-500/20 bg-rose-500/5 p-6 rounded-2xl text-center space-y-4">
              <div className="h-10 w-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center mx-auto">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200">Database Connection Failed</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={refresh}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-all border border-rose-500/35"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="animate-fadeIn h-full">
              <Outlet />
            </div>
          )}
        </div>
      </main>

      {inspectorDocked && !isExportPage && <InspectorPanel />}
    </div>
  );
};

export const Layout: React.FC = () =>
{
  return (
    <InspectorProvider>
      <LayoutInner />
    </InspectorProvider>
  );
};
