import React, { useState, useEffect, useRef } from 'react';
import TCGdex, { Query, type CardModel, type CardResumeModel } from '@tcgdex/sdk';
import { Search, Loader2, CheckCircle2, ShieldAlert, FileText, X, Clock, Tag, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import conditions from '../../../config/conditions.json';
import gradingCompanies from '../../../config/gradingCompanies.json';
import statuses from '../../../config/statuses.json';
import tagsConfig from '../../../config/tags.json';
import storageLocationsConfig from '../../../config/storageLocations.json';
import type { Language, StorageType, Condition, GradingCompany, Status } from '../../types';

type SetEntry = { id: string; name: string };

const recentKey = (lang: Language) => `tcg-vault:recent-sets-${lang.toLowerCase()}`;

const loadRecentSets = (lang: Language): SetEntry[] =>
{
  try
  {
    return JSON.parse(localStorage.getItem(recentKey(lang)) ?? '[]');
  }
  catch
  {
    return [];
  }
};

const saveRecentSet = (lang: Language, set: SetEntry) =>
{
  const prev = loadRecentSets(lang).filter((s) => s.id !== set.id);
  localStorage.setItem(recentKey(lang), JSON.stringify([set, ...prev].slice(0, 5)));
};

interface InstanceFormProps
{
  onSuccess: () => void;
}

export const InstanceForm: React.FC<InstanceFormProps> = ({ onSuccess }) =>
{
  const [language, setLanguage] = useState<Language>('EN');
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [setQuery, setSetQuery] = useState<string>('');
  const [setDropdownOpen, setSetDropdownOpen] = useState<boolean>(false);
  const [recentSets, setRecentSets] = useState<SetEntry[]>([]);
  const [cardNameQuery, setCardNameQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CardResumeModel[]>([]);
  const [searchingCards, setSearchingCards] = useState<boolean>(false);
  const [loadingSets, setLoadingSets] = useState<boolean>(false);

  const setSearchRef = useRef<HTMLDivElement>(null);

  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);
  const [selectedCardLoading, setSelectedCardLoading] = useState<boolean>(false);

  const [storageType, setStorageType] = useState<StorageType>('raw');
  const [condition, setCondition] = useState<Condition>('NM');
  const [gradingCompany, setGradingCompany] = useState<GradingCompany>('PSA');
  const [grade, setGrade] = useState<string>('10');
  const [certNumber, setCertNumber] = useState<string>('');
  const [isMisprint, setIsMisprint] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [storageLocation, setStorageLocation] = useState<string>('');
  const [status, setStatus] = useState<Status>('vaulted');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() =>
  {
    const loadSets = async () =>
    {
      setLoadingSets(true);
      setSelectedSet('');
      setSetQuery('');
      setSetDropdownOpen(false);
      setSearchResults([]);
      setSelectedCard(null);
      try
      {
        const tcgdex = new TCGdex(language.toLowerCase() === 'jp' ? 'jp' : 'en');
        const list = await tcgdex.set.list();
        if (list)
        {
          const formatted = list
            .map((s) => ({ id: s.id, name: s.name }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setSets(formatted);
        }
      }
      catch (err)
      {
        console.error('Error loading sets from TCGdex:', err);
      }
      finally
      {
        setLoadingSets(false);
        setRecentSets(loadRecentSets(language));
      }
    };
    loadSets();
  }, [language]);

  useEffect(() =>
  {
    const handler = (e: MouseEvent) =>
    {
      if (setSearchRef.current && !setSearchRef.current.contains(e.target as Node))
      {
        setSetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredSets = setQuery.trim()
    ? sets.filter((s) => s.name.toLowerCase().includes(setQuery.toLowerCase()))
    : [];

  const handleSetSelect = (set: SetEntry) =>
  {
    setSelectedSet(set.id);
    setSetQuery(set.name);
    setSetDropdownOpen(false);
    saveRecentSet(language, set);
    setRecentSets(loadRecentSets(language));
  };

  const handleSetClear = () =>
  {
    setSelectedSet('');
    setSetQuery('');
    setSetDropdownOpen(false);
  };

  const handleTagToggle = (tagId: string) =>
  {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSearch = async (e?: React.FormEvent) =>
  {
    if (e)
    {
      e.preventDefault();
    }
    if (!cardNameQuery && !selectedSet)
    {
      setFormError('Please select a set or type a card name to search.');
      return;
    }

    setFormError(null);
    setSearchingCards(true);
    setSearchResults([]);
    setSelectedCard(null);

    try
    {
      const tcgdex = new TCGdex(language.toLowerCase() === 'jp' ? 'jp' : 'en');
      let cardsList: CardResumeModel[] = [];

      if (selectedSet)
      {
        const setDetail = await tcgdex.set.get(selectedSet);
        if (setDetail?.cards)
        {
          cardsList = setDetail.cards as CardResumeModel[];
          if (cardNameQuery.trim())
          {
            const query = cardNameQuery.toLowerCase();
            cardsList = cardsList.filter((c) => c.name.toLowerCase().includes(query));
          }
        }
      }
      else if (cardNameQuery.trim())
      {
        const queryObj = Query.create().contains('name', cardNameQuery.trim());
        const rawList = await tcgdex.card.list(queryObj);
        if (rawList)
        {
          cardsList = rawList as CardResumeModel[];
        }
      }

      setSearchResults(cardsList.slice(0, 80));
    }
    catch (err)
    {
      console.error('Error searching cards:', err);
      setFormError('Failed to retrieve card search results. Please try again.');
    }
    finally
    {
      setSearchingCards(false);
    }
  };

  const handleSelectCard = async (cardId: string) =>
  {
    setSelectedCardLoading(true);
    setFormError(null);
    try
    {
      const tcgdex = new TCGdex(language.toLowerCase() === 'jp' ? 'jp' : 'en');
      const card = await tcgdex.card.get(cardId);
      if (card)
      {
        setSelectedCard(card as CardModel);
      }
      else
      {
        setFormError('Could not resolve details for this card.');
      }
    }
    catch (err)
    {
      console.error('Error fetching full card details:', err);
      setFormError('Error loading card metadata.');
    }
    finally
    {
      setSelectedCardLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!selectedCard)
    {
      setFormError('Please select a card from the search results first.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try
    {
      const cardIdCombined = `${selectedCard.id}-${language}`;
      const cardData =
      {
        id: cardIdCombined,
        sdkId: selectedCard.id,
        name: selectedCard.name,
        supertype: selectedCard.category || 'Pokemon',
        subtypes: null,
        rarity: selectedCard.rarity || 'Common',
        setNumber: selectedCard.localId || '',
        setName: selectedCard.set?.name || 'Unknown Set',
        language,
        imageUrl: selectedCard.image || '',
        setSymbol: selectedCard.set?.symbol ? `${selectedCard.set.symbol}.png` : null,
        artist: (selectedCard as CardModel & { illustrator?: string }).illustrator || null,
      };

      const itemUuid = crypto.randomUUID();

      const instanceData =
      {
        id: itemUuid,
        cardId: cardIdCombined,
        storageType,
        condition: storageType === 'raw' ? condition : null,
        gradingCompany: storageType === 'graded' ? gradingCompany : null,
        grade: storageType === 'graded' ? parseFloat(grade) || null : null,
        certNumber: storageType === 'graded' ? certNumber || null : null,
        isMisprint,
        notes: notes.trim() || null,
        tags: selectedTags,
        storageLocation: storageLocation || null,
        status,
      };

      const response = await fetch('/api/inventory',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardData, instanceData }),
      });

      if (response.ok)
      {
        onSuccess();
      }
      else
      {
        const errorData = await response.json();
        setFormError(errorData.error || 'Server rejected the submission.');
      }
    }
    catch (err)
    {
      console.error('Error submitting asset:', err);
      setFormError('Network error submitting physical asset.');
    }
    finally
    {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Vault New Asset</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Resolve live TCG metadata and record a physical instance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              1. Metadata Discovery (TCGdex)
            </h2>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 block">Language</Label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setLanguage('EN')}
                      className={`py-1 text-xs font-bold rounded-md transition-all ${
                        language === 'EN'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('JP')}
                      className={`py-1 text-xs font-bold rounded-md transition-all ${
                        language === 'JP'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      JP
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-4" ref={setSearchRef}>
                  <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 block">Set Filter</Label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        disabled={loadingSets}
                        value={setQuery}
                        placeholder={loadingSets ? 'Syncing sets…' : 'Search sets…'}
                        onChange={(e) =>
                        {
                          setSetQuery(e.target.value);
                          if (!e.target.value.trim())
                          {
                            setSelectedSet('');
                          }
                          setSetDropdownOpen(true);
                        }}
                        onFocus={() => setSetDropdownOpen(true)}
                        className={`w-full bg-slate-950 text-slate-200 text-xs py-2 pl-3 pr-7 rounded-lg border outline-none transition-all disabled:opacity-50 placeholder:text-slate-600 ${
                          selectedSet
                            ? 'border-indigo-500/50'
                            : 'border-slate-800 focus:border-indigo-500/50'
                        }`}
                      />
                      {setQuery && (
                        <button
                          type="button"
                          onClick={handleSetClear}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {setDropdownOpen && (recentSets.length > 0 || filteredSets.length > 0) && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl overflow-hidden">
                        {recentSets.length > 0 && (
                          <div className="px-3 pt-2.5 pb-2">
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              <Clock className="w-2.5 h-2.5" />
                              Recent
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {recentSets.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleSetSelect(s); }}
                                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                                    selectedSet === s.id
                                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                                  }`}
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {filteredSets.length > 0 && (
                          <>
                            {recentSets.length > 0 && <div className="border-t border-slate-800 mx-1" />}
                            <div className="max-h-48 overflow-y-auto">
                              {filteredSets.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleSetSelect(s); }}
                                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                    selectedSet === s.id
                                      ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                                      : 'text-slate-300 hover:bg-slate-800/80'
                                  }`}
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 block">Card Name Search</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g. Charizard, Pikachu, Mewtwo..."
                    value={cardNameQuery}
                    onChange={(e) => setCardNameQuery(e.target.value)}
                    className="flex-1 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 text-xs h-9 focus-visible:border-indigo-500/50 focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    disabled={searchingCards || loadingSets}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(99,102,241,0.2)] h-9 px-4"
                  >
                    {searchingCards ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 shadow-md flex-1 flex flex-col min-h-[300px] max-h-[500px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h3>

            {searchingCards ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <span className="text-xs font-medium text-slate-400">Interrogating TCGdex Database...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/60 rounded-lg p-10 text-center bg-slate-950/20">
                <span className="text-xs text-slate-500 font-mono">
                  Enter criteria above to discover cards from the public Pokémon TCG API.
                </span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {searchResults.map((card) =>
                {
                  const isCurrentlySelected = selectedCard?.id === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectCard(card.id)}
                      className={`flex flex-col p-1.5 rounded-lg border text-center transition-all ${
                        isCurrentlySelected
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-inner'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-slate-950 rounded flex items-center justify-center p-1.5 overflow-hidden">
                        {card.image ? (
                          <img
                            src={`${card.image}/low.png`}
                            alt={card.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-[8px] text-slate-600 font-mono">No Image</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 font-semibold truncate mt-1.5 block px-1">
                        {card.name}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono block mt-0.5">
                        #{card.localId}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          {selectedCardLoading ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <span className="text-xs text-slate-400">Fetching complete metadata profiles...</span>
            </div>
          ) : selectedCard ? (
            <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-800">
                <div className="flex-1 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                    Resolved Profile
                  </span>
                  <h3 className="font-bold text-slate-200 mt-1.5 text-sm truncate">{selectedCard.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    {selectedCard.set?.name || 'Unknown Set'} (#{selectedCard.localId})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 block">Storage Configuration</Label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
                    {(['raw', 'graded'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setStorageType(type)}
                        className={`py-1.5 text-xs font-semibold rounded transition-all uppercase tracking-wider ${
                          storageType === type
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {storageType === 'raw' && (
                  <div>
                    <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 block">Estimated Condition</Label>
                    <Select
                      value={condition}
                      onValueChange={(v) => setCondition(v as Condition)}
                    >
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-300 text-xs h-9 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {storageType === 'graded' && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div>
                      <Label className="text-[9px] font-mono font-bold text-slate-500 uppercase mb-1 block">Company</Label>
                      <Select
                        value={gradingCompany}
                        onValueChange={(v) => setGradingCompany(v as GradingCompany)}
                      >
                        <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-300 text-xs h-8 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gradingCompanies.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[9px] font-mono font-bold text-slate-500 uppercase mb-1 block">Grade</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        placeholder="10"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-200 text-xs h-8 focus-visible:border-indigo-500/50 focus-visible:ring-0 px-2"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] font-mono font-bold text-slate-500 uppercase mb-1 block">Cert #</Label>
                      <Input
                        type="text"
                        placeholder="847291..."
                        value={certNumber}
                        onChange={(e) => setCertNumber(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-200 text-xs h-8 focus-visible:border-indigo-500/50 focus-visible:ring-0 px-2"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-2 bg-slate-950/40 rounded border border-slate-800/50">
                  <input
                    type="checkbox"
                    id="isMisprint"
                    checked={isMisprint}
                    onChange={(e) => setIsMisprint(e.target.checked)}
                    className="w-3.5 h-3.5 accent-indigo-500 rounded border-slate-800 cursor-pointer bg-slate-950"
                  />
                  <Label htmlFor="isMisprint" className="text-[10px] text-slate-400 font-medium cursor-pointer select-none">
                    This is an Error Card / Misprint configuration
                  </Label>
                </div>

                <div>
                  <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    Card Tags
                  </Label>
                  <div className="space-y-1 p-3 bg-slate-950/40 rounded-lg border border-slate-800/50">
                    {tagsConfig.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => handleTagToggle(tag.id)}
                          className="w-3.5 h-3.5 accent-indigo-500 rounded border-slate-800 cursor-pointer bg-slate-950 shrink-0"
                        />
                        <label htmlFor={`tag-${tag.id}`} className="flex items-baseline gap-1.5 cursor-pointer select-none">
                          <span className="text-[10px] font-mono font-bold text-slate-300">{tag.id}</span>
                          <span className="text-[9px] text-slate-600">— {tag.description}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    Storage Location
                  </Label>
                  <Select
                    value={storageLocation || 'none'}
                    onValueChange={(v) => setStorageLocation(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-300 text-xs h-9 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50">
                      <SelectValue placeholder="Unspecified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unspecified</SelectItem>
                      {storageLocationsConfig.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 block">Initial Status</Label>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as Status)}
                    >
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-300 text-xs h-9 focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-500/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5 block">Storage Notes</Label>
                    <Textarea
                      rows={1}
                      placeholder="Sleeve details, minor notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-700 text-xs focus-visible:border-indigo-500/50 focus-visible:ring-0 resize-none"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider h-10 shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Deposit in Vault
              </Button>
            </form>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-800/80 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <FileText className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                Choose a card from search results to display its image and pre-fill its metadata tracking forms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
