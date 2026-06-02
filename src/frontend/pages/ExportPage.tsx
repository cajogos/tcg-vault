import React, { useState, useEffect, useCallback } from 'react';
import { FileDown, CheckSquare, Square, Download, History } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { InventoryItem, ExportRecord } from '../types';
import tagsConfig from '../../config/tags.json';
import { cardImageUrl } from '../lib/cardImage';

function latestValue(item: InventoryItem): number | null
{
  if (item.priceHistory.length === 0) return null;
  return [...item.priceHistory]
    .sort((a, b) => b.checkDate.localeCompare(a.checkDate))[0]
    .checkedValueGbp;
}

function tagShortLabel(id: string): string
{
  return tagsConfig.find(t => t.id === id)?.shortLabel ?? id;
}

function tagDescription(id: string): string
{
  return tagsConfig.find(t => t.id === id)?.description ?? id;
}

function formatGbp(value: number | null): string
{
  if (value === null) return 'N/A';
  return `£${value.toFixed(2)}`;
}

function escapeHtml(str: string): string
{
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardGradeLabel(item: InventoryItem): string
{
  if (item.storageType === 'graded' && item.gradingCompany && item.grade !== null)
  {
    const g = item.grade % 1 === 0 ? String(item.grade) : item.grade.toFixed(1);
    return `[${item.gradingCompany} ${g}]`;
  }
  return item.condition ? `[${item.condition}]` : '';
}

function generateHtml(items: InventoryItem[], tagIds: string[], discountPercent: number | null, baseUrl: string): string
{
  const tagHeaders = tagIds
    .map(id => `<th>${escapeHtml(tagShortLabel(id))}</th>`)
    .join('');

  const rows = items.map(item =>
  {
    const value = latestValue(item);
    const rawImgSrc = cardImageUrl(item.cardMetadata.imageUrl, 'low');
    const imgSrc = rawImgSrc.startsWith('/') ? `${baseUrl}${rawImgSrc}` : rawImgSrc;
    const label = cardGradeLabel(item);
    const tagCells = tagIds
      .map(id => `<td class="tag-cell">${item.tags.includes(id) ? '✓' : '—'}</td>`)
      .join('');

    return `<tr>
      <td class="img-cell"><img src="${escapeHtml(imgSrc)}" width="70" alt="${escapeHtml(item.cardMetadata.name)}" /></td>
      <td class="name-cell">${escapeHtml(item.cardMetadata.name)}${label ? ` <span class="grade-label">${escapeHtml(label)}</span>` : ''}</td>
      <td>${escapeHtml(item.cardMetadata.setName)} <span class="set-number">[${escapeHtml(item.cardMetadata.setNumber)}]</span></td>
      <td class="value-cell">${escapeHtml(formatGbp(value))}</td>
      ${tagCells}
    </tr>`;
  }).join('\n');

  const valuedItems = items.filter(item => latestValue(item) !== null);
  const total = valuedItems.reduce((sum, item) => sum + (latestValue(item) ?? 0), 0);
  const extraCols = tagIds.length;
  const spanCols = 3 + extraCols;

  const discountRows = discountPercent !== null
    ? `<tr class="summary-row">
        <td colspan="${spanCols}" class="summary-label">Discount (${discountPercent}%)</td>
        <td class="value-cell summary-discount">−${escapeHtml(formatGbp(total * discountPercent / 100))}</td>
      </tr>
      <tr class="summary-row final-row">
        <td colspan="${spanCols}" class="summary-label">Final Total</td>
        <td class="value-cell summary-final">${escapeHtml(formatGbp(total * (1 - discountPercent / 100)))}</td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TCG Card Export</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; background: #fff; padding: 24px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: #555; margin-bottom: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; text-align: left; padding: 8px 10px; border: 1px solid #ccc; font-weight: 600; font-size: 12px; white-space: nowrap; }
    td { padding: 6px 10px; border: 1px solid #ddd; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafafa; }
    .img-cell { width: 86px; padding: 4px 6px; }
    .img-cell img { display: block; border-radius: 4px; }
    .name-cell { font-weight: 500; }
    .grade-label { color: #555; font-weight: 400; font-size: 11px; }
    .set-number { color: #777; font-size: 11px; }
    .value-cell { font-weight: 600; white-space: nowrap; }
    .tag-cell { text-align: center; color: #333; }
    .summary-row td { background: #f5f5f5; border-top: 2px solid #bbb; }
    .summary-label { font-weight: 600; text-align: right; color: #333; padding-right: 12px; }
    .summary-discount { color: #c00; }
    .final-row td { background: #e8f0e8; border-top: 1px solid #999; }
    .summary-final { color: #155724; }
    @media print {
      body { padding: 0; }
      .subtitle { display: none; }
    }
  </style>
</head>
<body>
  <h1>TCG Card Collection</h1>
  <p class="subtitle">Exported ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} &middot; ${items.length} card${items.length !== 1 ? 's' : ''}</p>
  <table>
    <thead>
      <tr>
        <th>Image</th>
        <th>Name</th>
        <th>Set</th>
        <th>Est. Value</th>
        ${tagHeaders}
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="summary-row">
        <td colspan="${spanCols}" class="summary-label">Total</td>
        <td class="value-cell" style="font-weight:700;">${escapeHtml(formatGbp(total))}</td>
      </tr>
      ${discountRows}
    </tbody>
  </table>
</body>
</html>`;
}

export const ExportPage: React.FC = () =>
{
  const { collection } = useCollection();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includedTagColumns, setIncludedTagColumns] = useState<Set<string>>(new Set());
  const [discountInput, setDiscountInput] = useState<string>('');
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

  const sorted = [...collection].sort((a, b) =>
    a.cardMetadata.name.localeCompare(b.cardMetadata.name)
  );

  const allCollectionTags = tagsConfig
    .map(t => t.id)
    .filter(id => collection.some(item => item.tags.includes(id)));

  const selectedItems = sorted.filter(item => selectedIds.has(item.id));
  const availableTags = allCollectionTags.filter(id =>
    selectedItems.some(item => item.tags.includes(id))
  );

  const fetchHistory = useCallback(async () =>
  {
    try
    {
      const res = await fetch('/api/exports');
      if (res.ok)
      {
        setExportHistory(await res.json());
      }
    }
    catch
    {
      // history is non-critical; ignore errors
    }
  }, []);

  useEffect(() =>
  {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() =>
  {
    setIncludedTagColumns(prev =>
    {
      const next = new Set(prev);
      availableTags.forEach(tag => next.add(tag));
      [...prev].forEach(tag =>
      {
        if (!availableTags.includes(tag)) next.delete(tag);
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  const allSelected = collection.length > 0 && selectedIds.size === collection.length;

  const toggleSelectAll = useCallback(() =>
  {
    if (allSelected)
    {
      setSelectedIds(new Set());
    }
    else
    {
      setSelectedIds(new Set(collection.map(item => item.id)));
    }
  }, [allSelected, collection]);

  const toggleItem = useCallback((id: string) =>
  {
    setSelectedIds(prev =>
    {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleTagColumn = useCallback((tagId: string) =>
  {
    setIncludedTagColumns(prev =>
    {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const discountPercent: number | null = (() =>
  {
    const n = parseFloat(discountInput);
    return discountInput.trim() !== '' && !isNaN(n) && n > 0 && n <= 100 ? n : null;
  })();

  const selectedTotal = selectedItems.reduce((sum, item) =>
  {
    const v = latestValue(item);
    return v !== null ? sum + v : sum;
  }, 0);

  const handleExport = useCallback(async () =>
  {
    const activeTags = availableTags.filter(t => includedTagColumns.has(t));
    const html = generateHtml(selectedItems, activeTags, discountPercent, window.location.origin);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `tcg-export-${new Date().toISOString().slice(0, 10)}.html`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    try
    {
      await fetch('/api/exports',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          exportedAt: new Date().toISOString(),
          fileName,
          itemCount: selectedItems.length,
          totalValueGbp: selectedTotal > 0 ? selectedTotal : null,
          discountPercent: discountPercent,
          finalValueGbp: discountPercent !== null ? selectedTotal * (1 - discountPercent / 100) : null,
          includedTagIds: activeTags,
        }),
      });
      fetchHistory();
    }
    catch
    {
      // history recording is non-critical; ignore errors
    }
  }, [selectedItems, availableTags, includedTagColumns, discountPercent, selectedTotal, fetchHistory]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: card selector */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">Select Cards</span>
            {collection.length > 0 && (
              <span className="text-xs text-slate-500">({collection.length} total)</span>
            )}
          </div>
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {allSelected
              ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              : <Square className="w-3.5 h-3.5" />
            }
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="overflow-auto flex-1">
          {collection.length === 0
            ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                No cards in vault
              </div>
            )
            : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-900 border-b border-slate-800">
                    <th className="w-8 px-3 py-2" />
                    <th className="w-14 py-2" />
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 whitespace-nowrap">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 whitespace-nowrap">Set</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-400 whitespace-nowrap">Est. Value</th>
                    {allCollectionTags.map(tagId => (
                      <th key={tagId} className="text-center px-2 py-2 text-xs font-semibold text-slate-400 whitespace-nowrap">
                        {tagShortLabel(tagId)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(item =>
                  {
                    const selected = selectedIds.has(item.id);
                    const value = latestValue(item);
                    const label = cardGradeLabel(item);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`cursor-pointer border-b border-slate-800/60 transition-colors ${
                          selected
                            ? 'bg-indigo-600/10 hover:bg-indigo-600/15'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-3 py-1.5">
                          {selected
                            ? <CheckSquare className="w-4 h-4 text-indigo-400" />
                            : <Square className="w-4 h-4 text-slate-600" />
                          }
                        </td>
                        <td className="py-1 pr-1">
                          {item.cardMetadata.imageUrl
                            ? (
                              <img
                                src={cardImageUrl(item.cardMetadata.imageUrl, 'low')}
                                alt={item.cardMetadata.name}
                                width={40}
                                className="rounded block"
                                loading="lazy"
                                onError={(e) =>
                                {
                                  const img = e.currentTarget;
                                  if (!img.src.endsWith('/low.png')) return;
                                  img.src = item.cardMetadata.imageUrl;
                                }}
                              />
                            )
                            : <div className="w-10 h-14 bg-slate-800 rounded" />
                          }
                        </td>
                        <td className="px-3 py-1.5 font-medium text-slate-200 whitespace-nowrap">
                          {item.cardMetadata.name}
                          {label && (
                            <span className="ml-1.5 text-xs font-normal text-slate-500">{label}</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-slate-400 text-xs max-w-[160px] truncate">
                          {item.cardMetadata.setName}
                          <span className="ml-1 text-slate-600 font-mono">[{item.cardMetadata.setNumber}]</span>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs font-medium text-slate-300 whitespace-nowrap">
                          {formatGbp(value)}
                        </td>
                        {allCollectionTags.map(tagId => (
                          <td key={tagId} className="px-2 py-1.5 text-center text-xs">
                            {item.tags.includes(tagId)
                              ? <span className="text-indigo-400 font-semibold">✓</span>
                              : <span className="text-slate-700">—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      </div>

      {/* Right: export controls */}
      <div className="w-64 shrink-0 flex flex-col p-4 gap-4 overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">Export</span>
          </div>
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedIds.size > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-900/40'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            HTML
          </button>
        </div>

        <div className={`text-sm font-medium ${selectedIds.size > 0 ? 'text-indigo-300' : 'text-slate-500'}`}>
          {selectedIds.size > 0
            ? `${selectedIds.size} card${selectedIds.size !== 1 ? 's' : ''} selected`
            : 'No cards selected'
          }
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-col gap-1.5 rounded-lg bg-slate-800/60 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total</span>
              <span className="font-semibold text-slate-200 tabular-nums">{formatGbp(selectedTotal)}</span>
            </div>
            {discountPercent !== null && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Discount ({discountPercent}%)</span>
                  <span className="font-medium text-red-400 tabular-nums">−{formatGbp(selectedTotal * discountPercent / 100)}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-700 pt-1.5 mt-0.5">
                  <span className="text-slate-300 font-semibold">Final Total</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{formatGbp(selectedTotal * (1 - discountPercent / 100))}</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="e.g. 10"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors tabular-nums"
            />
            <span className="text-xs text-slate-500 shrink-0">%</span>
          </div>
          {discountInput.trim() !== '' && discountPercent === null && (
            <p className="text-xs text-red-400">Enter a value between 0 and 100</p>
          )}
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tag Columns</p>
            <div className="flex flex-col gap-1.5">
              {availableTags.map(tagId => (
                <label
                  key={tagId}
                  className="flex items-start gap-2 cursor-pointer group"
                  onClick={(e) =>
                  {
                    e.preventDefault();
                    toggleTagColumn(tagId);
                  }}
                >
                  {includedTagColumns.has(tagId)
                    ? <CheckSquare className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    : <Square className="w-4 h-4 text-slate-600 mt-0.5 shrink-0 group-hover:text-slate-400" />
                  }
                  <span className="text-xs text-slate-300 leading-relaxed">
                    {tagDescription(tagId)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {exportHistory.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">History</p>
            </div>
            <div className="flex flex-col gap-1">
              {exportHistory.slice(0, 5).map(record => (
                <div key={record.id} className="rounded-md bg-slate-800/60 px-2.5 py-2 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-slate-400 tabular-nums">
                      {new Date(record.exportedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 tabular-nums">
                      {formatGbp(record.finalValueGbp ?? record.totalValueGbp)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {record.itemCount} card{record.itemCount !== 1 ? 's' : ''}
                    {record.discountPercent !== null && ` · ${record.discountPercent}% off`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
