import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import
{
  ArrowLeft, CheckCircle, Tag, Ban, Globe, ShieldAlert,
  ExternalLink, Receipt,
  CreditCard, Package, Star, History, PoundSterling, ChevronDown, ChevronUp, Trash2, MapPin, Upload,
} from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { InventoryItem, ValuationEntry, Status } from '../types';
import statuses from '../../config/statuses.json';
import storageLocations from '../../config/storageLocations.json';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import pokemonCenterLabel from '../../../assets/pokemon-center-label.png';
import { generateEbayUkSoldLink } from '../lib/ebay';
import { generateCardmarketUkLink } from '../lib/cardmarket';
import { cardImageUrl, isDirectImageUrl } from '../lib/cardImage';

const fmt = (val: number | null | undefined, fallback = 'N/A') =>
  val != null ? `£${val.toFixed(2)}` : fallback;

const StatusBadge: React.FC<{ status: InventoryItem['status'] }> = ({ status }) =>
{
  switch (status)
  {
    case 'vaulted':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
          <CheckCircle className="w-3.5 h-3.5" /> Vaulted
        </span>
      );
    case 'listed':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
          <Tag className="w-3.5 h-3.5" /> Listed
        </span>
      );
    case 'sold':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]">
          <Ban className="w-3.5 h-3.5" /> Sold
        </span>
      );
  }
};

