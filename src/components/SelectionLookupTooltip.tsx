import React, { useState, useEffect, useRef } from 'react';
import { BookMarked, Sparkles } from 'lucide-react';

interface SelectionLookupTooltipProps {
  onLookupWord: (word: string, context?: string) => void;
  onDirectAddWord?: (word: string, context?: string) => void;
}

export const SelectionLookupTooltip: React.FC<SelectionLookupTooltipProps> = ({
  onLookupWord,
  onDirectAddWord,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [contextSentence, setContextSentence] = useState('');
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setVisible(false);
        return;
      }

      const text = selection.toString().trim();
      // Valid word or short phrase: 1 to 5 words, letters/hyphens/spaces
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (text.length >= 2 && text.length <= 40 && wordCount <= 4 && /^[a-zA-Z\s'-]+$/.test(text)) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          if (rect.width === 0 && rect.height === 0) return;

          // Get enclosing sentence if possible
          const anchorNode = selection.anchorNode;
          const parentText = anchorNode?.parentElement?.innerText || '';
          let surroundingSentence = '';
          if (parentText) {
            const sentences = parentText.split(/[.!?\n]/);
            const found = sentences.find((s) => s.includes(text));
            if (found) surroundingSentence = found.trim();
          }

          setSelectedText(text);
          setContextSentence(surroundingSentence);

          const isMobile = window.innerWidth < 640;
          const tooltipWidth = isMobile ? 180 : 190;
          const tooltipHeight = 44;

          // Horizontal alignment centered around selection with margin guards
          let targetX = rect.left + rect.width / 2 - tooltipWidth / 2;
          targetX = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, targetX));

          // In mobile, prefer placing it above or slightly below if too close to top
          let targetY = rect.top + window.scrollY - tooltipHeight - 10;
          if (rect.top < 60) {
            targetY = rect.bottom + window.scrollY + 12;
          }

          setPosition({ x: targetX, y: targetY });
          setVisible(true);
        } catch (e) {
          setVisible(false);
        }
      } else {
        setVisible(false);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      setTimeout(handleSelection, 20);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      setTimeout(handleSelection, 100);
    };

    const handlePointerDown = (e: Event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
      className="animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 p-1 rounded-full liquid-glass-modal shadow-2xl border border-white/90 backdrop-blur-xl select-none"
    >
      {onDirectAddWord && (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onDirectAddWord(selectedText, contextSentence);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:py-1.5 bg-black text-white hover:bg-zinc-800 rounded-full text-xs font-semibold cursor-pointer active-press shadow-xs"
          title="无需等待直接加入生词本"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          <span>+ 入生词本</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onLookupWord(selectedText, contextSentence);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-800 hover:text-black hover:bg-white/80 rounded-full text-xs font-semibold cursor-pointer active-press transition-colors"
        title="查看详细词义与发音"
      >
        <BookMarked className="w-3.5 h-3.5 text-zinc-600" />
        <span>详情释义</span>
      </button>
    </div>
  );
};
