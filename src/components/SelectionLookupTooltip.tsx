import React, { useState, useEffect, useRef } from 'react';
import { BookMarked, Sparkles, Check } from 'lucide-react';
import { VocabWord } from '../types/prep';

interface SelectionLookupTooltipProps {
  onLookupWord: (word: string, context?: string) => void;
  onDirectAddWord?: (word: string, context?: string) => void;
  savedWords?: VocabWord[];
}

/**
 * Clean raw selected string by removing leading/trailing punctuation, quotes and whitespace
 */
function sanitizeSelectedWord(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .trim();
}

export const SelectionLookupTooltip: React.FC<SelectionLookupTooltipProps> = ({
  onLookupWord,
  onDirectAddWord,
  savedWords = [],
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedWord, setSelectedWord] = useState('');
  const [contextSentence, setContextSentence] = useState('');
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      // 1. Check window selection
      const selection = window.getSelection();
      let rawText = '';
      let rect: DOMRect | null = null;
      let surrounding = '';

      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        rawText = selection.toString();
        try {
          const range = selection.getRangeAt(0);
          rect = range.getBoundingClientRect();

          // Try to extract surrounding sentence
          const parent = selection.anchorNode?.parentElement;
          if (parent) {
            const fullParagraph = parent.innerText || '';
            const sentences = fullParagraph.split(/[.!?\n]+/);
            const found = sentences.find((s) => s.includes(rawText.trim()));
            if (found) surrounding = found.trim();
          }
        } catch {}
      }

      // 2. Check input/textarea selection if window selection is empty
      const activeEl = document.activeElement;
      if (
        (!rawText || !rawText.trim()) &&
        activeEl &&
        (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement)
      ) {
        const start = activeEl.selectionStart || 0;
        const end = activeEl.selectionEnd || 0;
        if (end > start) {
          rawText = activeEl.value.substring(start, end);
          rect = activeEl.getBoundingClientRect();
          surrounding = activeEl.value;
        }
      }

      if (!rawText || !rawText.trim() || !rect || (rect.width === 0 && rect.height === 0)) {
        setVisible(false);
        return;
      }

      // Sanitize text
      const cleaned = sanitizeSelectedWord(rawText);
      const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

      // Validate: 2 to 45 chars, max 4 words, English characters
      const isEnglishWordOrPhrase =
        cleaned.length >= 2 &&
        cleaned.length <= 45 &&
        wordCount >= 1 &&
        wordCount <= 4 &&
        /^[a-zA-Z]+([-\s'][a-zA-Z]+)*$/.test(cleaned);

      if (!isEnglishWordOrPhrase) {
        setVisible(false);
        return;
      }

      setSelectedWord(cleaned);
      setContextSentence(surrounding);

      // Compute fixed viewport coordinates
      const isMobile = window.innerWidth < 640;
      const tooltipWidth = isMobile ? 180 : 200;
      const tooltipHeight = 42;

      let targetX = rect.left + rect.width / 2 - tooltipWidth / 2;
      targetX = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, targetX));

      // Prefer placing directly above the selected text
      let targetY = rect.top - tooltipHeight - 8;
      // If too close to top of viewport, flip to bottom
      if (rect.top < tooltipHeight + 16) {
        targetY = rect.bottom + 8;
      }

      setPosition({ x: targetX, y: targetY });
      setVisible(true);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      setTimeout(handleSelection, 30);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      setTimeout(handleSelection, 120);
    };

    const handleDismiss = (e: Event) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      // Small timeout to allow click on tooltip
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setVisible(false);
        }
      }, 80);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('selectionchange', handleDismiss);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('selectionchange', handleDismiss);
    };
  }, []);

  if (!visible || !selectedWord) return null;

  const isAlreadySaved = savedWords.some(
    (w) => w.word.toLowerCase() === selectedWord.toLowerCase()
  );

  return (
    <div
      ref={tooltipRef}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999,
      }}
      className="animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 p-1 rounded-full liquid-glass-modal shadow-2xl border border-white/95 backdrop-blur-2xl select-none"
    >
      {onDirectAddWord && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            onDirectAddWord(selectedWord, contextSentence);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer active-press shadow-xs transition-all ${
            isAlreadySaved
              ? 'bg-zinc-800 text-white'
              : 'bg-black text-white hover:bg-zinc-800'
          }`}
          title={isAlreadySaved ? '单词已在你的生词本中' : '一键直接保存至生词本'}
        >
          {isAlreadySaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>已在生词本</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>+ 存生词本</span>
            </>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          onLookupWord(selectedWord, contextSentence);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-800 hover:text-black hover:bg-white/80 rounded-full text-xs font-semibold cursor-pointer active-press transition-colors"
        title="查看详细词义与语境发音"
      >
        <BookMarked className="w-3.5 h-3.5 text-zinc-600" />
        <span>释义</span>
      </button>
    </div>
  );
};
