import React from 'react';
import { PracticeHistoryItem } from '../types/prep';
import { X, Trash2, Calendar, Award, ArrowUpRight, Volume2, History } from 'lucide-react';
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg liquid-glass text-zinc-900 rounded-[28px] sm:rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Apple Style */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-950 flex items-center gap-1.5">
                练习记录与打卡归档
                <span className="text-[11px] bg-zinc-200/80 text-zinc-700 font-semibold px-2 py-0.5 rounded-full font-mono">
                  {history.length}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                查看历史练习得分、原句草稿与 AI 精修润色范本
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-2 text-zinc-400 hover:text-rose-600 rounded-full hover:bg-white/80 active-press transition-colors"
                title="清空练习记录"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-black rounded-full hover:bg-white/80 active-press transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 overscroll-contain">
          {history.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/60 rounded-2xl border border-zinc-200/60">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-zinc-800">暂无练习历史</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                完成一次 PREP 评估后，系统将自动把你的输入与地道润色范文归档在此。
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
                  className="p-4 rounded-2xl border border-white/90 bg-white/70 hover:bg-white/90 transition-all space-y-2.5 text-xs shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span className="capitalize">{item.mode === 'step' ? '分步拆解' : '连续整篇'}</span>
                      </div>
                      <p className="font-semibold text-zinc-950 line-clamp-2 text-xs sm:text-sm">
                        {item.topicTitle}
                      </p>
                    </div>

                    <div className="w-11 h-11 rounded-2xl bg-black text-white flex flex-col items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20">
                      <span className="font-bold text-xs sm:text-sm font-mono leading-none">{item.overallScore}</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5">分</span>
                    </div>
                  </div>

                  {/* Best Polish Sneak Peek */}
                  {item.bestPolish && (
                    <div className="bg-white/90 p-3 rounded-xl border border-zinc-200/80">
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
                      <p className="text-zinc-800 italic line-clamp-3 text-[11px] font-sans leading-relaxed">
                        "{item.bestPolish}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                    <span className="text-[11px] text-zinc-500">
                      {item.errorCount > 0 ? `修正了 ${item.errorCount} 处瑕疵` : '语法零硬伤'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadItem(item);
                        onClose();
                      }}
                      className="text-zinc-950 font-semibold flex items-center gap-1 text-xs hover:underline active-press py-1 px-2.5 bg-zinc-100 rounded-full hover:bg-zinc-200"
                    >
                      <span>载入练习</span>
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
