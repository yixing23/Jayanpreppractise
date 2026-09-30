import React from 'react';
import { X, CheckCircle, AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';
import { PREP_CONNECTORS } from '../data/connectors';

interface PrepGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrepGuideModal: React.FC<PrepGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
            <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs shrink-0 font-bold font-mono">
              P
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950 font-sans">
                PREP 结构性表达秘籍与避坑指南
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Point · Reason · Example · Point：沟通黄金公式
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm overscroll-contain">
          {/* Why PREP */}
          <div className="liquid-glass-subtle p-5 rounded-2xl border border-white/80">
            <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
              <Lightbulb className="w-4 h-4 text-zinc-800" />
              <span>为什么中国学习者最需要练习 PREP？</span>
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-sans">
              母语非英语的学习者在用英文交流时，常习惯“东拉西扯讲背景，最后才给出结论”，导致听众在第 30 秒就失去耐心。
              PREP 框架遵循 <strong>BLUF (Bottom Line Up Front，结论先行)</strong> 原则，无论是在职场汇报、跨国站会、英文面试还是日常探讨中，都能让你张口即有清晰的骨架与说服力。
            </p>
          </div>

          {/* 4 Steps breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider font-mono">
              PREP 四大核心环节拆解
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
                <span className="font-bold text-zinc-950 block mb-1">
                  1. P · Point (核心主张 / 结论先行)
                </span>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  不要铺垫废话，第一句话直接抛出你的核心结论或鲜明立场。听众立刻明白你要说什么。
                </p>
                <div className="mt-2 text-[11px] text-zinc-800 font-mono bg-white/80 p-2.5 rounded-xl border border-zinc-200/80">
                  常用句首：I firmly believe that... / The bottom line is...
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
                <span className="font-bold text-zinc-950 block mb-1">
                  2. R · Reason (因果逻辑 / 深度解释)
                </span>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  给出“为什么支持这个观点”。切忌同义反复，必须给出因果逻辑链条或机制层面的原因。
                </p>
                <div className="mt-2 text-[11px] text-zinc-800 font-mono bg-white/80 p-2.5 rounded-xl border border-zinc-200/80">
                  常用句首：This is primarily because... / The key driver is...
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
                <span className="font-bold text-zinc-950 block mb-1">
                  3. E · Example (事实佐证 / 真实故事)
                </span>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  抽象的理由不足以令人信服，具体的亲身经历、细节或生活场景才能让表达富有生动的画面感。
                </p>
                <div className="mt-2 text-[11px] text-zinc-800 font-mono bg-white/80 p-2.5 rounded-xl border border-zinc-200/80">
                  常用句首：For instance, last weekend... / A case in point is...
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle shadow-xs">
                <span className="font-bold text-zinc-950 block mb-1">
                  4. P · Point (重申升华 / 呼应总结)
                </span>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  避免虎头蛇尾。用不同的句式再次重申观点，或者提出具体的感悟或建议。
                </p>
                <div className="mt-2 text-[11px] text-zinc-800 font-mono bg-white/80 p-2.5 rounded-xl border border-zinc-200/80">
                  常用句首：Therefore, it is clear that... / Ultimately, ...
                </div>
              </div>
            </div>
          </div>

          {/* 3 Common Traps */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-4 h-4 text-zinc-800" />
              <span>常见 3 大表达陷阱（AI 纠错重点监控）</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle">
                <p className="font-semibold text-zinc-950 mb-1">
                  陷阱 1：循环论证 (The Circular Reason Trap)
                </p>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  <span className="text-zinc-400 mr-1">❌ 典型错误：</span>“我认为累的时候自己做饭比点外卖好。因为做饭真的很好，外卖没有自己做饭好。”（只是换了个说法把观点重复一遍）
                  <br />
                  <span className="text-black font-semibold mr-1">✅ 正确示范：</span>“...因为自己烹饪能完全掌控油盐和新鲜度，而且切菜洗菜的过程能让大脑彻底远离工作消息，起到正念减压的效果。”（深入到心理感受与具体好处）
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle">
                <p className="font-semibold text-zinc-950 mb-1">
                  陷阱 2：假大空案例 (The Vague Example Trap)
                </p>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  <span className="text-zinc-400 mr-1">❌ 典型错误：</span>“很多人下班都会自己做饭，大家都觉得挺健康的。”（毫无画面感与真实说服力）
                  <br />
                  <span className="text-black font-semibold mr-1">✅ 正确示范：</span>“比如上周二我加班到晚上八点，回家用 15 分钟煎了两个荷包蛋做了一碗热气腾腾的番茄鸡蛋面，身心完全放松了下来，远胜于等 40 分钟油腻的外卖。”（具象化细节与对比）
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-white/80 liquid-glass-subtle">
                <p className="font-semibold text-zinc-950 mb-1">
                  陷阱 3：戛然而止 (The Forgotten Ending Trap)
                </p>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  <span className="text-zinc-400 mr-1">❌ 典型错误：</span>讲完热汤面的故事就停住了，导致听众还在等下文。
                  <br />
                  <span className="text-black font-semibold mr-1">✅ 正确示范：</span>必须加一记回马枪，用 “That is why spending a few quiet minutes in the kitchen is my favorite way to recharge after work.” 完成首尾闭环。
                </p>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-semibold apple-button-black rounded-full"
            >
              掌握秘籍，开始实战练习
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
