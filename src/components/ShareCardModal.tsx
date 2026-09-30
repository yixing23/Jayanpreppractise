import React, { useState } from 'react';
import { EvaluationResult, Topic } from '../types/prep';
import { X, Copy, Check, Sparkles, Award, Share2 } from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: EvaluationResult;
  topic: Topic;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  topic,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://prep-master.vercel.app';
  const polishedHighlight =
    evaluation.polishedVersions.conversationalFluent.split('.')[0] + '.' ||
    evaluation.polishedVersions.conversationalFluent;

  const getScoreGrade = (score: number) => {
    if (score >= 90) return '结构大师 · 母语级地道';
    if (score >= 80) return '表达卓越 · 逻辑严密';
    if (score >= 70) return '论据扎实 · 结构规范';
    return '结构初成 · 持续精进';
  };

  const handleCopyMomentsText = () => {
    const text = `🎯 今日 PREP 英语表达打卡！
━━━━━━━━━━━━━━━━
📝 题目：${topic.questionEn}
${topic.questionZh ? `（${topic.questionZh}）` : ''}

🏆 AI 综合评分：${evaluation.overallScore} 分（${getScoreGrade(evaluation.overallScore)}）
📊 5维诊断：规范 ${evaluation.scores.structure} · 逻辑 ${evaluation.scores.logic} · 词汇 ${evaluation.scores.vocabulary} · 语法 ${evaluation.scores.grammar} · 清晰 ${evaluation.scores.clarity}

✨ AI 母语级精修推荐：
"${polishedHighlight}"

💡 语言观既世界观，告别中式英语！
🔗 体验地址：${originUrl}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md liquid-glass text-zinc-900 rounded-[28px] sm:rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950">
                分享成就与打卡
              </h3>
              <p className="text-[11px] text-zinc-500">
                截屏上方卡片或一键复制文案分享到朋友圈
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-black hover:bg-black/5 transition-colors active-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: The Achievement Card */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Visual Poster Card */}
          <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-5 sm:p-6 rounded-[24px] shadow-2xl border border-white/15 overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Top Bar of Card */}
            <div className="flex items-center justify-between relative z-10 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center font-bold text-[10px] tracking-wider">
                  <span className="text-amber-500">P</span>REP
                </div>
                <span className="font-bold text-xs tracking-tight text-white/90">
                  PREP Master
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full">
                {new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} 打卡
              </span>
            </div>

            {/* Topic & Score Section */}
            <div className="py-4 space-y-3 relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-400">
                  Topic Prompt
                </span>
                <h4 className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-2">
                  {topic.questionEn}
                </h4>
                {topic.questionZh && (
                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {topic.questionZh}
                  </p>
                )}
              </div>

              {/* Score Display */}
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-3.5 mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {evaluation.overallScore}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">/100</span>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>{getScoreGrade(evaluation.overallScore)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                    {evaluation.executiveSummary}
                  </p>
                </div>
              </div>

              {/* 5-Dimension Scores */}
              <div className="grid grid-cols-5 gap-1.5 pt-1 text-center font-mono">
                <div className="bg-white/5 rounded-xl p-1.5">
                  <span className="text-[9px] text-zinc-400 block font-sans">规范</span>
                  <span className="text-xs font-bold text-white">{evaluation.scores.structure}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-1.5">
                  <span className="text-[9px] text-zinc-400 block font-sans">逻辑</span>
                  <span className="text-xs font-bold text-white">{evaluation.scores.logic}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-1.5">
                  <span className="text-[9px] text-zinc-400 block font-sans">词汇</span>
                  <span className="text-xs font-bold text-white">{evaluation.scores.vocabulary}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-1.5">
                  <span className="text-[9px] text-zinc-400 block font-sans">语法</span>
                  <span className="text-xs font-bold text-white">{evaluation.scores.grammar}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-1.5">
                  <span className="text-[9px] text-zinc-400 block font-sans">清晰</span>
                  <span className="text-xs font-bold text-white">{evaluation.scores.clarity}</span>
                </div>
              </div>

              {/* Polished Quote Section */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 relative mt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>母语级地道金句</span>
                </div>
                <p className="text-xs text-zinc-200 italic font-serif leading-relaxed line-clamp-3">
                  "{polishedHighlight}"
                </p>
              </div>
            </div>

            {/* Card Footer Tagline */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 relative z-10">
              <span className="font-sans">语言观既世界观 · PREP 框架训练</span>
              <span className="font-mono text-zinc-500">prep-master</span>
            </div>
          </div>

          {/* Action Button: Copy Moments Text */}
          <button
            type="button"
            onClick={handleCopyMomentsText}
            className={`w-full py-3 px-4 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active-press shadow-md ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'apple-button-black text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>已复制到剪贴板！可直接粘贴发圈</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>一键复制朋友圈打卡文案</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-zinc-400">
            📱 手机端可直接截屏上方卡片保存图片，或复制文案分享打卡群
          </p>
        </div>
      </div>
    </div>
  );
};
