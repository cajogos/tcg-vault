import React, { useState } from 'react';
import { Globe, ShieldAlert } from 'lucide-react';
import { InventoryItem } from '../../types';
import { cn } from '../../lib/utils';
import { cardImageUrl, isDirectImageUrl } from '../../lib/cardImage';
import pokemonCenterLabel from '../../../../assets/pokemon-center-label.png';

interface CardVisualOverlayProps
{
  item: InventoryItem;
}

export const CardVisualOverlay: React.FC<CardVisualOverlayProps> = ({ item }) =>
{
  const card = item.cardMetadata;
  const [imgSrc, setImgSrc] = useState(() => cardImageUrl(card.imageUrl, 'low'));
  const [imgFailed, setImgFailed] = useState(false);

  const isSold            = item.status === 'sold';
  const isListed          = item.status === 'listed';
  const isMintNM          = !isSold && item.storageType === 'raw' && (item.condition === 'Mint' || item.condition === 'NM');
  const isSealed          = !isSold && item.tags.includes('sealed');
  const isGraded          = !isSold && item.storageType === 'graded';
  const isPokemonCenter   = item.tags.includes('pokemon-center-stamp');

  return (
    <div className="relative aspect-[3/4] bg-slate-950/60 flex items-center justify-center overflow-hidden select-none">

      {/* Layer 1 — Base image */}
      {!imgFailed && card.imageUrl ? (
        <img
          src={imgSrc}
          alt={card.name}
          onError={() =>
          {
            if (!isDirectImageUrl(card.imageUrl) && imgSrc.endsWith('/low.png'))
            {
              setImgSrc(card.imageUrl);
            }
            else
            {
              setImgFailed(true);
            }
          }}
          className={cn(
            'max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]',
            isSold && 'grayscale brightness-50 contrast-75'
          )}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900/80 border border-dashed border-slate-700/40 rounded">
          <span className="text-slate-600 text-[8px] font-mono uppercase tracking-widest">No Image</span>
          <span className="text-slate-700 text-[9px] font-mono text-center px-2 line-clamp-2">{card.name}</span>
        </div>
      )}

      {/* Layer 2 — Foil shimmer (Mint / NM raw, not sold) */}
      {isMintNM && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen animate-foil-shimmer"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, rgba(139,92,246,0.55), rgba(6,182,212,0.35) 45%, rgba(244,114,182,0.2) 70%, transparent 100%)',
          }}
        />
      )}

      {/* Layer 3 — Sealed cellophane (not sold) */}
      {isSealed && (
        <>
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(6,182,212,0.07) 55%, rgba(255,255,255,0.04) 100%)',
            }}
          />
          <span className="absolute top-1.5 left-1.5 pointer-events-none px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 backdrop-blur-sm">
            Cello Seal · {card.language}
          </span>
        </>
      )}

      {/* Layer 4 — Graded slab (not sold) */}
      {isGraded && (
        <>
          <div className="absolute inset-0 pointer-events-none border-[3px] border-slate-300/50 rounded-sm shadow-[inset_0_0_12px_rgba(255,255,255,0.06),0_0_18px_rgba(148,163,184,0.12)]" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 py-1.5 bg-slate-900/90 border-b border-slate-300/20 pointer-events-none backdrop-blur-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">
              {item.gradingCompany}
            </span>
            <span className="text-[9px] font-black text-indigo-400 font-mono">
              {item.grade}
            </span>
            <span className="text-[8px] text-slate-500 font-mono uppercase">{card.language}</span>
          </div>
        </>
      )}

      {/* Layer 5 — Listed badge */}
      {isListed && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 backdrop-blur-sm pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[7px] font-bold uppercase tracking-wider text-amber-400">On Market</span>
        </div>
      )}

      {/* Layer 6 — Sold stamp */}
      {isSold && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <div className="-rotate-[20deg] border-2 border-dashed border-rose-500/80 px-3 py-1 rounded-sm bg-slate-950/70 backdrop-blur-sm">
            <span className="text-rose-500 font-black text-2xl tracking-[0.2em] uppercase font-mono">SOLD</span>
          </div>
          {item.salesRecord?.finalSalePriceGbp != null && (
            <p className="mt-2 text-rose-400/80 font-mono text-[11px] font-bold">
              £{item.salesRecord.finalSalePriceGbp.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Language + misprint badges (non-graded, non-sealed; graded/sealed handle language separately) */}
      {!isGraded && !isSealed && (
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900/90 text-indigo-400 border border-slate-800">
            <Globe className="w-2.5 h-2.5" />
            {card.language}
          </span>
          {item.isMisprint && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-2.5 h-2.5" />
              ERR
            </span>
          )}
        </div>
      )}

      {/* Storage badge bottom-right (non-graded) */}
      {!isGraded && (
        <div className="absolute bottom-2 right-2 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {isSealed ? 'Sealed' : (item.condition || 'Raw')}
          </span>
        </div>
      )}

      {/* Pokémon Center stamp label */}
      {isPokemonCenter && (
        <div className="absolute bottom-7 right-1.5 pointer-events-none">
          <img src={pokemonCenterLabel} alt="Pokémon Center" className="h-4 w-auto" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.5))' }} />
        </div>
      )}

    </div>
  );
};
