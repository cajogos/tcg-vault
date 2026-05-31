import React, { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useInspector } from '../../context/InspectorContext';
import { InventoryItem, Status } from '../../types';
import statuses from '../../../config/statuses.json';
import storageLocations from '../../../config/storageLocations.json';
import { BadgeInfo, CheckCircle, Tag, Ban, CircleDollarSign, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CardVisualOverlay } from './CardVisualOverlay';
import { CollectionStats } from './CollectionStats';
import { cardImageUrl } from '../../lib/cardImage';

interface VaultGridProps
{
  items: InventoryItem[];
  onStatusChange: (id: string, status: Status) => Promise<void>;
}

export const VaultGrid: React.FC<VaultGridProps> = ({ items, onStatusChange }) =>
{
  const { inspect, clearInspect } = useInspector();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showSold, setShowSold] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const noValueFilter = searchParams.get('noValue') === '1';

  const toggleNoValueFilter = useCallback(() =>
  {
    setSearchParams((prev) =>
    {
      const next = new URLSearchParams(prev);
      if (next.get('noValue') === '1') next.delete('noValue');
      else next.set('noValue', '1');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const visibleItems = useMemo(() =>
  {
    return items.filter((item) =>
    {
      if (!showSold && item.status === 'sold') return false;
      if (noValueFilter)
      {
        const sorted = [...item.priceHistory].sort((a, b) => b.checkDate.localeCompare(a.checkDate));
        return sorted[0]?.checkedValueGbp == null;
      }
      return true;
    });
  }, [items, showSold, noValueFilter]);

  const handleStatusChange = async (itemId: string, newStatus: Status) =>
  {
    setUpdatingId(itemId);
    await onStatusChange(itemId, newStatus);
    setUpdatingId(null);
  };

  const getStatusBadge = (status: Status) =>
  {
    switch (status)
    {
      case 'vaulted':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
            <CheckCircle className="w-3 h-3" />
            Vaulted
          </span>
        );
      case 'listed':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
            <Tag className="w-3 h-3" />
            Listed
          </span>
        );
      case 'sold':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]">
            <Ban className="w-3 h-3" />
            Sold
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-slate-800 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Binder Gallery</h1>
          <div className="flex items-center gap-2">
          <button
            onClick={toggleNoValueFilter}
            className={`flex items-center gap-2 h-8 px-3 rounded-md border text-xs font-medium transition-colors ${
              noValueFilter
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            No Value
          </button>
          <button
            onClick={() => setShowSold(prev => !prev)}
            className={`flex items-center gap-2 h-8 px-3 rounded-md border text-xs font-medium transition-colors ${
              showSold
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Show Sold
          </button>
          </div>
        </div>
        <CollectionStats items={items} />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <BadgeInfo className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm font-medium">No assets registered in the vault ledger.</p>
          <p className="text-slate-600 text-xs mt-1">Navigate to "Vault New Asset" to begin tracking your collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
          {visibleItems.map((item) =>
          {
            const card = item.cardMetadata;
            const sorted = [...item.priceHistory].sort((a, b) => b.checkDate.localeCompare(a.checkDate));
            const latestVal = sorted[0]?.checkedValueGbp;
            const locationFormatted = item.storageLocation
              ? (storageLocations.find(l => l.id === item.storageLocation)?.name ?? item.storageLocation)
              : '—';

            return (
              <div
                key={item.id}
                onMouseEnter={() => inspect(cardImageUrl(card.imageUrl, 'low'), {
                  name: card.name,
                  setId: card.setName,
                  info: `${item.storageType.toUpperCase()} • ${item.condition || 'N/A'} • ${item.status.toUpperCase()}`,
                })}
                onMouseLeave={clearInspect}
                className="group relative flex flex-col bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              >
                <Link to={`/vault/item/${item.id}`} className="block">
                  <CardVisualOverlay item={item} />

                  <div className="p-2 flex flex-col space-y-2">
                    <div>
                      <h3 className="font-bold text-[10px] text-slate-200 line-clamp-1 leading-tight group-hover:text-indigo-300 transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-medium flex items-center gap-1">
                        {card.setSymbol
                          ? <img src={card.setSymbol} alt="" className="w-3 h-3 inline-block opacity-60 flex-shrink-0" />
                          : <Star className="w-3 h-3 flex-shrink-0 opacity-60" />
                        }
                        {card.setName} ({card.setNumber})
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-0.5 bg-slate-950/40 p-1.5 rounded border border-slate-800/60 font-mono text-[10px] leading-tight">
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Location</span>
                        <span className="text-slate-300 font-semibold truncate">{locationFormatted}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Est Value</span>
                        {latestVal != null
                          ? <span className="text-indigo-400 font-semibold">{`£${latestVal.toFixed(2)}`}</span>
                          : <span className="inline-block px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">N/A</span>
                        }
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="px-2 pb-2 pt-1 flex items-center justify-between border-t border-slate-800/80">
                  <div className="w-full flex items-center justify-between">
                    {getStatusBadge(item.status)}

                    <Select
                      disabled={updatingId === item.id}
                      value={item.status}
                      onValueChange={(value) => handleStatusChange(item.id, value as Status)}
                    >
                      <SelectTrigger size="sm" className="w-14 h-6 text-[10px] bg-slate-950 border-slate-800 text-slate-400 px-1.5 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
