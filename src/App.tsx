import React, { useState, useEffect } from 'react';
import { INITIAL_TOPICS } from './data/topics';
import { INITIAL_VOCAB } from './data/initialVocab';
import { EvaluationResult, PracticeHistoryItem, Topic, VocabWord } from './types/prep';
import { Header } from './components/Header';
import { TopicSelector } from './components/TopicSelector';
import { StepByStepEditor } from './components/StepByStepEditor';
import { FullTextEditor } from './components/FullTextEditor';
import { EvaluationReport } from './components/EvaluationReport';
import { PrepGuideModal } from './components/PrepGuideModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VocabNotebookDrawer } from './components/VocabNotebookDrawer';
import { VocabDetailModal } from './components/VocabDetailModal';
import { SelectionLookupTooltip } from './components/SelectionLookupTooltip';
import { Sparkles, Layers, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'step' | 'full'>('step');
  const [topics, setTopics] = useState<Topic[]>(INITIAL_TOPICS);
  const [currentTopic, setCurrentTopic] = useState<Topic>(INITIAL_TOPICS[0]);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState<boolean>(false);

  // Step inputs
  const [point, setPoint] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [example, setExample] = useState<string>('');
  const [point2, setPoint2] = useState<string>('');

  // Full text input
  const [fullText, setFullText] = useState<string>('');

  // Evaluation state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [showVocabDrawer, setShowVocabDrawer] = useState<boolean>(false);
  const [vocabModalState, setVocabModalState] = useState<{
    isOpen: boolean;
    wordQuery?: string;
    contextSentence?: string;
    initialWord?: VocabWord;
  }>({ isOpen: false });

  // Vocabulary Notebook in localStorage
  const [vocabWords, setVocabWords] = useState<VocabWord[]>(() => {
    try {
      const saved = localStorage.getItem('prep_master_vocab');
      return saved ? JSON.parse(saved) : INITIAL_VOCAB;
    } catch {
      return INITIAL_VOCAB;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('prep_master_vocab', JSON.stringify(vocabWords));
    } catch (e) {
      console.warn('Failed to save vocabulary to localStorage', e);
    }
  }, [vocabWords]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 2800);
  };

  // Direct 0ms optimistic add to vocabulary notebook
  const handleDirectAddWord = (
    word: string,
    context?: string,
    meaningZh?: string,
    initialData?: Partial<VocabWord>
  ) => {
    if (!word || !word.trim()) return;
    const clean = word.trim();
    const cleanLower = clean.toLowerCase();

    // Check if word already exists in vocabWords
    const existing = vocabWords.find((w) => w.word.toLowerCase() === cleanLower);
    if (existing) {
      showToast(`「${clean}」已在你的生词本中`);
      return;
    }

    // Check client cached dictionary if available
    let cachedInfo: any = null;
    try {
      const cacheMap = JSON.parse(localStorage.getItem('prep_vocab_cache') || '{}');
      if (cacheMap[cleanLower]) {
        cachedInfo = cacheMap[cleanLower];
      }
    } catch {}

    const newWord: VocabWord = {
      id: `vocab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      word: clean,
      phonetic: cachedInfo?.phonetic || initialData?.phonetic || '',
      partOfSpeech: cachedInfo?.partOfSpeech || initialData?.partOfSpeech || (clean.includes(' ') ? 'phrase' : ''),
      meaningZh: cachedInfo?.meaningZh || meaningZh || initialData?.meaningZh || '正在自动解析发音与语境...',
      definitions: cachedInfo?.definitions || initialData?.definitions || (meaningZh ? [{ pos: '释义', meaning: meaningZh }] : []),
      usageNotes: cachedInfo?.usageNotes || initialData?.usageNotes || '',
      collocations: cachedInfo?.collocations || initialData?.collocations || [],
      examples:
        cachedInfo?.examples ||
        initialData?.examples ||
        (context ? [{ en: context, zh: '当前练习中的原句语境' }] : []),
      prepTip: cachedInfo?.prepTip || initialData?.prepTip || '',
      addedAt: Date.now(),
      contextSentence: context,
      starred: false,
      mastered: false,
      enriching: !cachedInfo && !initialData?.definitions?.length,
    };

    setVocabWords((prev) => [newWord, ...prev]);
    showToast(`✨「${clean}」已即刻加入生词本`);

    // If not cached, asynchronously enrich in background
    if (newWord.enriching) {
      fetch('/api/vocab/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: clean, context }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.word) {
            // Save to localStorage cache for future lookups
            try {
              const cacheMap = JSON.parse(localStorage.getItem('prep_vocab_cache') || '{}');
              cacheMap[cleanLower] = data;
              localStorage.setItem('prep_vocab_cache', JSON.stringify(cacheMap));
            } catch {}

            setVocabWords((prev) =>
              prev.map((w) =>
                w.id === newWord.id
                  ? {
                      ...w,
                      phonetic: data.phonetic || w.phonetic,
                      partOfSpeech: data.partOfSpeech || w.partOfSpeech,
                      meaningZh: data.meaningZh || w.meaningZh,
                      definitions: data.definitions || w.definitions,
                      usageNotes: data.usageNotes || w.usageNotes,
                      collocations: data.collocations || w.collocations,
                      examples: data.examples?.length ? data.examples : w.examples,
                      prepTip: data.prepTip || w.prepTip,
                      enriching: false,
                    }
                  : w
              )
            );
          }
        })
        .catch((e) => console.warn('Background vocab enrich failed:', e));
    }
  };

  // Lookup word (from selection tooltip, button click, or manual query)
  const handleLookupWord = (word: string, context?: string) => {
    const clean = word.trim().toLowerCase();
    const existing = vocabWords.find((w) => w.word.toLowerCase() === clean);
    setVocabModalState({
      isOpen: true,
      wordQuery: word,
      contextSentence: context,
      initialWord: existing,
    });
  };

  const handleOpenWordDetail = (word: VocabWord) => {
    setVocabModalState({
      isOpen: true,
      initialWord: word,
    });
  };

  const handleToggleSaveVocab = (word: VocabWord) => {
    const clean = word.word.trim().toLowerCase();
    const exists = vocabWords.some((w) => w.word.toLowerCase() === clean);

    if (exists) {
      // Remove or update
      setVocabWords((prev) => prev.filter((w) => w.word.toLowerCase() !== clean));
      showToast(`已从生词本中移除「${word.word}」`);
    } else {
      setVocabWords((prev) => [word, ...prev]);
      showToast(`✨「${word.word}」已存入生词本`);
    }
  };

  const handleDeleteVocab = (id: string) => {
    setVocabWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleMastered = (id: string) => {
    setVocabWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, mastered: !w.mastered } : w))
    );
  };

  const handleToggleStarred = (id: string) => {
    setVocabWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w))
    );
  };

  const handleImportWords = (imported: VocabWord[]) => {
    setVocabWords((prev) => {
      const existingMap = new Map(prev.map((w) => [w.word.toLowerCase(), w]));
      imported.forEach((w) => {
        if (!existingMap.has(w.word.toLowerCase())) {
          existingMap.set(w.word.toLowerCase(), w);
        }
      });
      return Array.from(existingMap.values());
    });
  };

  // History in localStorage
  const [history, setHistory] = useState<PracticeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('prep_master_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('prep_master_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  // Topic selection
  const handleSelectTopic = (topic: Topic) => {
    setCurrentTopic(topic);
    setPoint('');
    setReason('');
    setExample('');
    setPoint2('');
    setFullText('');
    setEvaluation(null);
    setErrorMsg(null);
  };

  // Custom Topic
  const handleCustomTopic = (questionEn: string, questionZh: string) => {
    const newTopic: Topic = {
      id: `custom-${Date.now()}`,
      category: 'workplace',
      categoryLabel: '自定义表达主题',
      difficulty: 'intermediate',
      questionEn,
      questionZh,
      prepHint: {
        pointHint: '针对本题目直接给出你的核心结论或主张。',
        reasonHint: '解释关键原因，挖掘因果链条，避免仅仅同义换词。',
        exampleHint: '提供一个真实具体的案例、项目数字或个人亲历。',
        point2Hint: '重申观点，呼应首句并提出前瞻性总结。',
      },
    };

    setTopics((prev) => [newTopic, ...prev]);
    setCurrentTopic(newTopic);
    setPoint('');
    setReason('');
    setExample('');
    setPoint2('');
    setFullText('');
    setEvaluation(null);
  };

  // Generate topics using AI
  const handleGenerateAiTopics = async (category: string) => {
    setIsGeneratingTopic(true);
    try {
      const res = await fetch('/api/prep/generate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, difficulty: 'intermediate' }),
      });
      const data = await res.json();
      if (data.topics && data.topics.length > 0) {
        const formatted: Topic[] = data.topics.map((t: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          category: t.category || category || 'workplace',
          categoryLabel:
            category === 'interview'
              ? '英文面试常见题'
              : category === 'tech'
              ? 'AI与科技趋势'
              : category === 'debate'
              ? '思辨与价值权衡'
              : '职场与业务汇报',
          difficulty: 'intermediate',
          questionEn: t.questionEn,
          questionZh: t.questionZh || '',
          prepHint: t.prepHint || {
            pointHint: '结论先行给出明确观点。',
            reasonHint: '剖析根本原因与机制。',
            exampleHint: '举出具备细节支撑的案例。',
            point2Hint: '重申升华并提出行动倡议。',
          },
        }));

        setTopics((prev) => [...formatted, ...prev]);
        setCurrentTopic(formatted[0]);
        setPoint('');
        setReason('');
        setExample('');
        setPoint2('');
        setFullText('');
        setEvaluation(null);
      }
    } catch (err: any) {
      console.error('Failed to generate AI topics:', err);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // Submit Evaluation
  const handleSubmitEvaluation = async () => {
    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      const payload = {
        topic: currentTopic.questionEn,
        mode,
        ...(mode === 'step'
          ? { point, reason, example, point2 }
          : { fullText }),
      };

      const res = await fetch('/api/prep/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.status}`);
      }

      const data: EvaluationResult = await res.json();
      setEvaluation(data);

      // Save to history
      const newHistoryItem: PracticeHistoryItem = {
        id: `practice-${Date.now()}`,
        timestamp: Date.now(),
        topicTitle: currentTopic.questionEn,
        mode,
        overallScore: data.overallScore,
        scores: data.scores,
        userInput: {
          point,
          reason,
          example,
          point2,
          fullText,
        },
        bestPolish: data.polishedVersions.businessProfessional,
        errorCount: data.grammarCorrections.length,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 29)]);

      // Smooth scroll to report
      setTimeout(() => {
        const reportEl = document.getElementById('evaluation-report-section');
        if (reportEl) {
          reportEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setErrorMsg(err?.message || '评估过程中出现异常，请稍后重试。');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Clear inputs
  const handleClear = () => {
    if (mode === 'step') {
      setPoint('');
      setReason('');
      setExample('');
      setPoint2('');
    } else {
      setFullText('');
    }
    setEvaluation(null);
    setErrorMsg(null);
  };

  // Fill sample answers
  const handleFillSample = () => {
    if (currentTopic.sampleAnswer) {
      if (mode === 'step') {
        setPoint(currentTopic.sampleAnswer.point);
        setReason(currentTopic.sampleAnswer.reason);
        setExample(currentTopic.sampleAnswer.example);
        setPoint2(currentTopic.sampleAnswer.point2);
      } else {
        const full = `${currentTopic.sampleAnswer.point} ${currentTopic.sampleAnswer.reason} ${currentTopic.sampleAnswer.example} ${currentTopic.sampleAnswer.point2}`;
        setFullText(full);
      }
    } else {
      // Default fallback sample
      if (mode === 'step') {
        setPoint('When I am exhausted after a long day, I definitely prefer cooking a simple meal at home.');
        setReason('This is primarily because cooking serves as a calming transition and gives me complete control over fresh ingredients.');
        setExample('For instance, last Tuesday I made a hot bowl of tomato egg noodles in 15 minutes, which felt so comforting.');
        setPoint2('Therefore, spending a few quiet minutes in the kitchen is my favorite ritual to unwind and recharge.');
      } else {
        setFullText(
          'When I am exhausted after a long day, I definitely prefer cooking a simple meal at home. This is primarily because cooking serves as a calming transition and gives me complete control over fresh ingredients. For instance, last Tuesday I made a hot bowl of tomato egg noodles in 15 minutes, which felt so comforting. Therefore, spending a few quiet minutes in the kitchen is my favorite ritual to unwind and recharge.'
        );
      }
    }
  };

  // Load history item
  const handleLoadHistoryItem = (item: PracticeHistoryItem) => {
    setMode(item.mode);
    if (item.userInput.fullText) {
      setFullText(item.userInput.fullText);
    }
    if (item.userInput.point) setPoint(item.userInput.point);
    if (item.userInput.reason) setReason(item.userInput.reason);
    if (item.userInput.example) setExample(item.userInput.example);
    if (item.userInput.point2) setPoint2(item.userInput.point2);
  };

  return (
    <div className="min-h-screen bg-[#eaedf1] text-zinc-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-black selection:text-white">
      {/* Monochromatic Apple Studio Ambient Refractive Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        {/* Soft studio light gradients */}
        <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-white/60 via-white/20 to-transparent" />
        {/* Crisp specular overhead spotlight */}
        <div className="absolute -top-[20%] left-[15%] w-[65vw] h-[55vw] rounded-full bg-white/95 blur-[100px]" />
        {/* Soft graphite ambient vignette */}
        <div className="absolute top-[25%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-zinc-900/[0.06] blur-[120px]" />
        {/* Platinum silver depth orb */}
        <div className="absolute bottom-[10%] left-[5%] w-[55vw] h-[45vw] rounded-full bg-zinc-400/[0.18] blur-[130px]" />
        {/* Subtle bottom shadow curvature */}
        <div className="absolute -bottom-[20%] right-[10%] w-[50vw] h-[40vw] rounded-full bg-zinc-900/[0.04] blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <Header
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          setEvaluation(null);
        }}
        onOpenGuide={() => setShowGuideModal(true)}
        onOpenHistory={() => setShowHistoryDrawer(true)}
        historyCount={history.length}
        onOpenVocab={() => setShowVocabDrawer(true)}
        vocabCount={vocabWords.length}
      />

      {/* Floating Tooltip for Word Selection Lookup */}
      <SelectionLookupTooltip
        onLookupWord={handleLookupWord}
        onDirectAddWord={handleDirectAddWord}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full liquid-glass-card shadow-2xl border border-white/90 text-zinc-950 text-xs font-semibold backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-black" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3.5 pb-24 sm:py-6 space-y-4 sm:space-y-6">
        {/* Topic Selector & Prompts */}
        <TopicSelector
          currentTopic={currentTopic}
          topics={topics}
          onSelectTopic={handleSelectTopic}
          onGenerateAiTopics={handleGenerateAiTopics}
          isGeneratingTopic={isGeneratingTopic}
          onCustomTopic={handleCustomTopic}
        />

        {/* Practice Mode Description */}
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
          <div className="flex items-center gap-1.5 font-medium leading-relaxed">
            {mode === 'step' ? (
              <>
                <Layers className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                <span className="text-zinc-900 font-semibold whitespace-nowrap">分步搭建：</span>
                <span className="line-clamp-1">逐段攻克 P-R-E-P，支持 AI 实时纠错与高分句首</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                <span className="text-zinc-900 font-semibold whitespace-nowrap">整篇实战：</span>
                <span className="line-clamp-1">连贯口语/文字输入，AI 自动拆解结构与深度语法重构</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-2">
            <span className="text-zinc-400 hidden md:inline text-[11px]">
              💡 遇到生词划选即可 1 键存入生词本
            </span>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="text-zinc-700 hover:text-black underline underline-offset-2 hidden sm:inline font-medium active-press"
            >
              PREP 句型公式
            </button>
          </div>
        </div>

        {/* Input Editor */}
        {mode === 'step' ? (
          <StepByStepEditor
            topic={currentTopic}
            point={point}
            setPoint={setPoint}
            reason={reason}
            setReason={setReason}
            example={example}
            setExample={setExample}
            point2={point2}
            setPoint2={setPoint2}
            onSubmitEvaluation={handleSubmitEvaluation}
            isEvaluating={isEvaluating}
            onClear={handleClear}
            onFillSample={handleFillSample}
          />
        ) : (
          <FullTextEditor
            topic={currentTopic}
            fullText={fullText}
            setFullText={setFullText}
            onSubmitEvaluation={handleSubmitEvaluation}
            isEvaluating={isEvaluating}
            onClear={handleClear}
            onFillSample={handleFillSample}
          />
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 font-semibold"
            >
              关闭
            </button>
          </div>
        )}

        {/* Evaluation Report Section */}
        {evaluation && (
          <div id="evaluation-report-section" className="pt-4">
            <EvaluationReport
              evaluation={evaluation}
              topic={currentTopic}
              onReset={() => {
                const target = document.querySelector('textarea');
                if (target) target.focus();
                setEvaluation(null);
              }}
              onLookupWord={handleLookupWord}
              onDirectAddWord={handleDirectAddWord}
              savedWords={vocabWords}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/60 bg-white/40 backdrop-blur-xl py-6 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-800">PREP Master</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>日常生活结构性英文表达与实时纠错 (Point · Reason · Example · Point)</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowVocabDrawer(true)}
              className="hover:text-indigo-600 font-medium transition-colors"
            >
              📖 生词本与卡片 ({vocabWords.length})
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="hover:text-slate-900 transition-colors"
            >
              PREP 表达公式
            </button>
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="hover:text-slate-900 transition-colors"
            >
              历史练习本
            </button>
          </div>
        </div>
      </footer>

      {/* Guide Modal */}
      <PrepGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        history={history}
        onClearHistory={() => setHistory([])}
        onLoadItem={handleLoadHistoryItem}
      />

      {/* Vocabulary Notebook Drawer */}
      <VocabNotebookDrawer
        isOpen={showVocabDrawer}
        onClose={() => setShowVocabDrawer(false)}
        words={vocabWords}
        onOpenWordDetail={handleOpenWordDetail}
        onAddWordQuery={handleLookupWord}
        onDirectAddWord={handleDirectAddWord}
        onDeleteWord={handleDeleteVocab}
        onToggleMastered={handleToggleMastered}
        onToggleStarred={handleToggleStarred}
        onImportWords={handleImportWords}
      />

      {/* Vocabulary Word Detail & Lookup Modal */}
      <VocabDetailModal
        isOpen={vocabModalState.isOpen}
        onClose={() => setVocabModalState({ isOpen: false })}
        wordQuery={vocabModalState.wordQuery}
        contextSentence={vocabModalState.contextSentence}
        initialWord={vocabModalState.initialWord}
        isSaved={
          !!vocabModalState.initialWord ||
          (!!vocabModalState.wordQuery &&
            vocabWords.some(
              (w) => w.word.toLowerCase() === vocabModalState.wordQuery?.trim().toLowerCase()
            ))
        }
        onToggleSave={handleToggleSaveVocab}
        onDirectAddWord={handleDirectAddWord}
        onToggleMastered={handleToggleMastered}
        onToggleStarred={handleToggleStarred}
      />
    </div>
  );
}
