import React from 'react';
import { useInspector } from '../../context/InspectorContext';
import { EyeOff } from 'lucide-react';
import { Separator } from '../ui/separator';

export const InspectorPanel: React.FC = () =>
{
  const { activeImageUrl, activeCardMetadata } = useInspector();

  return (
    <aside className="hidden lg:flex w-80 bg-slate-900 p-5 shrink-0 h-full flex-col border-l border-slate-800">
      <div>
        <p className="text-xs font-bold tracking-widest text-slate-500 uppercase pb-4">
          Asset Inspection
        </p>
        <Separator className="bg-slate-800 mb-6" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {activeImageUrl ? (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-slate-950 p-2 border border-slate-800 mb-5">
              <img
                src={activeImageUrl}
                alt="Inspected Asset"
                className="w-56 h-auto object-contain transition-transform duration-300 transform scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none rounded-xl" />
            </div>
            {activeCardMetadata && (
              <div className="text-center w-full space-y-1.5 px-2">
                <h4 className="font-bold text-slate-200 text-sm line-clamp-1 tracking-wide">
                  {activeCardMetadata.name}
                </h4>
                <p className="text-xs text-slate-400 font-medium">{activeCardMetadata.setId}</p>
                <p className="text-[11px] font-mono bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-800/80 text-indigo-400 inline-block mt-2">
                  {activeCardMetadata.info}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-3 px-4 py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <EyeOff className="w-6 h-6 text-slate-700 mx-auto" />
            <p className="text-xs text-slate-500 max-w-[180px] mx-auto leading-relaxed">
              Hover over cards or row utility buttons within your dashboard view to engage live visual inspector monitoring.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
