import React, { useState } from 'react';
import { Topic } from '../types/prep';
import { Mic, MicOff, Sparkles, ArrowRight, RotateCcw, Clock } from 'lucide-react';
import { createSpeechRecognizer } from '../utils/speech';
import { StarterPopover } from './StarterPopover';

interface FullTextEditorProps {
  topic: Topic;
  fullText: string;
  setFullText: (val: string) => void;
  onSubmitEvaluation: () => void;
  isEvaluating: boolean;
  onClear: () => void;
  onFillSample: () => void;
}

export const FullTextEditor: React.FC<FullTextEditorProps> = ({
  topic,
  fullText,
  setFullText,
  onSubmitEvaluation,
  isEvaluating,
  onClear,
  onFillSample,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeSpeechInstance, setActiveSpeechInstance] = useState<any>(null);
  const [showStarterPopover, setShowStarterPopover] = useState<boolean>(false);

  const toggleRecording = () => {
    if (isRecording) {
      if (activeSpeechInstance) {
        try {
          activeSpeechInstance.stop();
        } catch (e) {}
      }
      setIsRecording(false);
      setActiveSpeechInstance(null);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          setFullText(fullText ? `${fullText} ${transcript}` : transcript);
        }
      },
      (error) => {
        console.warn('Speech error:', error);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (recognizer) {
      try {
        recognizer.start();
        setIsRecording(true);
        setActiveSpeechInstance(recognizer);
      } catch (err) {
        console.error('Failed to start recognizer', err);
        setIsRecording(false);
      }
    } else {
      alert('您的浏览器当前不支持 Web Speech 语音听写，推荐使用 Chrome 或 Edge 浏览器体验口语听写。');
    }
  };

  const insertConnector = (phrase: string) => {
    if (!fullText.trim()) {
      setFullText(phrase + ' ');
    } else {
      setFullText(fullText.trim() + ' ' + phrase + ' ');
    }
  };

  const words = fullText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = words >= 15;

  return (
    <div className="space-y-4">
      <div className="liquid-glass-card rounded-3xl overflow-hidden border border-white/80 shadow-md">
        {/* Top helper bar with transition connector shortcuts */}
        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/40 backdrop-blur-md border-b border-zinc-200/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 no-scrollbar max-w-full">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowStarterPopover(!showStarterPopover)}
                className="px-3 sm:px-3.5 py-1.5 apple-button-black rounded-full text-white text-[11px] font-semibold flex items-center gap-1.5 active-press"
                title="打开高分地道句首灵感弹窗"
              >
                <Sparkles className="w-3 h-3 text-zinc-300" />
                <span>句首灵感库</span>
              </button>

              <StarterPopover
                isOpen={showStarterPopover}
                onClose={() => setShowStarterPopover(false)}
                step="point"
                currentValue={fullText}
                onSelectStarter={(phrase) => insertConnector(phrase)}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mx-0.5">
              ·
            </span>
            <button
              type="button"
              onClick={() => insertConnector('I firmly believe that')}
              className="px-2.5 sm:px-3 py-1.5 liquid-glass-pill rounded-full text-zinc-800 hover:text-black text-[11px] font-medium whitespace-nowrap active-press"
            >
              + [P] I firmly believe that
            </button>
            <button
              type="button"
              onClick={() => insertConnector('This is primarily because')}
              className="px-2.5 sm:px-3 py-1.5 liquid-glass-pill rounded-full text-zinc-800 hover:text-black text-[11px] font-medium whitespace-nowrap active-press"
            >
              + [R] This is primarily because
            </button>
            <button
              type="button"
              onClick={() => insertConnector('For instance, ')}
              className="px-2.5 sm:px-3 py-1.5 liquid-glass-pill rounded-full text-zinc-800 hover:text-black text-[11px] font-medium whitespace-nowrap active-press"
            >
              + [E] For instance,
            </button>
            <button
              type="button"
              onClick={() => insertConnector('Therefore, it is evident that')}
              className="px-2.5 sm:px-3 py-1.5 liquid-glass-pill rounded-full text-zinc-800 hover:text-black text-[11px] font-medium whitespace-nowrap active-press"
            >
              + [P2] Therefore, it is evident that
            </button>
          </div>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all active-press shrink-0 ${
              isRecording
                ? 'bg-black text-white animate-pulse shadow-sm'
                : 'liquid-glass-pill text-zinc-700 hover:text-black'
            }`}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{isRecording ? '录音中' : '口语连续听写'}</span>
          </button>
        </div>

        {/* Text Area */}
        <div className="p-3.5 sm:p-5">
          <textarea
            value={fullText}
            onChange={(e) => setFullText(e.target.value)}
            rows={7}
            placeholder={`在此处以整段英文组织你的日常表达（需包含 P 观点、R 原因、E 例子、P 总结四个环节）：\n\n例如：\n"When I am exhausted after work, I definitely prefer cooking a simple meal at home. This is primarily because cooking serves as a calming transition and gives me complete control over fresh ingredients. For instance, last Tuesday I made a hot bowl of tomato egg noodles in 15 minutes, which felt so comforting. Therefore, spending a few quiet minutes in the kitchen is my favorite ritual to recharge."`}
            className="w-full text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-y leading-relaxed font-sans min-h-[140px]"
          />
        </div>

        {/* Word count & Reading time estimate */}
        <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white/40 border-t border-zinc-200/50 flex flex-wrap items-center justify-between gap-1.5 text-xs text-zinc-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-mono text-zinc-900 font-semibold">
              词数：{words} 词
            </span>
            <span aria-hidden="true" className="text-zinc-300">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>预估口语：~{Math.max(10, Math.round((words / 130) * 60))} 秒</span>
            </span>
          </div>

          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            AI 将自动对整篇进行 PREP 结构拆解与语法纠错
          </span>
        </div>
      </div>

      {/* Editor Bottom Actions Bar (Desktop / Standard) */}
      <div className="liquid-glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-lg border border-white/80">
        <div className="text-xs text-zinc-500 w-full sm:w-auto">
          {canSubmit ? (
            <span className="text-zinc-900 font-semibold">
              ✓ 内容长度充足，可随时发起 AI 诊断
            </span>
          ) : (
            <span className="text-zinc-500">
              请至少输入 15 词以获得深度的 PREP 诊断
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onFillSample}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-800 hover:text-black liquid-glass-pill rounded-full whitespace-nowrap shrink-0 active-press"
          >
            范文体验
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-2 text-zinc-400 hover:text-black rounded-full hover:bg-white/80 transition-colors shrink-0 active-press"
            title="清空文本"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canSubmit || isEvaluating}
            onClick={onSubmitEvaluation}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 sm:px-7 py-2.5 rounded-full apple-button-black font-semibold text-xs disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shadow-md active-press"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span>{isEvaluating ? '正在深度解析...' : '开始 AI 深度评估与重构'}</span>
            {!isEvaluating && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Mobile Sticky Floating Dock Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-20 liquid-glass-nav border-t border-white/80 p-2.5 safe-bottom shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/5 rounded-full">
            <span className="text-[11px] font-mono font-bold text-zinc-900">
              {words} 词
            </span>
            <span className="text-[10px] text-zinc-500">
              {canSubmit ? '· 可评估' : '· 需 ≥15 词'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onFillSample}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 active-press liquid-glass-pill rounded-full whitespace-nowrap"
            >
              范例
            </button>

            <button
              type="button"
              disabled={!canSubmit || isEvaluating}
              onClick={onSubmitEvaluation}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full apple-button-black font-semibold text-xs disabled:opacity-40 whitespace-nowrap shadow-md active-press"
            >
              <Sparkles className="w-3 h-3 text-zinc-300 shrink-0" />
              <span>{isEvaluating ? '解析中...' : '提交评估'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