const LogValuationPanel: React.FC<{ itemId: string; history: ValuationEntry[]; onRecorded: (entry: ValuationEntry) => void }> = ({ itemId, history, onRecorded }) =>
{
  const [open, setOpen] = useState(false);
  const [valueInput, setValueInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...history].sort((a, b) => b.checkDate.localeCompare(a.checkDate));

  const handleRecord = async () =>
  {
    const val = parseFloat(valueInput);
    if (isNaN(val) || val < 0)
    {
      setError('Enter a valid GBP amount.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try
    {
      const res = await fetch(`/api/inventory/${itemId}/valuations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedValueGbp: val, checkDate: dateInput }),
      });
      if (!res.ok)
      {
        const data = await res.json();
        setError(data.error || 'Failed to record valuation.');
        return;
      }
      const { entry } = await res.json();
      onRecorded(entry);
      setValueInput('');
    }
    catch
    {
      setError('Network error. Try again.');
    }
    finally
    {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/80">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" /> Valuation History
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold">
              {history.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Amount (£)</p>
              <div className="relative">
                <PoundSterling className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500/50 outline-none"
                />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Date</p>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500/50 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleRecord}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              {submitting ? '...' : 'Record'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          {sorted.length > 0 && (
            <div className="space-y-1.5">
              {sorted.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                  <span className="font-mono text-[10px] text-slate-500">{entry.checkDate}</span>
                  <span className="font-mono text-xs font-bold text-indigo-400">£{entry.checkedValueGbp.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {sorted.length === 0 && (
            <p className="text-xs text-slate-600 font-mono text-center py-2">No valuations recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export const ItemDetailsPage: React.FC = () =>
{
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collection, handleStatusChange, handleDelete, refresh } = useCollection();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgSrc, setImgSrc] = useState<'low' | 'high' | 'original'>('low');
  const [localHistory, setLocalHistory] = useState<ValuationEntry[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const item = collection.find(i => i.id === id);

  if (!item)
  {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Package className="w-12 h-12 text-slate-600" />
        <p className="text-slate-400 font-medium">Item not found in the vault.</p>
        <Link
          to="/"
          className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vault
        </Link>
      </div>
    );
  }

  const card = item.cardMetadata;
  const sales = item.salesRecord;
  const priceHistory = localHistory ?? item.priceHistory;
  const sortedHistory = [...priceHistory].sort((a, b) => b.checkDate.localeCompare(a.checkDate));
  const currentValuation = sortedHistory[0]?.checkedValueGbp ?? null;

  const imageUrl = uploadedImageUrl ?? (card.imageUrl ? cardImageUrl(card.imageUrl, imgSrc) : null);

  const onStatusSelect = async (val: string) =>
  {
    setUpdatingStatus(true);
    await handleStatusChange(item.id, val as Status);
    setUpdatingStatus(false);
  };

  const onDelete = async () =>
  {
    setDeleting(true);
    await handleDelete(item.id);
    navigate('/');
  };

  const handleValuationRecorded = (entry: ValuationEntry) =>
  {
    setLocalHistory([...(localHistory ?? item.priceHistory), entry]);
    refresh();
  };

  const onLocationSelect = async (val: string) =>
  {
    setUpdatingLocation(true);
    try
    {
      await fetch(`/api/inventory/${item.id}/location`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageLocation: val === '__none__' ? null : val }),
      });
      refresh();
    }
    finally
    {
      setUpdatingLocation(false);
    }
  };

  const handlePhotoUpload = async (file: File) =>
  {
    setUploading(true);
    setUploadError(null);
    try
    {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`/api/inventory/${item.id}/image`,
      {
        method: 'POST',
        body: formData,
      });
      if (!res.ok)
      {
        const data = await res.json();
        setUploadError(data.error || 'Upload failed.');
        return;
      }
      const data = await res.json();
      setUploadedImageUrl(`${data.imageUrl}?t=${Date.now()}`);
      refresh();
    }
    catch
    {
      setUploadError('Network error. Try again.');
    }
    finally
    {
      setUploading(false);
    }
  };

  const netProfit = sales?.finalSalePriceGbp != null
    ? sales.finalSalePriceGbp
      - (sales.platformFeesGbp ?? 0)
      - (sales.shippingCostGbp ?? 0)
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-700 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Vault
        </Link>
        <span className="text-slate-700">|</span>
        <h1 className="text-sm font-mono text-slate-500 tracking-wider truncate">{item.id}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Card image */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4 shadow-xl">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={card.name}
                onError={() =>
                {
                  if (!isDirectImageUrl(card.imageUrl))
                  {
                    if (imgSrc === 'low') setImgSrc('high');
                    else if (imgSrc === 'high') setImgSrc('original');
                  }
                }}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                <CreditCard className="w-10 h-10" />
                <span className="text-xs">No image</span>
              </div>
            )}
            {item.tags.includes('pokemon-center-stamp') && (
              <div className="absolute bottom-3 right-3 pointer-events-none">
                <img src={pokemonCenterLabel} alt="Pokémon Center" className="h-7 w-auto" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9)) drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {card.language}
            </span>
            {item.isMisprint && (
              <span className="flex items-center gap-1 text-amber-400">
                <ShieldAlert className="w-3 h-3" /> Misprint
              </span>
            )}
            <span className="uppercase tracking-wider">{card.setNumber}</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
            {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading...' : 'Replace Photo'}
          </button>
          {uploadError && (
            <p className="text-xs text-rose-400 font-medium text-center">{uploadError}</p>
          )}
        </div>

        {/* Detail panels */}
        <div className="space-y-4">
          {/* Card identity */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-5 space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-wide">{card.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5 font-mono flex items-center gap-1.5">
                {card.setSymbol
                  ? <img src={card.setSymbol} alt="" className="w-4 h-4 opacity-60 flex-shrink-0" />
                  : <Star className="w-4 h-4 opacity-60 flex-shrink-0" />
                }
                {card.setName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {card.supertype}
              </span>
              {card.subtypes && card.subtypes.split(',').map(st => (
                <span key={st.trim()} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {st.trim()}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Star className="w-3 h-3" /> {card.rarity}
              </span>
            </div>
            {card.artist && (
              <p className="text-xs text-slate-500 font-mono">
                Illustrated by <span className="text-slate-300 font-medium">{card.artist}</span>
              </p>
            )}
          </div>

          {/* Storage config */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Storage Configuration</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Type</p>
                <p className="text-slate-200 font-medium capitalize">{item.storageType}</p>
              </div>
              {item.storageType === 'raw' && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Condition</p>
                  <p className="text-slate-200 font-medium">{item.condition ?? '—'}</p>
                </div>
              )}
              {item.storageType === 'graded' && (
                <>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Grading Co.</p>
                    <p className="text-slate-200 font-medium">{item.gradingCompany ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Grade</p>
                    <p className="text-slate-200 font-bold font-mono">{item.grade ?? '—'}</p>
                  </div>
                  {item.certNumber && (
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Cert #</p>
                      <p className="text-slate-200 font-mono text-xs">{item.certNumber}</p>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-slate-500 text-xs mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </p>
                <Select
                  value={item.storageLocation ?? '__none__'}
                  onValueChange={onLocationSelect}
                  disabled={updatingLocation}
                >
                  <SelectTrigger className="h-7 w-40 text-xs bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue placeholder="— Unassigned —" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="__none__" className="text-xs text-slate-400 italic">— Unassigned —</SelectItem>
                    {storageLocations.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-xs text-slate-300">{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {item.notes && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs mb-1">Notes</p>
                <p className="text-slate-300 text-sm leading-relaxed">{item.notes}</p>
              </div>
            )}
          </div>

          {/* Financial metrics */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Financial Metrics</h3>
              <div className="flex items-center gap-3">
                <a
                  href={generateCardmarketUkLink(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  CardMarket UK ↗
                </a>
                <a
                  href={generateEbayUkSoldLink(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  eBay Solds ↗
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Est. Value</p>
                <p className="text-slate-200 font-mono font-bold">{fmt(currentValuation)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Valuation Entries</p>
                <p className="text-slate-400 font-mono text-sm">{priceHistory.length}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <StatusBadge status={item.status} />
                <Select
                  value={item.status}
                  onValueChange={onStatusSelect}
                  disabled={updatingStatus || deleting}
                >
                  <SelectTrigger className="h-8 w-36 text-xs bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs text-slate-300">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Item
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Confirm?</span>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all disabled:opacity-50"
                  >
                    {deleting ? '...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 border border-slate-700 hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Valuation history */}
          <LogValuationPanel
            itemId={item.id}
            history={priceHistory}
            onRecorded={handleValuationRecorded}
          />

          {/* Sales record */}
          {sales && (
            <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" /> Sales Record
                </h3>
                {sales.listingUrl && (
                  <a
                    href={sales.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on {sales.platform ?? 'eBay'}
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {sales.listedPriceGbp != null && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Listed Price</p>
                    <p className="text-slate-200 font-mono font-bold">{fmt(sales.listedPriceGbp)}</p>
                  </div>
                )}
                {sales.dateListed && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Date Listed</p>
                    <p className="text-slate-200 font-mono text-xs">{sales.dateListed}</p>
                  </div>
                )}
                {sales.finalSalePriceGbp != null && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Final Sale</p>
                    <p className="text-emerald-400 font-mono font-bold">{fmt(sales.finalSalePriceGbp)}</p>
                  </div>
                )}
                {sales.dateSold && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Date Sold</p>
                    <p className="text-slate-200 font-mono text-xs">{sales.dateSold}</p>
                  </div>
                )}
                {sales.platformFeesGbp != null && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Platform Fees</p>
                    <p className="text-rose-400 font-mono text-sm">-{fmt(sales.platformFeesGbp)}</p>
                  </div>
                )}
                {sales.shippingCostGbp != null && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Shipping</p>
                    <p className="text-rose-400 font-mono text-sm">-{fmt(sales.shippingCostGbp)}</p>
                  </div>
                )}
              </div>
              {netProfit != null && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Net Proceeds</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">{fmt(netProfit)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
