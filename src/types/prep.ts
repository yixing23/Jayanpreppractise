export type StepType = 'point' | 'reason' | 'example' | 'point2';

export type TopicCategory =
  | 'all'
  | 'health'
  | 'workplace'
  | 'tech'
  | 'social'
  | 'lifestyle'
  | 'culture'
  | 'food'
  | 'travel'
  | 'daily'
  | string;

export interface Topic {
  id: string;
  category: TopicCategory;
  categoryLabel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionEn: string;
  questionZh: string;
  prepHint: {
    pointHint: string;
    reasonHint: string;
    exampleHint: string;
    point2Hint: string;
  };
  sampleAnswer?: {
    point: string;
    reason: string;
    example: string;
    point2: string;
  };
}

export interface StepAnalysisItem {
  extractedText: string;
  status: 'excellent' | 'good' | 'needs_improvement';
  critique: string;
  betterAlternative: string;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  ruleExplanation: string;
  category: 'grammar' | 'vocabulary' | 'collocation' | 'transition';
}

export interface RecommendedConnector {
  step: 'P' | 'R' | 'E' | 'P2';
  phrase: string;
  explanation: string;
  sampleSentence: string;
}

export interface EvaluationResult {
  overallScore: number;
  scores: {
    structure: number;
    clarity: number;
    logic: number;
    grammar: number;
    vocabulary: number;
  };
  executiveSummary: string;
  stepAnalysis: {
    point: StepAnalysisItem;
    reason: StepAnalysisItem;
    example: StepAnalysisItem;
    point2: StepAnalysisItem;
  };
  grammarCorrections: GrammarCorrection[];
  polishedVersions: {
    businessProfessional: string;
    conversationalFluent: string;
    concisePunchy: string;
  };
  connectorsUsed?: string[];
  recommendedConnectors: RecommendedConnector[];
  shadowingAudioScript: string;
}

export interface StepFeedback {
  status: 'strong' | 'acceptable' | 'needs_work';
  feedback: string;
  grammarIssues?: Array<{ original: string; fixed: string; tip: string }>;
  instantRefinement?: string;
  suggestedStarters?: string[];
}

export interface PracticeHistoryItem {
  id: string;
  timestamp: number;
  topicTitle: string;
  mode: 'step' | 'full';
  overallScore: number;
  scores: {
    structure: number;
    clarity: number;
    logic: number;
    grammar: number;
    vocabulary: number;
  };
  userInput: {
    point?: string;
    reason?: string;
    example?: string;
    point2?: string;
    fullText?: string;
  };
  bestPolish: string;
  errorCount: number;
}

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaningZh: string;
  definitions: Array<{ pos: string; meaning: string }>;
  usageNotes: string;
  collocations: string[];
  examples: Array<{ en: string; zh: string }>;
  prepTip?: string;
  addedAt: number;
  contextSentence?: string;
  starred: boolean;
  mastered: boolean;
  topicTitle?: string;
  enriching?: boolean;
}

export interface CloudSyncConfig {
  syncType: 'local_export' | 'custom_endpoint' | 'plan_pending';
  endpointUrl?: string;
  secretToken?: string;
  autoSync: boolean;
  lastSyncedAt?: number;
}
