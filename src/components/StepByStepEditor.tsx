import React, { useState } from 'react';
import { PREP_CONNECTORS } from '../data/connectors';
import { StepFeedback, Topic } from '../types/prep';
import {
  Mic,
  MicOff,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { createSpeechRecognizer, playTextToSpeech } from '../utils/speech';
import { StarterPopover } from './StarterPopover';

interface StepByStepEditorProps {
  topic: Topic;
  point: string;
  setPoint: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  example: string;
  setExample: (val: string) => void;
  point2: string;
  setPoint2: (val: string) => void;
  onSubmitEvaluation: () => void;
  isEvaluating: boolean;
  onClear: () => void;
  onFillSample: () => void;
}

export const StepByStepEditor: React.FC<StepByStepEditorProps> = ({
  topic,
  point,
  setPoint,
  reason,
  setReason,
  example,
  setExample,
  point2,
  setPoint2,
  onSubmitEvaluation,
  isEvaluating,
  onClear,
  onFillSample,
}) => {
  // Voice recording state per step
  const [recordingStep, setRecordingStep] = useState<string | null>(null);
  const [activeSpeechInstance, setActiveSpeechInstance] = useState<any>(null);

  // Step-level live feedback state
  const [stepFeedback, setStepFeedback] = useState<Record<string, StepFeedback | null>>({
    point: null,
    reason: null,
    example: null,
    point2: null,
  });
  const [checkingStep, setCheckingStep] = useState<string | null>(null);

  // Active Starter Popover step
  const [openStarterStep, setOpenStarterStep] = useState<'point' | 'reason' | 'example' | 'point2' | null>(null);

  // Quick connector starter insertion
  const handleInsertStarter = (
    step: 'point' | 'reason' | 'example' | 'point2',
    starter: string
  ) => {
    let currentVal = '';
    let setter: (val: string) => void = () => {};

    if (step === 'point') {
      currentVal = point;
      setter = setPoint;
    } else if (step === 'reason') {
      currentVal = reason;
      setter = setReason;
    } else if (step === 'example') {
      currentVal = example;
      setter = setExample;
    } else if (step === 'point2') {
      currentVal = point2;
      setter = setPoint2;
    }

    if (!currentVal.trim()) {
      setter(starter + ' ');
    } else {
      setter(starter + ' ' + currentVal.trim());
    }
  };

  // Toggle voice dictation for a specific step
  const toggleRecording = (step: 'point' | 'reason' | 'example' | 'point2') => {
    if (recordingStep === step) {
      if (activeSpeechInstance) {
        try {
          activeSpeechInstance.stop();
        } catch (e) {}
      }
      setRecordingStep(null);
      setActiveSpeechInstance(null);
      return;
    }

    // Stop existing
    if (activeSpeechInstance) {
      try {
        activeSpeechInstance.stop();
      } catch (e) {}
    }

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        let setter: (val: string) => void = () => {};
        let current = '';

        if (step === 'point') {
          setter = setPoint;
          current = point;
        } else if (step === 'reason') {
          setter = setReason;
          current = reason;
        } else if (step === 'example') {
          setter = setExample;
          current = example;
        } else if (step === 'point2') {
          setter = setPoint2;
          current = point2;
        }

        if (isFinal) {
          setter(current ? `${current} ${transcript}` : transcript);
        }
      },
      (error) => {
        console.warn('Speech error:', error);
        setRecordingStep(null);
      },
      () => {
        setRecordingStep(null);
      }
    );

    if (recognizer) {
      try {
        recognizer.start();
        setRecordingStep(step);
        setActiveSpeechInstance(recognizer);
      } catch (err) {
        console.error('Failed to start recognizer', err);
        setRecordingStep(null);
      }
    } else {
      alert('您的浏览器当前不支持 Web Speech 语音听写，推荐使用 Chrome 或 Edge 浏览器体验语音功能。');
    }
  };

  // Single step real-time AI diagnostic
  const handleCheckStep = async (step: 'point' | 'reason' | 'example' | 'point2') => {
    let content = '';
    if (step === 'point') content = point;
    if (step === 'reason') content = reason;
    if (step === 'example') content = example;
    if (step === 'point2') content = point2;

    if (!content.trim()) return;

    setCheckingStep(step);
    try {
      const res = await fetch('/api/prep/step-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepType: step,
          content,
          topic: topic.questionEn,
        }),
      });
      const data = await res.json();
      setStepFeedback((prev) => ({ ...prev, [step]: data }));
    } catch (err) {
      console.error('Error checking step:', err);
    } finally {
      setCheckingStep(null);
    }
  };

  // Apply instant native refinement to input
  const handleApplyRefinement = (
    step: 'point' | 'reason' | 'example' | 'point2',
    refinement: string
  ) => {
    if (step === 'point') setPoint(refinement);
    if (step === 'reason') setReason(refinement);
    if (step === 'example') setExample(refinement);
    if (step === 'point2') setPoint2(refinement);

    setStepFeedback((prev) => ({ ...prev, [step]: null }));
  };

  const stepsConfig: Array<{
    id: 'point' | 'reason' | 'example' | 'point2';
    connectorIndex: number;
    value: string;
    setter: (val: string) => void;
    placeholder: string;
    minWords: number;
  }> = [
    {
      id: 'point',
      connectorIndex: 0,
      value: point,
      setter: setPoint,
      placeholder: 'e.g. When I am exhausted after a long day, I definitely prefer cooking a simple meal at home...',
      minWords: 5,
    },
    {
      id: 'reason',
      connectorIndex: 1,
      value: reason,
      setter: setReason,
      placeholder: 'e.g. This is primarily because cooking serves as a calming transition and gives me complete control over fresh ingredients...',
      minWords: 6,
    },
    {
      id: 'example',
      connectorIndex: 2,
      value: example,
      setter: setExample,
      placeholder: 'e.g. For instance, last Tuesday I made a quick bowl of hot tomato egg noodles in 15 minutes, which felt so comforting...',
      minWords: 8,
    },
    {
      id: 'point2',
      connectorIndex: 3,
      value: point2,
      setter: setPoint2,
      placeholder: 'e.g. Therefore, spending a few quiet minutes in the kitchen is my favorite ritual to unwind and recharge...',
      minWords: 5,
    },
  ];

  const totalWords = [point, reason, example, point2]
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const canSubmit = point.trim() && reason.trim() && example.trim() && point2.trim();

  return (
    <div className="space-y-4">
      {/* 4 PREP Step Cards */}
      <div className="space-y-3">
        {stepsConfig.map((item, index) => {
          const config = PREP_CONNECTORS[item.connectorIndex];
          const isRecording = recordingStep === item.id;
          const isChecking = checkingStep === item.id;
          const feedback = stepFeedback[item.id];
          const words = item.value.trim().split(/\s+/).filter(Boolean).length;

          return (
            <div
              key={item.id}
              className="liquid-glass-card rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-200 border border-white/80"
            >
              {/* Card Header */}
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white/40 backdrop-blur-md border-b border-zinc-200/50 flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg font-mono font-bold text-[11px] sm:text-xs flex items-center justify-center text-white bg-black shadow-xs ring-1 ring-white/20 shrink-0">
                    {item.id === 'point' ? 'P' : item.id === 'reason' ? 'R' : item.id === 'example' ? 'E' : 'P2'}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-zinc-900 mr-1 whitespace-nowrap">
                      {config.stepName}
                    </span>
                    <span className="text-xs text-zinc-500 font-normal hidden sm:inline">
                      {config.stepZh}
                    </span>
                  </div>
                </div>

                {/* Right controls: Starter Popover Trigger, Voice, Real-time Check */}
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs shrink-0">
                  {/* Sentence Starters Popover Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenStarterStep(openStarterStep === item.id ? null : (item.id as any))
                      }
                      className={`px-2 sm:px-3 py-1 rounded-full font-medium text-[11px] flex items-center gap-1 transition-all whitespace-nowrap active-press ${
                        openStarterStep === item.id
                          ? 'bg-black text-white shadow-xs'
                          : 'liquid-glass-pill text-zinc-800 hover:text-black'
                      }`}
                      title="展开高分地道句首"
                    >
                      <Sparkles className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="hidden xs:inline sm:inline">高分句首</span>
                      <span className="xs:hidden sm:hidden">句首</span>
                    </button>

                    <StarterPopover
                      isOpen={openStarterStep === item.id}
                      onClose={() => setOpenStarterStep(null)}
                      step={item.id as any}
                      currentValue={item.value}
                      onSelectStarter={(phrase) => handleInsertStarter(item.id, phrase)}
                    />
                  </div>

                  {/* Mic Dictation */}
                  <button
                    type="button"
                    onClick={() => toggleRecording(item.id)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all whitespace-nowrap active-press ${
                      isRecording
                        ? 'bg-black text-white animate-pulse shadow-sm'
                        : 'liquid-glass-pill text-zinc-700 hover:text-black'
                    }`}
                    title={isRecording ? '点击停止语音听写' : '点击开启英文口语实时听写'}
                  >
                    {isRecording ? <MicOff className="w-3 h-3 text-white shrink-0" /> : <Mic className="w-3 h-3 text-zinc-500 shrink-0" />}
                    <span>{isRecording ? '录音中' : '口语'}</span>
                  </button>

                  {/* Real-time single step check */}
                  <button
                    type="button"
                    onClick={() => handleCheckStep(item.id)}
                    disabled={!item.value.trim() || isChecking}
                    className="px-2 sm:px-3 py-1 liquid-glass-pill text-zinc-900 hover:text-black rounded-full font-semibold text-[11px] flex items-center gap-1 disabled:opacity-40 whitespace-nowrap active-press"
                    title="对本单一步骤进行 AI 实时语法诊脉与地道润色"
                  >
                    <Sparkles className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span>{isChecking ? '诊断中' : '实时纠错'}</span>
                  </button>
                </div>
              </div>

              {/* Text Input Area */}
              <div className="p-3 sm:p-5">
                <textarea
                  value={item.value}
                  onChange={(e) => {
                    item.setter(e.target.value);
                    if (stepFeedback[item.id]) {
                      setStepFeedback((prev) => ({ ...prev, [item.id]: null }));
                    }
                  }}
                  rows={2}
                  placeholder={item.placeholder}
                  className="w-full text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-y leading-relaxed font-sans min-h-[64px]"
                />

                {/* Footer Word Count & Guidance */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 text-[11px] text-zinc-500">
                  <span className="italic line-clamp-1 text-[10px] sm:text-[11px]">{config.description}</span>
                  <span className="font-mono text-zinc-400 shrink-0 ml-2">
                    {words} words
                  </span>
                </div>
              </div>

              {/* Instant Real-Time Step Diagnostic Card */}
              {feedback && (
                <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-3.5 sm:p-4 rounded-2xl liquid-glass-subtle border border-white/80 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                      {feedback.status === 'strong' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      )}
                      <span className="text-[11px] sm:text-xs">AI 单步诊断：{feedback.feedback}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStepFeedback((prev) => ({ ...prev, [item.id]: null }))}
                      className="text-zinc-400 hover:text-zinc-700 text-[10px] p-1 active-press"
                    >
                      关闭
                    </button>
                  </div>

                  {/* Grammar flaw if any */}
                  {feedback.grammarIssues && feedback.grammarIssues.length > 0 && (
                    <div className="bg-white/80 p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-wide">
                        实时语法纠错
                      </span>
                      {feedback.grammarIssues.map((issue, iIdx) => (
                        <div key={iIdx} className="text-zinc-800 text-[11px]">
                          <span className="line-through text-zinc-400 mr-1.5">{issue.original}</span>
                          <span className="font-semibold text-black mr-2">➔ {issue.fixed}</span>
                          <span className="text-zinc-500 text-[10px]">({issue.tip})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Instant Native Refinement */}
                  {feedback.instantRefinement && (
                    <div className="bg-white/90 p-3 sm:p-3.5 rounded-xl border border-zinc-300 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-zinc-900 uppercase tracking-wide">
                          地道母语重构建议
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => playTextToSpeech(feedback.instantRefinement!)}
                            className="text-zinc-500 hover:text-black flex items-center gap-1 text-[11px] active-press py-0.5 px-1"
                            title="朗读示范"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>朗读</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyRefinement(item.id, feedback.instantRefinement!)}
                            className="text-black hover:underline font-semibold text-[11px] active-press py-0.5 px-1"
                          >
                            采纳替换
                          </button>
                        </div>
                      </div>
                      <p className="text-zinc-900 font-medium leading-relaxed font-sans text-xs sm:text-sm">
                        "{feedback.instantRefinement}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor Bottom Actions Bar (Standard for Desktop / Tablet) */}
      <div className="liquid-glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-lg border border-white/80">
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-500 w-full sm:w-auto justify-between sm:justify-start">
          <span className="font-mono font-semibold text-zinc-900 shrink-0">
            总计：{totalWords} 词
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-zinc-300">·</span>
          <span className="text-zinc-500 truncate text-[11px] sm:text-xs">
            {canSubmit ? (
              <span className="text-zinc-900 font-semibold">✓ PREP 4 步已填毕</span>
            ) : (
              <span className="text-zinc-500">完整填写 4 步后发起评估</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onFillSample}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-800 hover:text-black liquid-glass-pill rounded-full whitespace-nowrap shrink-0 active-press"
            title="一键填入示范答案，快速体验 AI 诊断报告"
          >
            示范体验
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-2 text-zinc-400 hover:text-black rounded-full hover:bg-white/80 transition-colors shrink-0 active-press"
            title="清空内容"
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
            <span>{isEvaluating ? '正在深度诊断...' : '提交 AI 深度评估'}</span>
            {!isEvaluating && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Mobile Sticky Floating Dock Bar (Visible on mobile screens) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-20 liquid-glass-nav border-t border-white/80 p-2.5 safe-bottom shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          {/* Step completion pill dots */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded-full">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                point.trim() ? 'bg-black scale-110' : 'bg-zinc-300'
              }`}
              title="P"
            />
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                reason.trim() ? 'bg-black scale-110' : 'bg-zinc-300'
              }`}
              title="R"
            />
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                example.trim() ? 'bg-black scale-110' : 'bg-zinc-300'
              }`}
              title="E"
            />
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                point2.trim() ? 'bg-black scale-110' : 'bg-zinc-300'
              }`}
              title="P2"
            />
            <span className="text-[10px] font-mono font-semibold text-zinc-700 ml-1">
              {totalWords}w
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
              <span>{isEvaluating ? '诊断中...' : '提交评估'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
