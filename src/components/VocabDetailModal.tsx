import React, { useState, useEffect } from 'react';
import { VocabWord } from '../types/prep';
import {
  X,
  Volume2,
  BookmarkPlus,
  BookmarkCheck,
  Star,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Lightbulb,
} from 'lucide-react';
import { playNativeAudio, playTextToSpeech } from '../utils/speech';

interface VocabDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordQuery?: string;
  contextSentence?: string;
  initialWord?: VocabWord;
  isSaved: boolean;
  onToggleSave: (word: VocabWord) => void;
  onDirectAddWord?: (word: string, context?: string, meaning?: string) => void;
  onToggleMastered?: (wordId: string) => void;
  onToggleStarred?: (wordId: string) => void;
}

export const VocabDetailModal: React.FC<VocabDetailModalProps> = ({
  isOpen,
  onClose,
  wordQuery,
  contextSentence,
  initialWord,
  isSaved,
  onToggleSave,
  onDirectAddWord,
  onToggleMastered,
  onToggleStarred,
}) => {
  const [data, setData] = useState<VocabWord | null>(initialWord || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [playingAccent, setPlayingAccent] = useState<'us' | 'uk' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      return;
    }

    if (initialWord) {
      setData(initialWord);
      return;
    }

    if (wordQuery) {
      const cleanLower = wordQuery.trim().toLowerCase();

      // 1. Instant cache check (0ms)
      try {
        const cacheMap = JSON.parse(localStorage.getItem('prep_vocab_cache') || '{}');
        if (cacheMap[cleanLower]) {
          const cached = cacheMap[cleanLower];
          const cachedWord: VocabWord = {
            id: `vocab-${Date.now()}`,
            word: cached.word || wordQuery,
            phonetic: cached.phonetic || '',
            partOfSpeech: cached.partOfSpeech || '',
            meaningZh: cached.meaningZh || '',
            definitions: cached.definitions || [],
            usageNotes: cached.usageNotes || '',
            collocations: cached.collocations || [],
            examples: cached.examples || [],
            prepTip: cached.prepTip || '',
            addedAt: Date.now(),
            contextSentence: contextSentence,
            starred: false,
            mastered: false,
          };
          setData(cachedWord);
          setIsLoading(false);
          return;
        }
      } catch {}

      // 2. Optimistic initial render so user sees word title & can save immediately
      setData({
        id: `vocab-${Date.now()}`,
        word: wordQuery.trim(),
        phonetic: '',
        partOfSpeech: wordQuery.includes(' ') ? 'phrase' : '',
        meaningZh: '正在智能检索精准语境释义...',
        definitions: [],
        usageNotes: '',
        collocations: [],
        examples: contextSentence ? [{ en: contextSentence, zh: '当前语境例句' }] : [],
        addedAt: Date.now(),
        contextSentence: contextSentence,
        starred: false,
        mastered: false,
        enriching: true,
      });

      fetchWordDefinition(wordQuery, contextSentence);
    }
  }, [isOpen, wordQuery, initialWord]);

  const fetchWordDefinition = async (query: string, context?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vocab/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: query, context }),
      });

      if (!res.ok) {
        throw new Error('查词失败，请检查网络后重试');
      }

      const json = await res.json();
      const newWord: VocabWord = {
        id: `vocab-${Date.now()}`,
        word: json.word || query,
        phonetic: json.phonetic || '',
        partOfSpeech: json.partOfSpeech || '',
        meaningZh: json.meaningZh || '',
        definitions: json.definitions || [],
        usageNotes: json.usageNotes || '',
        collocations: json.collocations || [],
        examples: json.examples || [],
        prepTip: json.prepTip || '',
        addedAt: Date.now(),
        contextSentence: context,
        starred: false,
        mastered: false,
        enriching: false,
      };

      setData(newWord);

      // Save to client cache
      try {
        const cacheMap = JSON.parse(localStorage.getItem('prep_vocab_cache') || '{}');
        cacheMap[query.trim().toLowerCase()] = json;
        localStorage.setItem('prep_vocab_cache', JSON.stringify(cacheMap));
      } catch {}
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '查词失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-modal rounded-3xl max-w-xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl border border-white/90 animate-in fade-in zoom-in-95 duration-150 safe-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-200/50 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-white/20 shrink-0">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-zinc-950 uppercase tracking-wider font-mono">
              PREP 语境词典与生词本
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-black rounded-full hover:bg-white/80 transition-colors active-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {!data && isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">正在解析单词发音、地道搭配与 PREP 用法...</p>
            </div>
          ) : error && !data ? (
            <div className="p-4 rounded-2xl bg-white/70 border border-zinc-300 text-zinc-800 text-center">
              <p className="font-semibold">{error}</p>
              <button
                onClick={() => wordQuery && fetchWordDefinition(wordQuery, contextSentence)}
                className="mt-2 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold"
              >
                重试查词
              </button>
            </div>
          ) : data ? (
            <>
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100/80 border border-zinc-200 text-zinc-600 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-ping" />
                  <span>正在极速补充地道搭配与语境例句...</span>
                </div>
              )}
              {/* Word Title & Audio */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-200/50">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight font-serif">
                      {data.word}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-zinc-500 font-mono text-xs">
                    {data.phonetic && <span className="font-semibold text-zinc-800">{data.phonetic}</span>}
                    {data.partOfSpeech && (
                      <>
                        <span aria-hidden="true" className="text-zinc-300">·</span>
                        <span className="italic font-sans text-zinc-600 font-medium">
                          {data.partOfSpeech}
                        </span>
                      </>
                    )}

                    {/* US Audio button */}
                    <button
                      onClick={() => {
                        setPlayingAccent('us');
                        playNativeAudio(data.word, 'us', () => setPlayingAccent(null));
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        playingAccent === 'us'
                          ? 'bg-black text-white shadow-xs'
                          : 'liquid-glass-pill text-zinc-800 hover:text-black'
                      }`}
                      title="播放美音真人发音 (US Studio Audio)"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>美音 🇺🇸</span>
                    </button>

                    {/* UK Audio button */}
                    <button
                      onClick={() => {
                        setPlayingAccent('uk');
                        playNativeAudio(data.word, 'uk', () => setPlayingAccent(null));
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        playingAccent === 'uk'
                          ? 'bg-black text-white shadow-xs'
                          : 'liquid-glass-pill text-zinc-800 hover:text-black'
                      }`}
                      title="播放英音真人发音 (UK Studio Audio)"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>英音 🇬🇧</span>
                    </button>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleSave(data)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      isSaved
                        ? 'bg-zinc-100 text-zinc-900 border border-zinc-300 shadow-xs'
                        : 'apple-button-black'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-black" />
                        <span>已在生词本</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-white" />
                        <span>存入生词本</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chinese Meaning */}
              <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/80">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  中文核心释义
                </span>
                <p className="text-sm font-semibold text-zinc-950 leading-snug">
                  {data.meaningZh}
                </p>
              </div>

              {/* Practical Usage Notes */}
              {data.usageNotes && (
                <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/80">
                  <div className="flex items-center gap-1.5 text-zinc-900 font-bold mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-zinc-700" />
                    <span>用法辨析与语境色彩</span>
                  </div>
                  <p className="text-zinc-700 leading-relaxed text-[11px]">
                    {data.usageNotes}
                  </p>
                </div>
              )}

              {/* Collocations */}
              {data.collocations && data.collocations.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                    高频生活搭配 (Collocations)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.collocations.map((col, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full liquid-glass-pill text-zinc-900 text-[11px] font-medium"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {data.examples && data.examples.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                    实用双语例句
                  </span>
                  <div className="space-y-2">
                    {data.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl liquid-glass-subtle border border-white/80 text-xs space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-zinc-900 leading-relaxed font-sans">
                            "{ex.en}"
                          </p>
                          <button
                            onClick={() => playTextToSpeech(ex.en)}
                            className="p-1 text-zinc-400 hover:text-black shrink-0 rounded"
                            title="朗读例句"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {ex.zh && (
                          <p className="text-zinc-500 text-[11px] font-normal">
                            {ex.zh}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PREP Application Tip */}
              {data.prepTip && (
                <div className="p-4 rounded-2xl bg-zinc-900 text-white shadow-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    <span>PREP 结构性输出实战建议</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    {data.prepTip}
                  </p>
                </div>
              )}

              {/* Surrounding Context sentence if user selected from article */}
              {data.contextSentence && (
                <div className="text-[11px] text-zinc-400 border-t border-zinc-200/50 pt-2 italic">
                  来源上下文: "...{data.contextSentence}..."
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
