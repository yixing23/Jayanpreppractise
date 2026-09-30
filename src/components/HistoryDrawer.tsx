import React from 'react';
import { PracticeHistoryItem } from '../types/prep';
import { X, Trash2, Calendar, Award, ArrowUpRight, Volume2 } from 'lucide-react';
import { playTextToSpeech } from '../utils/speech';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: PracticeHistoryItem[];
  onClearHistory: () => void;
  onLoadItem: (item: PracticeHistoryItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onLoadItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="liquid-glass-drawer w-full sm:max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 safe-bottom">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-950 text-sm font-sans">练习记录与复习本</span>
            <span className="text-xs text-zinc-500 font-mono">({history.length})</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-2 text-zinc-400 hover:text-black rounded-full hover:bg-white/80 active-press transition-colors"
                title="清空练习历史"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-black rounded-full hover:bg-white/80 active-press transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 overscroll-contain">
          {history.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Award className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-800">暂无练习历史</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                完成一次 PREP AI 评估后，系统将自动归档你的草稿、得分与地道润色范本。
              </p>
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleString('zh-CN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-white/80 liquid-glass-subtle hover:bg-white/80 transition-all space-y-2.5 text-xs shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span className="capitalize">{item.mode === 'step' ? '分步' : '整篇'}</span>
                      </div>
                      <p className="font-semibold text-zinc-950 line-clamp-2">
                        {item.topicTitle}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-black text-white flex flex-col items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20">
                      <span className="font-bold text-xs font-mono">{item.overallScore}</span>
                      <span className="text-[8px] text-zinc-400">分</span>
                    </div>
                  </div>

                  {/* Best Polish Sneak Peek */}
                  {item.bestPolish && (
                    <div className="bg-white/80 p-2.5 sm:p-3 rounded-xl border border-zinc-200/80">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold mb-1">
                        <span>地道范文摘录</span>
                        <button
                          type="button"
                          onClick={() => playTextToSpeech(item.bestPolish)}
                          className="text-zinc-700 hover:text-black flex items-center gap-0.5 font-medium active-press"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>朗读</span>
                        </button>
                      </div>
                      <p className="text-zinc-800 italic line-clamp-3 text-[11px] font-sans">
                        "{item.bestPolish}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-zinc-500">
                      {item.errorCount > 0 ? `修正了 ${item.errorCount} 处瑕疵` : '语法零硬伤'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadItem(item);
                        onClose();
                      }}
                      className="text-zinc-900 hover:text-black font-semibold flex items-center gap-0.5 text-xs hover:underline active-press py-1 px-2"
                    >
                      <span>载入回顾</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
