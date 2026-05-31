import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import
{
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useInspector } from '../../context/InspectorContext';
import { InventoryItem, Language, StorageType, Status } from '../../types';
import languages from '../../../config/languages.json';
import storageTypes from '../../../config/storageTypes.json';
import statuses from '../../../config/statuses.json';
import storageLocations from '../../../config/storageLocations.json';
import { Globe, Search, ArrowUpDown, ShieldAlert, CircleDollarSign, Star, Tag } from 'lucide-react';
import pokemonCenterLabel from '../../../../assets/pokemon-center-label.png';
import { Input } from '../ui/input';
import { CollectionStats } from './CollectionStats';
import { cardImageUrl } from '../../lib/cardImage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface VaultTableProps
{
  items: InventoryItem[];
  onStatusChange: (id: string, status: Status) => Promise<void>;
}

export const VaultTable: React.FC<VaultTableProps> = ({ items, onStatusChange }) =>
{
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { inspect, clearInspect } = useInspector();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | Language>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | StorageType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [showSold, setShowSold] = useState(false);
  const [artistFilter, setArtistFilter] = useState<string>('all');
  const noValueFilter = searchParams.get('noValue') === '1';
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleStatusChange = useCallback(async (itemId: string, newStatus: Status) =>
  {
    setUpdatingId(itemId);
    await onStatusChange(itemId, newStatus);
    setUpdatingId(null);
  }, [onStatusChange]);

  const handleCellClick = useCallback((columnId: string, e: React.MouseEvent<HTMLTableCellElement>) =>
  {
    if (columnId === 'status') e.stopPropagation();
  }, []);

  const uniqueArtists = useMemo(() =>
  {
    const seen = new Set<string>();
    for (const item of items)
    {
      if (item.cardMetadata.artist)
      {
        seen.add(item.cardMetadata.artist);
      }
    }
    return Array.from(seen).sort();
  }, [items]);

  const filteredData = useMemo(() =>
  {
    return items.filter((item) =>
    {
      if (!showSold && item.status === 'sold') return false;
      if (langFilter !== 'all' && item.cardMetadata.language !== langFilter)
      {
        return false;
      }
      if (storageFilter !== 'all' && item.storageType !== storageFilter)
      {
        return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter)
      {
        return false;
      }
      if (artistFilter !== 'all' && item.cardMetadata.artist !== artistFilter)
      {
        return false;
      }
      if (noValueFilter)
      {
        const sorted = [...item.priceHistory].sort((a, b) => b.checkDate.localeCompare(a.checkDate));
        if (sorted[0]?.checkedValueGbp != null) return false;
      }
      if (globalFilter.trim())
      {
        const query = globalFilter.toLowerCase();
        const matchesName = item.cardMetadata.name.toLowerCase().includes(query);
        const matchesSet = item.cardMetadata.setName.toLowerCase().includes(query);
        const matchesId = item.cardMetadata.sdkId.toLowerCase().includes(query);
        return matchesName || matchesSet || matchesId;
      }
      return true;
    });
  }, [items, showSold, langFilter, storageFilter, statusFilter, artistFilter, noValueFilter, globalFilter]); // noValueFilter is derived from searchParams

  const totalValue = useMemo(() =>
  {
    let sum = 0;
    let hasAny = false;
    for (const item of filteredData)
    {
      const sorted = [...item.priceHistory].sort((a, b) => b.checkDate.localeCompare(a.checkDate));
      const val = sorted[0]?.checkedValueGbp;
      if (val != null)
      {
        sum += val;
        hasAny = true;
      }
    }
    return hasAny ? sum : null;
  }, [filteredData]);

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: 'cardMetadata.name',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-slate-200 cursor-pointer"
          >
            Card Name
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: ({ row }) =>
        {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">{item.cardMetadata.name}</span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  {item.cardMetadata.setSymbol
                    ? <img src={item.cardMetadata.setSymbol} alt="" className="w-3 h-3 inline-block opacity-60 flex-shrink-0" />
                    : <Star className="w-3 h-3 flex-shrink-0 opacity-60" />
                  }
                  {item.cardMetadata.setName} • {item.cardMetadata.setNumber}
                </span>
              </div>
              {item.isMisprint && (
                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldAlert className="w-2.5 h-2.5 inline" /> ERR
                </span>
              )}
              {item.tags.includes('pokemon-center-stamp') && (
                <img src={pokemonCenterLabel} alt="Pokémon Center" className="h-3.5 w-auto inline-block" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.5))' }} />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'cardMetadata.language',
        header: 'Lang',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
            <Globe className="w-2.5 h-2.5 text-slate-500" />
            {row.original.cardMetadata.language}
          </span>
        ),
      },
      {
        accessorKey: 'storageType',
        header: 'Configuration',
        cell: ({ row }) =>
        {
          const item = row.original;
          if (item.storageType === 'graded')
          {
            return (
              <span className="text-xs text-slate-300 font-medium">
                Graded <strong className="text-indigo-400 font-bold">{item.gradingCompany} {item.grade}</strong>
                {item.certNumber && <span className="text-[9px] font-mono text-slate-500 block">#{item.certNumber}</span>}
              </span>
            );
          }
          return (
            <span className="text-xs text-slate-400">
              Raw ({item.condition || 'N/A'})
            </span>
          );
        },
      },
      {
        id: 'tags',
        header: 'Tags',
        cell: ({ row }) =>
        {
          const tags = row.original.tags;
          if (!tags || tags.length === 0)
          {
            return <span className="text-slate-600 text-[10px] font-mono">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {tag}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: 'storageLocation',
        header: 'Location',
        cell: ({ row }) =>
        {
          const loc = row.original.storageLocation;
          const locName = loc
            ? (storageLocations.find(l => l.id === loc)?.name ?? loc)
            : '—';
          return (
            <span className="text-[10px] font-mono text-slate-400">
              {locName}
            </span>
          );
        },
      },
      {
        id: 'currentValue',
        accessorFn: (row) => [...row.priceHistory].sort((a, b) => b.checkDate.localeCompare(a.checkDate))[0]?.checkedValueGbp ?? null,
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-slate-200 cursor-pointer"
          >
            Est. Value
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: ({ row }) =>
        {
          const sorted = [...row.original.priceHistory].sort(
            (a, b) => b.checkDate.localeCompare(a.checkDate)
          );
          const val = sorted[0]?.checkedValueGbp;
          if (val == null)
          {
            return (
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
                N/A
              </span>
            );
          }
          return (
            <span className="font-mono text-xs text-indigo-400 font-medium">
              {`£${val.toFixed(2)}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
        {
          const item = row.original;
          const statusColors =
          {
            vaulted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            listed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            sold: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          };
          return (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusColors[item.status]}`}>
                {item.status}
              </span>
              <Select
                disabled={updatingId === item.id}
                value={item.status}
                onValueChange={(value) => handleStatusChange(item.id, value as Status)}
              >
                <SelectTrigger size="sm" className="w-20 h-6 text-[10px] bg-slate-950 border-slate-800 text-slate-400 px-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
    ],
    [inspect, clearInspect, updatingId, handleStatusChange]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-5">
      <div className="space-y-4 border-b border-slate-800 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Ledger Sheet</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Showing {filteredData.length} of {items.length} records</p>
          </div>
          {totalValue != null && (
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Filtered Est. Value</p>
              <p className="text-lg font-bold font-mono text-indigo-400 mt-0.5">£{totalValue.toFixed(2)}</p>
            </div>
          )}
        </div>
        <CollectionStats items={items} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2 w-4 h-4 text-slate-500 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder="Search by card/set name..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 text-xs focus-visible:border-indigo-500/50 focus-visible:ring-0 h-9"
          />
        </div>

        <Select value={langFilter} onValueChange={(v) => setLangFilter(v as 'all' | Language)}>
          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 text-xs h-9 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50">
            <SelectValue placeholder="Language (All)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Language (All)</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name} ({l.id})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={storageFilter} onValueChange={(v) => setStorageFilter(v as 'all' | StorageType)}>
          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 text-xs h-9 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50">
            <SelectValue placeholder="Configuration (All)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Configuration (All)</SelectItem>
            {storageTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | Status)}>
          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 text-xs h-9 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50">
            <SelectValue placeholder="Status (All)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status (All)</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {uniqueArtists.length > 0 && (
          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 text-xs h-9 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50">
              <SelectValue placeholder="Illustrator (All)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Illustrator (All)</SelectItem>
              {uniqueArtists.map((artist) => (
                <SelectItem key={artist} value={artist}>{artist}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <button
          onClick={toggleNoValueFilter}
          className={`flex items-center gap-2 h-9 px-3 rounded-md border text-xs font-medium transition-colors ${
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
          className={`flex items-center gap-2 h-9 px-3 rounded-md border text-xs font-medium transition-colors ${
            showSold
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Show Sold
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-900/20 shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-800 bg-slate-950/60">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-xs text-slate-500 font-mono"
                >
                  No ledger data matches active filters.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/vault/item/${row.original.id}`)}
                onMouseEnter={() => inspect(cardImageUrl(row.original.cardMetadata.imageUrl, 'low'), {
                  name: row.original.cardMetadata.name,
                  setId: row.original.cardMetadata.setName,
                  info: `${row.original.storageType.toUpperCase()} • ${row.original.condition || 'N/A'} • ${row.original.status.toUpperCase()}`,
                })}
                onMouseLeave={clearInspect}
                className="border-b border-slate-800/60 hover:bg-slate-900/50 transition-colors cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="p-3 align-middle"
                    onClick={(e) => handleCellClick(cell.column.id, e)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
