import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PREP_CONNECTORS } from '../data/connectors';
import { Check, X, Sparkles } from 'lucide-react';

interface StarterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  step: 'point' | 'reason' | 'example' | 'point2';
  currentValue: string;
  onSelectStarter: (phrase: string) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export const StarterPopover: React.FC<StarterPopoverProps> = ({
  isOpen,
  onClose,
  step,
  currentValue,
  onSelectStarter,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const group = PREP_CONNECTORS.find((g) => g.step === step) || PREP_CONNECTORS[0];

  const content = (
    <>
      {/* Mobile Bottom Sheet Backdrop & Panel */}
      {isMobile ? (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Bottom Sheet Sheet Panel */}
          <div
            ref={panelRef}
            className="relative z-10 w-full liquid-glass-bottom-sheet rounded-t-[28px] p-5 shadow-2xl animate-in slide-in-from-bottom-8 duration-200 safe-bottom max-h-[82vh] flex flex-col"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mb-3.5 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-black text-white text-xs font-bold font-mono flex items-center justify-center shrink-0">
                  {step === 'point' ? 'P' : step === 'reason' ? 'R' : step === 'example' ? 'E' : 'P2'}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 font-sans">
                    {group.stepName} · 高分句首
                  </h3>
                  <p className="text-[11px] text-zinc-500">{group.stepZh}推荐套句</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Starters List */}
            <div className="overflow-y-auto space-y-2 py-1 pr-1 overscroll-contain">
              {group.starters.map((item, idx) => {
                const cleanStarter = item.phrase.replace('...', '').trim();
                const isSelected = currentValue.trim().startsWith(cleanStarter);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectStarter(item.phrase);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between active-press cursor-pointer border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white/80 border-zinc-200/80 text-zinc-900 active:bg-zinc-100'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="w-4 h-4 text-white shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                        )}
                        <span className={`text-sm font-semibold leading-snug ${isSelected ? 'text-white' : 'text-zinc-950'}`}>
                          {item.phrase}
                        </span>
                      </div>
                      <span
                        className={`text-xs block mt-1 ml-3.5 leading-relaxed ${
                          isSelected ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {item.chinese}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Fallback: Centered / Relative Popover */
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4 animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/20 pointer-events-auto"
            onClick={onClose}
          />
          <div
            ref={panelRef}
            className="pointer-events-auto relative w-80 max-w-sm liquid-glass-popover rounded-[24px] p-3 shadow-2xl animate-in zoom-in-95 duration-150 select-none border border-white/95"
          >
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-200/60 mb-2">
              <span className="text-xs font-bold text-zinc-900 font-sans flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                {group.stepName} · 推荐句首
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-black p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {group.starters.map((item, idx) => {
                const cleanStarter = item.phrase.replace('...', '').trim();
                const isSelected = currentValue.trim().startsWith(cleanStarter);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectStarter(item.phrase);
                      onClose();
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-[14px] transition-all flex items-center justify-between cursor-pointer group text-xs ${
                      isSelected
                        ? 'bg-black text-white font-semibold shadow-xs'
                        : 'text-zinc-800 hover:bg-zinc-100/90 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex-1 pr-1">
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-zinc-500 shrink-0" />
                        )}
                        <span className={`font-semibold line-clamp-1 ${isSelected ? 'text-white' : 'text-zinc-950'}`}>
                          {item.phrase}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] block mt-0.5 ml-3.5 ${
                          isSelected ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {item.chinese}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};
