import React from 'react';
import { BookOpen, History, Sparkles, Layers, FileText } from 'lucide-react';

interface HeaderProps {
  mode: 'step' | 'full';
  onModeChange: (mode: 'step' | 'full') => void;
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onOpenVocab: () => void;
  vocabCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  onOpenGuide,
  onOpenHistory,
  historyCount,
  onOpenVocab,
  vocabCount,
}) => {
  return (
    <header className="sticky top-0 z-30 liquid-glass-nav transition-all border-b border-white/60">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xs sm:text-base tracking-wider shadow-md shadow-black/20 ring-1 ring-white/30 transition-transform active-press shrink-0">
            <span className="text-amber-400">P</span>REP
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-zinc-950 tracking-tight font-sans whitespace-nowrap">
                PREP Master
              </h1>
              <span className="hidden lg:inline text-xs text-zinc-400 font-medium border-l border-zinc-300 pl-2 whitespace-nowrap">
                英文结构性输出
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden xl:block whitespace-nowrap">
              Point · Reason · Example · Point · AI 实时纠错与高分润色
            </p>
          </div>
        </div>

        {/* Center / Right: Mode Switcher & Tools */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Segmented Control (分步 / 整篇) */}
          <div className="flex items-center p-0.5 sm:p-1 liquid-glass-rail rounded-full text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => onModeChange('step')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all duration-200 whitespace-nowrap shrink-0 active-press ${
                mode === 'step'
                  ? 'bg-black text-white shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium">分步</span>
              <span className="hidden sm:inline text-xs">搭建</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('full')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all duration-200 whitespace-nowrap shrink-0 active-press ${
                mode === 'full'
                  ? 'bg-black text-white shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium">整篇</span>
              <span className="hidden sm:inline text-xs">实战</span>
            </button>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Vocab Notebook Button */}
            <button
              type="button"
              onClick={onOpenVocab}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-zinc-900 liquid-glass-pill rounded-full whitespace-nowrap shrink-0 active-press"
              title="查看生词本与复习卡片"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
              <span className="hidden sm:inline">生词本</span>
              {vocabCount > 0 && (
                <span className="min-w-4 h-4 px-1 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {vocabCount > 99 ? '99+' : vocabCount}
                </span>
              )}
            </button>

            {/* Guide Button */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs font-medium text-zinc-700 hover:text-black liquid-glass-pill rounded-full shrink-0 active-press"
              title="PREP 结构秘籍"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span className="hidden md:inline ml-1">秘籍</span>
            </button>

            {/* History Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs font-medium text-zinc-700 hover:text-black liquid-glass-pill rounded-full shrink-0 relative active-press"
              title="查看练习历史"
            >
              <History className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span className="hidden md:inline ml-1">历史</span>
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto sm:ml-1 min-w-3.5 sm:min-w-4 h-3.5 sm:h-4 px-1 bg-zinc-800 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {historyCount > 9 ? '9+' : historyCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
