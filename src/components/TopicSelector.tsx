import React, { useState } from 'react';
import { Topic } from '../types/prep';
import { Sparkles, RefreshCw, Lightbulb, ChevronDown, ChevronUp, PlusCircle, Check } from 'lucide-react';

interface TopicSelectorProps {
  currentTopic: Topic;
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  onGenerateAiTopics: (category: string) => Promise<void>;
  isGeneratingTopic: boolean;
  onCustomTopic: (questionEn: string, questionZh: string) => void;
  onFillSample?: () => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  currentTopic,
  topics,
  onSelectTopic,
  onGenerateAiTopics,
  isGeneratingTopic,
  onCustomTopic,
  onFillSample,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(true);
  const [showSample, setShowSample] = useState<boolean>(false);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customEn, setCustomEn] = useState<string>('');
  const [customZh, setCustomZh] = useState<string>('');

  const categories = [
    { id: 'all', label: '🌐 全部主题' },
    { id: 'health', label: '🌿 身心与健康' },
    { id: 'workplace', label: '💼 职场与事业' },
    { id: 'tech', label: '🤖 科技与 AI' },
    { id: 'culture', label: '💡 认知与成长' },
    { id: 'social', label: '💬 人际与社交' },
    { id: 'lifestyle', label: '☕ 日常与生活' },
  ];

  const filteredTopics = selectedCategory === 'all'
    ? topics
    : topics.filter((t) => t.category === selectedCategory);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEn.trim()) return;
    onCustomTopic(customEn.trim(), customZh.trim());
    setIsCustomMode(false);
    setShowDrawer(false);
  };

  return (
    <div className="liquid-glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-200 border border-white/80">
      {/* Current Topic Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5 font-mono">
            <span className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px]">
              {currentTopic.categoryLabel}
            </span>
            <span aria-hidden="true" className="text-zinc-300">·</span>
            <span className="capitalize text-zinc-500">{currentTopic.difficulty} Level</span>
          </div>

          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-zinc-950 font-serif leading-snug tracking-tight">
            {currentTopic.questionEn}
          </h2>
          {currentTopic.questionZh && (
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 font-normal leading-relaxed">
              {currentTopic.questionZh}
            </p>
          )}
        </div>

        {/* Change topic / AI prompt buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowDrawer(!showDrawer)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:text-black liquid-glass-pill rounded-full whitespace-nowrap active-press"
          >
            <span>换一题</span>
            {showDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onGenerateAiTopics(selectedCategory === 'all' ? 'workplace' : selectedCategory)}
            disabled={isGeneratingTopic}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold apple-button-black rounded-full disabled:opacity-50 whitespace-nowrap active-press"
            title="利用 AI 实时生成 4 道全新练习题"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span>{isGeneratingTopic ? '生成新题中...' : 'AI 智能出题'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Topic Selection Drawer */}
      {showDrawer && (
        <div className="mt-4 pt-4 border-t border-zinc-200/50">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setIsCustomMode(false);
                }}
                className={`px-3 py-1.5 rounded-full shrink-0 transition-all whitespace-nowrap active-press ${
                  selectedCategory === cat.id && !isCustomMode
                    ? 'bg-black text-white font-medium shadow-xs'
                    : 'liquid-glass-pill text-zinc-600 hover:text-black'
                }`}
              >
                {cat.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full shrink-0 transition-all whitespace-nowrap active-press ${
                isCustomMode
                  ? 'bg-black text-white font-medium shadow-xs'
                  : 'liquid-glass-pill text-zinc-800 hover:text-black'
              }`}
            >
              <PlusCircle className="w-3 h-3" />
              <span>自定义题目</span>
            </button>
          </div>

          {/* Topic List or Custom Form */}
          {isCustomMode ? (
            <form onSubmit={handleApplyCustom} className="liquid-glass-subtle p-4 rounded-2xl border border-white/80">
              <div className="mb-2.5">
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  英文题目 / 表达主题 (English Question / Topic)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Is it better to exercise in the morning or in the evening?"
                  value={customEn}
                  onChange={(e) => setCustomEn(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white/70 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  中文译文或生活背景提示 (Optional Chinese Context)
                </label>
                <input
                  type="text"
                  placeholder="例如：早晨运动好还是晚上运动更好？"
                  value={customZh}
                  onChange={(e) => setCustomZh(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white/70 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-3.5 py-1.5 text-xs text-zinc-500 hover:text-black"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold apple-button-black rounded-full"
                >
                  确认使用此题练习
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredTopics.map((topic) => {
                const isCurrent = topic.id === currentTopic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      onSelectTopic(topic);
                      setShowDrawer(false);
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-black text-white border-black shadow-md'
                        : 'liquid-glass-subtle hover:bg-white/80 border-white/80 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-semibold line-clamp-1 ${isCurrent ? 'text-white' : 'text-zinc-900'}`}>
                          {topic.questionEn}
                        </span>
                        {isCurrent && (
                          <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      {topic.questionZh && (
                        <p className={`text-[11px] line-clamp-1 ${isCurrent ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {topic.questionZh}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PREP Hints Accordion & Sample Answer */}
      {currentTopic.prepHint && (
        <div className="mt-4 pt-3 border-t border-zinc-200/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-black transition-colors shrink-0"
            >
              <Lightbulb className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              <span>思路提示 (PREP Hints)</span>
              {showHints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-2">
              {currentTopic.sampleAnswer && (
                <button
                  type="button"
                  onClick={() => setShowSample(!showSample)}
                  className="text-xs text-zinc-600 hover:text-black underline underline-offset-2 font-medium shrink-0"
                >
                  {showSample ? '收起示范' : '查看高分示范'}
                </button>
              )}
              {currentTopic.sampleAnswer && onFillSample && (
                <button
                  type="button"
                  onClick={onFillSample}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/60 transition-all shrink-0 active-press"
                  title="一键将示范回答填入输入框，秒测 AI 评估与润色"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>一键填入示范</span>
                </button>
              )}
            </div>
          </div>

          {showHints && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 text-xs">
              <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-white/80">
                <span className="font-mono font-bold text-zinc-950 block mb-1">P · Point 核心观点</span>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  {currentTopic.prepHint.pointHint}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-white/80">
                <span className="font-mono font-bold text-zinc-950 block mb-1">R · Reason 逻辑理由</span>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  {currentTopic.prepHint.reasonHint}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-white/80">
                <span className="font-mono font-bold text-zinc-950 block mb-1">E · Example 真实佐证</span>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  {currentTopic.prepHint.exampleHint}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-white/80">
                <span className="font-mono font-bold text-zinc-950 block mb-1">P · Point 重申升华</span>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  {currentTopic.prepHint.point2Hint}
                </p>
              </div>
            </div>
          )}

          {showSample && currentTopic.sampleAnswer && (
            <div className="mt-3 p-5 rounded-3xl liquid-glass-dark text-zinc-100 text-xs space-y-2.5 shadow-2xl">
              <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px] pb-2 border-b border-zinc-800">
                <span>高分参考范例 (PREP Master Sample)</span>
                <span className="text-zinc-300 font-semibold">Native Idiomatic English</span>
              </div>
              <p>
                <span className="font-mono font-bold text-zinc-400 mr-2">[Point]</span>
                <span className="text-zinc-100">{currentTopic.sampleAnswer.point}</span>
              </p>
              <p>
                <span className="font-mono font-bold text-zinc-400 mr-2">[Reason]</span>
                <span className="text-zinc-100">{currentTopic.sampleAnswer.reason}</span>
              </p>
              <p>
                <span className="font-mono font-bold text-zinc-400 mr-2">[Example]</span>
                <span className="text-zinc-100">{currentTopic.sampleAnswer.example}</span>
              </p>
              <p>
                <span className="font-mono font-bold text-zinc-400 mr-2">[Point Reiterate]</span>
                <span className="text-zinc-100">{currentTopic.sampleAnswer.point2}</span>
              </p>

              {onFillSample && (
                <div className="pt-2 flex justify-end border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={onFillSample}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-xs active-press"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>填入此范文并开始体验</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
