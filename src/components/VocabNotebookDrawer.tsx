import React, { useState } from 'react';
import { VocabWord, CloudSyncConfig } from '../types/prep';
import {
  X,
  Search,
  Plus,
  Volume2,
  Star,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { playNativeAudio } from '../utils/speech';

interface VocabNotebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  words: VocabWord[];
  onOpenWordDetail: (word: VocabWord) => void;
  onAddWordQuery: (query: string) => void;
  onDirectAddWord?: (word: string, context?: string, meaning?: string) => void;
  onDeleteWord: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onImportWords: (imported: VocabWord[]) => void;
  onOpenSyncModal?: () => void;
  syncCode?: string | null;
}

export const VocabNotebookDrawer: React.FC<VocabNotebookDrawerProps> = ({
  isOpen,
  onClose,
  words,
  onOpenWordDetail,
  onAddWordQuery,
  onDirectAddWord,
  onDeleteWord,
  onToggleMastered,
  onToggleStarred,
  onImportWords,
  onOpenSyncModal,
  syncCode,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'flashcards' | 'sync'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'learning' | 'mastered' | 'starred'>('all');
  const [quickAddInput, setQuickAddInput] = useState('');

  // Flashcard mode state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Cloud Sync state
  const [syncConfig, setSyncConfig] = useState<CloudSyncConfig>(() => {
    try {
      const saved = localStorage.getItem('prep_cloud_sync_config');
      return saved
        ? JSON.parse(saved)
        : {
            syncType: 'local_export',
            endpointUrl: '',
            secretToken: '',
            autoSync: false,
          };
    } catch {
      return {
        syncType: 'local_export',
        endpointUrl: '',
        secretToken: '',
        autoSync: false,
      };
    }
  });
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const masteredCount = words.filter((w) => w.mastered).length;
  const masteryPercentage = words.length > 0 ? Math.round((masteredCount / words.length) * 100) : 0;

  // Filtered words
  const filteredWords = words.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaningZh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.collocations.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'learning') return !w.mastered;
    if (filterType === 'mastered') return w.mastered;
    if (filterType === 'starred') return w.starred;
    return true;
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddInput.trim()) return;
    const wordToAdd = quickAddInput.trim();
    if (onDirectAddWord) {
      onDirectAddWord(wordToAdd);
    } else {
      onAddWordQuery(wordToAdd);
    }
    setQuickAddInput('');
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(words, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `prep-master-vocab-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSyncMessage('已成功导出生词本 JSON 数据！');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportWords(parsed);
          setSyncMessage(`成功导入并合并 ${parsed.length} 个单词！`);
          setTimeout(() => setSyncMessage(null), 3500);
        } else {
          alert('导入格式错误：文件内容必须为包含单词对象的 JSON 数组。');
        }
      } catch (err) {
        alert('解析 JSON 文件失败，请确认文件格式。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save sync config
  const handleSaveSyncConfig = () => {
    localStorage.setItem('prep_cloud_sync_config', JSON.stringify(syncConfig));
    setSyncMessage('云端同步配置已保存！支持与外部 APP 保持相同数据协议。');
    setTimeout(() => setSyncMessage(null), 3500);
  };

  // Flashcards navigation
  const currentCard = filteredWords[flashcardIndex] || filteredWords[0];
  const handleNextCard = (markMastered?: boolean) => {
    if (currentCard && markMastered) {
      onToggleMastered(currentCard.id);
    }
    setIsFlipped(false);
    if (flashcardIndex < filteredWords.length - 1) {
      setFlashcardIndex(flashcardIndex + 1);
    } else {
      setFlashcardIndex(0);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl liquid-glass text-zinc-900 rounded-[28px] sm:rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Apple Style */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950 font-sans flex items-center gap-1.5">
                日常生词本与地道语汇库
                <span className="text-[11px] bg-zinc-200/80 text-zinc-700 font-semibold px-2 py-0.5 rounded-full font-mono">
                  {words.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                已收录 {words.length} 词 · 已掌握 {masteredCount} 词 ({masteryPercentage}%)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-black rounded-full hover:bg-white/80 transition-colors active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: List / Flashcards / Sync Plan */}
        <div className="px-3.5 sm:px-6 pt-2.5 border-b border-zinc-200/50 flex items-center justify-between sm:justify-start gap-2 sm:gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 border-b-2 transition-all active-press flex-1 sm:flex-none text-center ${
              activeTab === 'list'
                ? 'border-black text-black font-bold'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            词汇列表 ({words.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('flashcards');
              setIsFlipped(false);
              setFlashcardIndex(0);
            }}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'flashcards'
                ? 'border-black text-black font-bold'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>卡片翻转背诵</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-black text-black font-bold'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>云端同步规划</span>
          </button>
        </div>

        {/* Sync notification message banner */}
        {syncMessage && (
          <div className="bg-zinc-900 text-white px-4 py-2 border-b border-zinc-800 text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-zinc-300" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* 1. LIST VIEW */}
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Add and Search Bar */}
            <div className="p-4 bg-white/40 border-b border-zinc-200/50 space-y-2.5">
              {/* Quick Add */}
              <form onSubmit={handleQuickAdd} className="flex gap-2">
                <input
                  type="text"
                  placeholder="手动输入新单词查词 (如: unwind, mindful, cozy)..."
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 bg-white/80 border border-zinc-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-zinc-900 placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 apple-button-black rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>查词加入</span>
                </button>
              </form>

              {/* Search & Filter pills */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="按英文或中文释义搜索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white/80 border border-zinc-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-zinc-800 placeholder:text-zinc-400"
                  />
                </div>

                <div className="flex items-center gap-1 text-[11px] liquid-glass-rail p-1 rounded-full">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-0.5 rounded-full transition-colors ${
                      filterType === 'all' ? 'bg-black text-white font-semibold' : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setFilterType('learning')}
                    className={`px-2.5 py-0.5 rounded-full transition-colors ${
                      filterType === 'learning' ? 'bg-black text-white font-semibold' : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    学习中
                  </button>
                  <button
                    onClick={() => setFilterType('mastered')}
                    className={`px-2.5 py-0.5 rounded-full transition-colors ${
                      filterType === 'mastered' ? 'bg-black text-white font-semibold' : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    已掌握
                  </button>
                  <button
                    onClick={() => setFilterType('starred')}
                    className={`px-2 py-0.5 rounded-full transition-colors ${
                      filterType === 'starred' ? 'bg-black text-white' : 'text-zinc-400 hover:text-black'
                    }`}
                    title="仅看星标"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </div>

            {/* Word Cards List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredWords.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-xs">
                  <BookOpen className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                  <p className="font-semibold text-zinc-700">没有匹配的生词</p>
                  <p className="mt-1 text-zinc-500">
                    在阅读题目、纠错报告或高分范本时，随时<span className="text-black font-semibold">选中任意英文</span>即可 1 键存入生词本。
                  </p>
                </div>
              ) : (
                filteredWords.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all text-xs ${
                      item.mastered
                        ? 'liquid-glass-subtle opacity-75 border-zinc-200/60'
                        : 'liquid-glass-subtle border-white/80 hover:bg-white/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Left: word & phonetic */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenWordDetail(item)}
                            className="font-bold text-sm text-zinc-950 hover:underline font-serif transition-colors text-left"
                          >
                            {item.word}
                          </button>
                          <button
                            onClick={() => playNativeAudio(item.word, 'us')}
                            className="p-1 text-zinc-400 hover:text-black rounded"
                            title="播放美音发音"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          {item.phonetic && (
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {item.phonetic}
                            </span>
                          )}
                        </div>

                        {item.enriching ? (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-ping" />
                            <span className="italic font-sans">正在自动解析发音与语境...</span>
                          </div>
                        ) : (
                          <p className="font-medium text-zinc-800 mt-1 line-clamp-1">
                            {item.meaningZh}
                          </p>
                        )}

                        {/* Top Collocations preview */}
                        {item.collocations && item.collocations.length > 0 && (
                          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1 italic font-sans">
                            搭配：{item.collocations.slice(0, 2).join(' · ')}
                          </p>
                        )}
                      </div>

                      {/* Right actions: Star, Mastered, Detail, Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onToggleStarred(item.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.starred ? 'text-zinc-950' : 'text-zinc-300 hover:text-zinc-600'
                          }`}
                          title="收藏星标"
                        >
                          <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-black' : ''}`} />
                        </button>

                        <button
                          onClick={() => onToggleMastered(item.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.mastered ? 'text-black font-bold' : 'text-zinc-300 hover:text-black'
                          }`}
                          title={item.mastered ? '标为学习中' : '标为已掌握'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenWordDetail(item)}
                          className="p-1.5 text-zinc-400 hover:text-black rounded-lg"
                          title="查看完整用法例句"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteWord(item.id)}
                          className="p-1.5 text-zinc-300 hover:text-black rounded-lg"
                          title="移出生词本"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. FLASHCARD QUIZ MODE */}
        {activeTab === 'flashcards' && (
          <div className="flex-1 flex flex-col justify-between p-5 overflow-y-auto">
            {filteredWords.length === 0 ? (
              <div className="py-20 text-center text-zinc-400 text-xs">
                <Layers className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                <p>当前筛选条件下没有待复习单词</p>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                  <span>
                    复习进度：{flashcardIndex + 1} / {filteredWords.length}
                  </span>
                  <span className="font-mono font-medium text-zinc-900">
                    {currentCard.mastered ? '✓ 已掌握' : '⏳ 学习中'}
                  </span>
                </div>

                {/* Flip Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="flex-1 min-h-[300px] liquid-glass-dark text-white rounded-3xl p-7 flex flex-col justify-between cursor-pointer border border-white/10 shadow-2xl transition-all select-none hover:border-white/20 relative"
                >
                  {!isFlipped ? (
                    /* Front: English */
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                        正面 · 英文表达
                      </span>
                      <h3 className="text-3xl font-extrabold tracking-tight font-serif text-white">
                        {currentCard.word}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-mono">
                          {currentCard.phonetic}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playNativeAudio(currentCard.word, 'us');
                          }}
                          className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1 transition-colors border border-white/10"
                          title="播放美音"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>美音 🇺🇸</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playNativeAudio(currentCard.word, 'uk');
                          }}
                          className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1 transition-colors border border-white/10"
                          title="播放英音"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>英音 🇬🇧</span>
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-6">
                        💡 点击卡片翻转查看中文释义与例句
                      </p>
                    </div>
                  ) : (
                    /* Back: Chinese & Examples */
                    <div className="flex-1 flex flex-col justify-between text-left space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                          背面 · 释义与语境
                        </span>
                        <h4 className="text-xl font-bold text-white mt-1">
                          {currentCard.meaningZh}
                        </h4>
                        {currentCard.partOfSpeech && (
                          <span className="text-xs text-zinc-300 italic font-mono">
                            {currentCard.partOfSpeech}
                          </span>
                        )}
                      </div>

                      {/* Collocations */}
                      {currentCard.collocations && currentCard.collocations.length > 0 && (
                        <div className="bg-zinc-800/80 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
                            高频搭配
                          </span>
                          <p className="text-zinc-200 text-[11px]">
                            {currentCard.collocations.join(' · ')}
                          </p>
                        </div>
                      )}

                      {/* Example sentence */}
                      {currentCard.examples && currentCard.examples.length > 0 && (
                        <div className="bg-zinc-800/80 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
                            例句
                          </span>
                          <p className="text-zinc-100 text-xs italic font-sans">
                            "{currentCard.examples[0].en}"
                          </p>
                          <p className="text-zinc-400 text-[11px]">
                            {currentCard.examples[0].zh}
                          </p>
                        </div>
                      )}

                      {currentCard.prepTip && (
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          <span className="text-zinc-300 font-medium">PREP 用法：</span>
                          {currentCard.prepTip}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
                    点击卡片翻转
                  </div>
                </div>

                {/* Flip Card Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => handleNextCard(false)}
                    className="py-3 px-4 rounded-2xl liquid-glass-pill text-xs font-semibold text-zinc-800 hover:text-black flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                    <span>还没记住 · 下一个</span>
                  </button>

                  <button
                    onClick={() => handleNextCard(true)}
                    className="py-3 px-4 rounded-2xl apple-button-black text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>已掌握 · 记入熟词</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. CLOUD SYNC & DATA MANAGEMENT */}
        {activeTab === 'sync' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {/* Realtime Cross-Device Sync Card */}
            <div className="p-4 rounded-2xl liquid-glass-subtle border border-zinc-200/80 space-y-3 bg-white/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${syncCode ? 'bg-emerald-500/10 text-emerald-600' : 'bg-black text-white'}`}>
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-950 text-xs">跨设备多端实时同步</h4>
                    <p className="text-[11px] text-zinc-500">
                      {syncCode ? `已关联暗号: ${syncCode}` : '未关联多端同步'}
                    </p>
                  </div>
                </div>
                {syncCode && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    已连接
                  </span>
                )}
              </div>

              {onOpenSyncModal && (
                <button
                  type="button"
                  onClick={onOpenSyncModal}
                  className="w-full py-2.5 px-3 bg-black text-white hover:bg-zinc-800 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-xs active-press"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{syncCode ? '管理同步暗号与设备' : '设置专属暗号并同步'}</span>
                </button>
              )}
            </div>

            {/* Status card */}
            <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-zinc-900" />
                <h3 className="font-bold text-zinc-950 text-xs">
                  本地优先与多端互联
                </h3>
              </div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                当前生词本已开启<strong>本地持久化优先（Local-First Storage）</strong>，支持设置专属暗号自动同步，也可以随时导出标准 JSON 文件备份。
              </p>
            </div>

            {/* Quick Export / Import */}
            <div className="liquid-glass-subtle rounded-2xl border border-white/80 p-4 space-y-3">
              <h4 className="font-bold text-zinc-950 text-xs flex items-center justify-between">
                <span>备份与导入导出 (JSON 格式)</span>
                <span className="text-[10px] text-zinc-400 font-mono">共 {words.length} 词</span>
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleExportJSON}
                  className="p-3 rounded-xl bg-white/80 border border-zinc-200/80 hover:bg-white flex flex-col items-center justify-center gap-1 text-zinc-800 font-semibold transition-all shadow-xs"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>导出 JSON 备份</span>
                </button>

                <label className="p-3 rounded-xl bg-white/80 border border-zinc-200/80 hover:bg-white flex flex-col items-center justify-center gap-1 text-zinc-800 font-semibold transition-all shadow-xs cursor-pointer">
                  <Upload className="w-4 h-4 text-black" />
                  <span>导入外部 JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-zinc-400">
                可将导出的 JSON 文件直接提供给您的另一个 APP 进行同步合并。
              </p>
            </div>

            {/* Cloud Sync API Configuration (Plan Scheme) */}
            <div className="liquid-glass-subtle rounded-2xl border border-white/80 p-4 space-y-3">
              <h4 className="font-bold text-zinc-950 text-xs">
                外部 APP 同步端点规划 (Custom Sync Scheme)
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  同步 API Endpoint URL
                </label>
                <input
                  type="text"
                  placeholder="https://api.your-other-app.com/v1/sync/vocab"
                  value={syncConfig.endpointUrl || ''}
                  onChange={(e) => setSyncConfig({ ...syncConfig, endpointUrl: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 bg-white/80 border border-zinc-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  用户授权 Secret Token / API Key
                </label>
                <input
                  type="password"
                  placeholder="输入另一个 APP 的同步密钥或用户 Token..."
                  value={syncConfig.secretToken || ''}
                  onChange={(e) => setSyncConfig({ ...syncConfig, secretToken: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 bg-white/80 border border-zinc-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-700 font-medium text-[11px]">
                  <input
                    type="checkbox"
                    checked={syncConfig.autoSync}
                    onChange={(e) => setSyncConfig({ ...syncConfig, autoSync: e.target.checked })}
                    className="rounded border-zinc-300 text-black focus:ring-black"
                  />
                  <span>每次添加单词后自动触发同步</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveSyncConfig}
                  className="px-4 py-2 apple-button-black rounded-xl text-[11px] font-semibold"
                >
                  保存同步规划配置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
