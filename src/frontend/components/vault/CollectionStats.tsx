import React, { useMemo } from 'react';
import { InventoryItem } from '../../types';

interface Props
{
  items: InventoryItem[];
}

function latestValue(item: InventoryItem): number | null
{
  if (item.priceHistory.length === 0) return null;
  return [...item.priceHistory]
    .sort((a, b) => b.checkDate.localeCompare(a.checkDate))[0]
    .checkedValueGbp;
}

export const CollectionStats: React.FC<Props> = ({ items }) =>
{
  const stats = useMemo(() =>
  {
    const vaulted = items.filter(i => i.status === 'vaulted').length;
    const listed = items.filter(i => i.status === 'listed').length;
    const sold = items.filter(i => i.status === 'sold').length;

    let portfolioValue: number | null = null;
    let soldValue: number | null = null;

    for (const item of items)
    {
      const v = latestValue(item);
      if (v === null) continue;
      if (item.status !== 'sold')
      {
        portfolioValue = (portfolioValue ?? 0) + v;
      }
      else
      {
        soldValue = (soldValue ?? 0) + v;
      }
    }

    return { total: items.length, vaulted, listed, sold, portfolioValue, soldValue };
  }, [items]);

  const fmt = (v: number | null) => v !== null ? `£${v.toFixed(2)}` : '—';

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-slate-800/60 rounded-xl overflow-hidden border border-slate-800/60 text-center">
      <StatCell label="Total" value={String(stats.total)} color="text-slate-200" />
      <StatCell label="Vaulted" value={String(stats.vaulted)} color="text-emerald-400" />
      <StatCell label="Listed" value={String(stats.listed)} color="text-amber-400" />
      <StatCell label="Sold" value={String(stats.sold)} color="text-rose-400" />
      <StatCell label="Portfolio" value={fmt(stats.portfolioValue)} color="text-indigo-400" wide />
      <StatCell label="Sold Value" value={fmt(stats.soldValue)} color="text-rose-300" wide />
    </div>
  );
};

interface StatCellProps
{
  label: string;
  value: string;
  color: string;
  wide?: boolean;
}

const StatCell: React.FC<StatCellProps> = ({ label, value, color, wide }) =>
(
  <div className={`bg-slate-900/70 px-3 py-2.5 flex flex-col gap-0.5 ${wide ? 'sm:col-span-1' : ''}`}>
    <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
    <span className={`text-sm font-bold font-mono tabular-nums ${color}`}>{value}</span>
  </div>
);
