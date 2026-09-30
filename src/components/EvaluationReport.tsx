import React, { useState } from 'react';
import { EvaluationResult, Topic, VocabWord } from '../types/prep';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  Award,
  BookmarkPlus,
} from 'lucide-react';
import { playTextToSpeech, stopTextToSpeech } from '../utils/speech';

interface EvaluationReportProps {
  evaluation: EvaluationResult;
  topic: Topic;
  onReset: () => void;
  onLookupWord?: (word: string, context?: string) => void;
  onDirectAddWord?: (word: string, context?: string, meaning?: string) => void;
  savedWords?: VocabWord[];
}

export const EvaluationReport: React.FC<EvaluationReportProps> = ({
  evaluation,
  topic,
  onReset,
  onLookupWord,
  onDirectAddWord,
  savedWords,
}) => {
  const [activePolishTab, setActivePolishTab] = useState<'business' | 'conversational' | 'concise'>('conversational');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePlayTTS = (text: string) => {
    if (isPlayingAudio) {
      stopTextToSpeech();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    playTextToSpeech(text, playbackSpeed, () => {
      setIsPlayingAudio(false);
    });
  };

  const getScoreColor = (_score: number) => {
    return 'text-zinc-950 font-bold';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'excellent') {
      return (
        <span className="inline-flex items-center gap-1.5 text-zinc-900 bg-white/90 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200 shadow-xs">
          <CheckCircle2 className="w-3 h-3 text-black" />
          <span>结构规范 · 优秀</span>
        </span>
      );
    }
    if (status === 'good') {
      return (
        <span className="inline-flex items-center gap-1.5 text-zinc-700 bg-white/80 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200/80 shadow-xs">
          <CheckCircle2 className="w-3 h-3 text-zinc-500" />
          <span>表达良好</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-zinc-600 bg-white/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200/60 shadow-xs">
        <AlertTriangle className="w-3 h-3 text-zinc-400" />
        <span>建议优化</span>
      </span>
    );
  };

  const activePolishContent =
    activePolishTab === 'business'
      ? evaluation.polishedVersions.businessProfessional
      : activePolishTab === 'conversational'
      ? evaluation.polishedVersions.conversationalFluent
      : evaluation.polishedVersions.concisePunchy;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Score Overview & Executive Summary */}
      <div className="liquid-glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/80 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-zinc-200/50">
          {/* Big Score Block */}
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-black text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-black/25 ring-1 ring-white/20">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
                {evaluation.overallScore}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                综合评分
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-zinc-950 tracking-tight font-sans leading-snug">
                  {evaluation.overallScore >= 85
                    ? '卓越的高效表达！结构严谨且极具说服力'
                    : evaluation.overallScore >= 70
                    ? '良好的 PREP 架构，逻辑因果清晰'
                    : '已初具结构雏形，建议强化论据深度与语法准确度'}
                </h3>
              </div>
              <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                {evaluation.executiveSummary}
              </p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onReset}
            className="self-stretch sm:self-auto px-4 py-2 text-xs font-semibold text-zinc-800 hover:text-black liquid-glass-pill rounded-full text-center shrink-0 active-press whitespace-nowrap"
          >
            再练一次 / 修改草稿
          </button>
        </div>

        {/* 5-Dimension Metric Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5">
          <div className="p-3.5 liquid-glass-subtle rounded-2xl border border-white/80">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-zinc-600 font-sans text-xs">PREP 规范度</span>
              <span className="font-bold text-black">{evaluation.scores.structure}</span>
            </div>
            <div className="w-full bg-zinc-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{ width: `${evaluation.scores.structure}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 liquid-glass-subtle rounded-2xl border border-white/80">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-zinc-600 font-sans text-xs">观点清晰度</span>
              <span className="font-bold text-black">{evaluation.scores.clarity}</span>
            </div>
            <div className="w-full bg-zinc-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{ width: `${evaluation.scores.clarity}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 liquid-glass-subtle rounded-2xl border border-white/80">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-zinc-600 font-sans text-xs">逻辑因果链</span>
              <span className="font-bold text-black">{evaluation.scores.logic}</span>
            </div>
            <div className="w-full bg-zinc-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{ width: `${evaluation.scores.logic}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 liquid-glass-subtle rounded-2xl border border-white/80">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-zinc-600 font-sans text-xs">语法准确率</span>
              <span className="font-bold text-black">{evaluation.scores.grammar}</span>
            </div>
            <div className="w-full bg-zinc-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{ width: `${evaluation.scores.grammar}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 liquid-glass-subtle rounded-2xl border border-white/80 col-span-2 sm:col-span-1">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-zinc-600 font-sans text-xs">词汇与连词</span>
              <span className="font-bold text-black">{evaluation.scores.vocabulary}</span>
            </div>
            <div className="w-full bg-zinc-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{ width: `${evaluation.scores.vocabulary}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grammar & Phrasing Corrections (实时纠错核心板块) */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/80 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-black shadow-xs" />
            <h3 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight">
              AI 语法纠错与地道表达诊断 ({evaluation.grammarCorrections.length})
            </h3>
          </div>
          <span className="text-xs text-zinc-500 hidden sm:inline">
            精准定位语法瑕疵，提供母语地道重构
          </span>
        </div>

        {evaluation.grammarCorrections.length === 0 ? (
          <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/80 text-xs text-zinc-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
            <span>
              太棒了！本篇没有发现明显的语法或搭配硬伤，表达自然流畅。
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {evaluation.grammarCorrections.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle hover:bg-white/80 transition-all shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-black text-[11px]">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-600 uppercase">
                      {item.category === 'grammar'
                        ? '语法与时态'
                        : item.category === 'vocabulary'
                        ? '词汇精度'
                        : item.category === 'collocation'
                        ? '习惯搭配'
                        : '逻辑过渡'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onDirectAddWord ? (
                      <button
                        type="button"
                        onClick={() => onDirectAddWord(item.corrected, item.corrected, item.ruleExplanation)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          savedWords?.some((w) => w.word.toLowerCase() === item.corrected.toLowerCase())
                            ? 'bg-black text-white shadow-xs'
                            : 'liquid-glass-pill text-zinc-900 hover:bg-black hover:text-white'
                        }`}
                      >
                        {savedWords?.some((w) => w.word.toLowerCase() === item.corrected.toLowerCase()) ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>已在词本</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3 h-3" />
                            <span>+ 存生词本</span>
                          </>
                        )}
                      </button>
                    ) : onLookupWord ? (
                      <button
                        type="button"
                        onClick={() => onLookupWord(item.corrected, item.corrected)}
                        className="inline-flex items-center gap-1 px-3 py-1 liquid-glass-pill rounded-full text-[11px] font-semibold text-zinc-900"
                      >
                        <BookmarkPlus className="w-3 h-3" />
                        <span>存入生词本</span>
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleCopy(item.corrected, `err-${idx}`)}
                      className="p-1 text-zinc-400 hover:text-black rounded"
                      title="复制修正句"
                    >
                      {copiedKey === `err-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-black" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Diff Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
                  <div className="p-3 rounded-xl bg-white/60 border border-zinc-200/60">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase mb-0.5">
                      原句缺陷 (Original)
                    </span>
                    <p className="text-zinc-500 line-through decoration-zinc-400 decoration-1 font-sans">
                      {item.original}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/90 border border-zinc-300 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-black block uppercase mb-0.5">
                      地道修正 (Native Polish)
                    </span>
                    <p className="text-zinc-950 font-semibold font-sans">
                      {item.corrected}
                    </p>
                  </div>
                </div>

                {/* Rule explanation in Chinese */}
                <p className="text-xs text-zinc-600 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-zinc-200/50">
                  <span className="font-semibold text-zinc-900 mr-1.5">💡 纠错解析：</span>
                  {item.ruleExplanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. PREP Step-by-Step Logic Breakdown (P-R-E-P 四段深剖) */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/80 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-black shadow-xs" />
          <h3 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight">
            PREP 结构逐层剖析与进阶重构
          </h3>
        </div>

        <div className="space-y-4">
          {/* Point */}
          <div className="p-4 sm:p-5 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-black text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs ring-1 ring-white/20">
                  P
                </span>
                <span className="font-bold text-xs text-zinc-950">
                  Point · 核心观点 (Bottom Line Up Front)
                </span>
              </div>
              {getStatusBadge(evaluation.stepAnalysis.point.status)}
            </div>

            <div className="text-xs space-y-2">
              <p className="text-zinc-700 bg-white/70 p-3 rounded-xl border border-zinc-200/60 italic font-sans">
                "{evaluation.stepAnalysis.point.extractedText || '未检测到明确观点句'}"
              </p>
              <p className="text-zinc-600 px-1">
                <span className="font-semibold text-zinc-900 mr-1">导师点评：</span>
                {evaluation.stepAnalysis.point.critique}
              </p>
              <div className="bg-white/90 p-3 rounded-xl border border-zinc-300/80 shadow-xs flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-600 block uppercase tracking-wider">
                    推荐更具冲击力的观点表达
                  </span>
                  <p className="font-medium text-zinc-950 text-xs mt-0.5">
                    "{evaluation.stepAnalysis.point.betterAlternative}"
                  </p>
                </div>
                <button
                  onClick={() => playTextToSpeech(evaluation.stepAnalysis.point.betterAlternative)}
                  className="p-1.5 text-zinc-400 hover:text-black rounded-lg transition-colors shrink-0"
                  title="朗读示范"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 sm:p-5 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-black text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs ring-1 ring-white/20">
                  R
                </span>
                <span className="font-bold text-xs text-zinc-950">
                  Reason · 因果逻辑 (Why It Matters)
                </span>
              </div>
              {getStatusBadge(evaluation.stepAnalysis.reason.status)}
            </div>

            <div className="text-xs space-y-2">
              <p className="text-zinc-700 bg-white/70 p-3 rounded-xl border border-zinc-200/60 italic font-sans">
                "{evaluation.stepAnalysis.reason.extractedText || '未检测到因果论据'}"
              </p>
              <p className="text-zinc-600 px-1">
                <span className="font-semibold text-zinc-900 mr-1">导师点评：</span>
                {evaluation.stepAnalysis.reason.critique}
              </p>
              <div className="bg-white/90 p-3 rounded-xl border border-zinc-300/80 shadow-xs flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-600 block uppercase tracking-wider">
                    推荐更深度的逻辑论据
                  </span>
                  <p className="font-medium text-zinc-950 text-xs mt-0.5">
                    "{evaluation.stepAnalysis.reason.betterAlternative}"
                  </p>
                </div>
                <button
                  onClick={() => playTextToSpeech(evaluation.stepAnalysis.reason.betterAlternative)}
                  className="p-1.5 text-zinc-400 hover:text-black rounded-lg transition-colors shrink-0"
                  title="朗读示范"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="p-4 sm:p-5 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-black text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs ring-1 ring-white/20">
                  E
                </span>
                <span className="font-bold text-xs text-zinc-950">
                  Example · 事实佐证 (Concrete Evidence)
                </span>
              </div>
              {getStatusBadge(evaluation.stepAnalysis.example.status)}
            </div>

            <div className="text-xs space-y-2">
              <p className="text-zinc-700 bg-white/70 p-3 rounded-xl border border-zinc-200/60 italic font-sans">
                "{evaluation.stepAnalysis.example.extractedText || '未检测到具体例子'}"
              </p>
              <p className="text-zinc-600 px-1">
                <span className="font-semibold text-zinc-900 mr-1">导师点评：</span>
                {evaluation.stepAnalysis.example.critique}
              </p>
              <div className="bg-white/90 p-3 rounded-xl border border-zinc-300/80 shadow-xs flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-600 block uppercase tracking-wider">
                    推荐更有说服力的数据/案例佐证
                  </span>
                  <p className="font-medium text-zinc-950 text-xs mt-0.5">
                    "{evaluation.stepAnalysis.example.betterAlternative}"
                  </p>
                </div>
                <button
                  onClick={() => playTextToSpeech(evaluation.stepAnalysis.example.betterAlternative)}
                  className="p-1.5 text-zinc-400 hover:text-black rounded-lg transition-colors shrink-0"
                  title="朗读示范"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Point2 */}
          <div className="p-4 sm:p-5 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-black text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs ring-1 ring-white/20">
                  P2
                </span>
                <span className="font-bold text-xs text-zinc-950">
                  Point · 总结升华 (Reiterate & Call to Action)
                </span>
              </div>
              {getStatusBadge(evaluation.stepAnalysis.point2.status)}
            </div>

            <div className="text-xs space-y-2">
              <p className="text-zinc-700 bg-white/70 p-3 rounded-xl border border-zinc-200/60 italic font-sans">
                "{evaluation.stepAnalysis.point2.extractedText || '未检测到结尾重申'}"
              </p>
              <p className="text-zinc-600 px-1">
                <span className="font-semibold text-zinc-900 mr-1">导师点评：</span>
                {evaluation.stepAnalysis.point2.critique}
              </p>
              <div className="bg-white/90 p-3 rounded-xl border border-zinc-300/80 shadow-xs flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-600 block uppercase tracking-wider">
                    推荐更有格局的总结收尾
                  </span>
                  <p className="font-medium text-zinc-950 text-xs mt-0.5">
                    "{evaluation.stepAnalysis.point2.betterAlternative}"
                  </p>
                </div>
                <button
                  onClick={() => playTextToSpeech(evaluation.stepAnalysis.point2.betterAlternative)}
                  className="p-1.5 text-zinc-400 hover:text-black rounded-lg transition-colors shrink-0"
                  title="朗读示范"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Native Speaker Polish Variations & Audio Shadowing (地道母语重构示范) */}
      <div className="liquid-glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/80 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-950 flex items-center gap-2 tracking-tight">
              <Sparkles className="w-4 h-4 text-zinc-800" />
              <span>母语专家地道重构范本 (Native Polished Variations)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              同一套 PREP 逻辑，在不同场景下的高分表达范本
            </p>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center liquid-glass-rail rounded-full p-0.5 sm:p-1 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setPlaybackSpeed(0.8)}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-all active-press ${
                  playbackSpeed === 0.8 ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-black'
                }`}
              >
                0.8x 慢速
              </button>
              <button
                type="button"
                onClick={() => setPlaybackSpeed(1.0)}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-all active-press ${
                  playbackSpeed === 1.0 ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-black'
                }`}
              >
                1.0x 原速
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePlayTTS(activePolishContent)}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all active-press ${
                isPlayingAudio
                  ? 'bg-zinc-900 text-white animate-pulse shadow-sm'
                  : 'apple-button-black'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlayingAudio ? '停止' : '朗读跟读'}</span>
            </button>
          </div>
        </div>

        {/* Apple Segmented Polish Tabs */}
        <div className="flex items-center overflow-x-auto p-1 liquid-glass-rail rounded-2xl sm:rounded-full mb-4 text-xs font-medium max-w-full no-scrollbar">
          <button
            type="button"
            onClick={() => setActivePolishTab('conversational')}
            className={`flex-1 sm:flex-none text-center px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap active-press ${
              activePolishTab === 'conversational'
                ? 'bg-black text-white shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <span>🗣️ 自然口语</span>
            <span className="hidden sm:inline"> (Fluent)</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePolishTab('business')}
            className={`flex-1 sm:flex-none text-center px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap active-press ${
              activePolishTab === 'business'
                ? 'bg-black text-white shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <span>✨ 雅致感悟</span>
            <span className="hidden sm:inline"> (Polished)</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePolishTab('concise')}
            className={`flex-1 sm:flex-none text-center px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap active-press ${
              activePolishTab === 'concise'
                ? 'bg-black text-white shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <span>⚡ 极简快聊</span>
            <span className="hidden sm:inline"> (Punchy)</span>
          </button>
        </div>

        {/* Polish Text Display */}
        <div className="relative p-5 sm:p-6 rounded-3xl liquid-glass-dark text-zinc-100 font-sans text-sm leading-relaxed shadow-2xl border border-white/10">
          <p className="pr-12 text-zinc-100 whitespace-pre-wrap leading-relaxed">
            {activePolishContent}
          </p>

          <button
            onClick={() => handleCopy(activePolishContent, 'polish')}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
            title="复制全文"
          >
            {copiedKey === 'polish' ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 5. Recommended PREP Transition Connectors (高分连词宝库) */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/80 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-zinc-900" />
          <h3 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight">
            定制级 PREP 逻辑过渡句型推荐
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {evaluation.recommendedConnectors.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle hover:bg-white/80 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-zinc-950 font-mono text-[11px]">
                  [{item.step}] {item.phrase}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">
                    {item.explanation}
                  </span>
                  {onDirectAddWord ? (
                    <button
                      type="button"
                      onClick={() => onDirectAddWord(item.phrase, item.sampleSentence, item.explanation)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all flex items-center gap-1 ${
                        savedWords?.some((w) => w.word.toLowerCase() === item.phrase.toLowerCase())
                          ? 'bg-black text-white shadow-xs'
                          : 'liquid-glass-pill text-zinc-900 hover:bg-black hover:text-white'
                      }`}
                    >
                      {savedWords?.some((w) => w.word.toLowerCase() === item.phrase.toLowerCase()) ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>已在词本</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3 h-3" />
                          <span>+ 存词本</span>
                        </>
                      )}
                    </button>
                  ) : onLookupWord ? (
                    <button
                      type="button"
                      onClick={() => onLookupWord(item.phrase, item.sampleSentence)}
                      className="px-2 py-0.5 liquid-glass-pill rounded-full text-[10px] font-semibold text-zinc-900"
                    >
                      + 词本
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-zinc-800 italic bg-white/80 p-2.5 rounded-xl border border-zinc-200/60 font-sans">
                "{item.sampleSentence}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
