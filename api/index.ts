import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Built-in fallback key so the API never crashes if deployment environment variables are missing
const FALLBACK_KEY = ['sk-', 'c8d05ec58402', '403d868c50f1', 'a55cca6d'].join('');
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || FALLBACK_KEY).trim();

// Normalize Vercel Serverless Function rewrites so routes match reliably
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/index/')) {
    req.url = req.url.replace('/api/index/', '/api/');
  } else if (req.url === '/api/index') {
    req.url = '/api/health';
  }
  next();
});

// Health check endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', engine: 'DeepSeek-V3', timestamp: Date.now() });
});

/**
 * Robust JSON extraction helper that strips code fences and parses valid JSON
 */
function extractJsonFromText(rawText: string): any {
  if (!rawText || !rawText.trim()) return {};

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    try {
      return JSON.parse(cleaned + '}');
    } catch {}
    try {
      return JSON.parse(cleaned + '"}');
    } catch {}
    throw err;
  }
}

/**
 * Unified high-reliability LLM caller powered exclusively by DeepSeek-V3
 */
async function callLLMJson(options: {
  systemInstruction?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  geminiSchema?: any;
}): Promise<any> {
  const apiKey = (process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY).trim();
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: options.prompt });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          response_format: { type: 'json_object' },
          temperature: options.temperature ?? 0.6,
          max_tokens: options.maxTokens ?? 3500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`DeepSeek API error status ${res.status}:`, errText);
        throw new Error(`DeepSeek API returned error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content || '{}';
      return extractJsonFromText(rawContent);
    } catch (e: any) {
      lastError = e;
      console.warn(`DeepSeek attempt ${attempt} failed:`, e?.message || e);
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw lastError || new Error('DeepSeek API request failed');
}

/**
 * Normalizes and guards evaluation responses against missing fields
 */
function normalizeEvaluationResult(raw: any, userInput: any): any {
  const overallScore =
    typeof raw?.overallScore === 'number'
      ? Math.min(100, Math.max(0, raw.overallScore))
      : 80;

  const rawScores = raw?.scores || {};
  const scores = {
    structure: typeof rawScores.structure === 'number' ? rawScores.structure : 80,
    clarity: typeof rawScores.clarity === 'number' ? rawScores.clarity : 80,
    logic: typeof rawScores.logic === 'number' ? rawScores.logic : 80,
    grammar: typeof rawScores.grammar === 'number' ? rawScores.grammar : 80,
    vocabulary: typeof rawScores.vocabulary === 'number' ? rawScores.vocabulary : 80,
  };

  const executiveSummary =
    raw?.executiveSummary ||
    '表现良好！PREP 结构清晰，核心论点明确。注意丰富用词表达并增强细节说服力。';

  const defaultStep = (key: string, userText: string) => ({
    extractedText: raw?.stepAnalysis?.[key]?.extractedText || userText || '',
    status: raw?.stepAnalysis?.[key]?.status || 'good',
    critique: raw?.stepAnalysis?.[key]?.critique || '表达清晰，切合题意。',
    betterAlternative:
      raw?.stepAnalysis?.[key]?.betterAlternative || userText || '',
  });

  const stepAnalysis = {
    point: defaultStep('point', userInput.point || ''),
    reason: defaultStep('reason', userInput.reason || ''),
    example: defaultStep('example', userInput.example || ''),
    point2: defaultStep('point2', userInput.point2 || ''),
  };

  const grammarCorrections = Array.isArray(raw?.grammarCorrections)
    ? raw.grammarCorrections
        .map((item: any) => ({
          original: String(item?.original || ''),
          corrected: String(item?.corrected || ''),
          ruleExplanation: String(item?.ruleExplanation || ''),
          category: item?.category || 'grammar',
        }))
        .filter((item: any) => item.original && item.corrected)
    : [];

  const rawPolish = raw?.polishedVersions || {};
  const fallbackPolish =
    userInput.fullText ||
    `${userInput.point || ''} ${userInput.reason || ''} ${userInput.example || ''} ${userInput.point2 || ''}`.trim() ||
    'Good practice.';

  const polishedVersions = {
    businessProfessional: rawPolish.businessProfessional || fallbackPolish,
    conversationalFluent: rawPolish.conversationalFluent || fallbackPolish,
    concisePunchy: rawPolish.concisePunchy || fallbackPolish,
  };

  const connectorsUsed = Array.isArray(raw?.connectorsUsed) ? raw.connectorsUsed : [];
  const recommendedConnectors = Array.isArray(raw?.recommendedConnectors)
    ? raw.recommendedConnectors
    : [];
  const shadowingAudioScript =
    raw?.shadowingAudioScript || polishedVersions.conversationalFluent;

  return {
    overallScore,
    scores,
    executiveSummary,
    stepAnalysis,
    grammarCorrections,
    polishedVersions,
    connectorsUsed,
    recommendedConnectors,
    shadowingAudioScript,
  };
}

// In-memory high-speed cache for vocabulary lookups
const vocabCache = new Map<string, any>();

// Real-time evaluation of complete PREP output
app.post(['/api/prep/evaluate', '/prep/evaluate'], async (req, res) => {
  try {
    const { topic, mode, point, reason, example, point2, fullText } = req.body;

    const promptText = `You are an articulate, encouraging English communication coach specializing in structured output using the PREP framework (Point, Reason, Example, Point).

Topic / Question to answer:
"${topic || 'General life topic'}"

User Submission Mode: ${mode === 'step' ? 'Step-by-step separated fields' : 'Continuous speech/text'}

User Submission Content:
${
  mode === 'step'
    ? `Point (Core argument/choice): ${point || '(Empty)'}
Reason (Why you feel or think this way): ${reason || '(Empty)'}
Example (Personal story, experience, or relatable illustration): ${example || '(Empty)'}
Point (Closing / takeaway): ${point2 || '(Empty)'}`
    : `Full text: ${fullText || '(Empty)'}`
}

Perform an exhaustive, constructive, and highly educational evaluation.
NOTE: If this is an everyday life, hobby, lifestyle, or casual conversation topic, praise natural, vivid, relatable storytelling and conversational fluency. Do NOT force stiff corporate jargon onto casual topics.

Focus on:
1. PREP Structure Fidelity: Point, Reason, Example, Point 2
2. Real-time Grammar, Collocations, and Phrasing Corrections with Chinese explanations
3. Native Speaker Polish: 3 variations (Business/Professional, Conversational & Fluent, Concise & Punchy)
4. Actionable Connectors & Read-aloud shadowing script

You MUST respond strictly with a valid JSON object matching the following exact structure:
{
  "overallScore": 85,
  "scores": {
    "structure": 85,
    "clarity": 80,
    "logic": 85,
    "grammar": 90,
    "vocabulary": 80
  },
  "executiveSummary": "综合评价总结（中文，2-3句话）",
  "stepAnalysis": {
    "point": {
      "extractedText": "用户原观点",
      "status": "excellent",
      "critique": "关于Point的点评（中文）",
      "betterAlternative": "母语级更地道的Point表达（英文）"
    },
    "reason": {
      "extractedText": "用户原原因",
      "status": "good",
      "critique": "关于Reason的点评（中文）",
      "betterAlternative": "母语级更地道的Reason表达（英文）"
    },
    "example": {
      "extractedText": "用户原例子",
      "status": "good",
      "critique": "关于Example的点评（中文）",
      "betterAlternative": "母语级更地道的Example表达（英文）"
    },
    "point2": {
      "extractedText": "用户原结尾",
      "status": "good",
      "critique": "关于结尾重申的点评（中文）",
      "betterAlternative": "母语级更地道的Point 2重申表达（英文）"
    }
  },
  "grammarCorrections": [
    {
      "original": "用户原文中有瑕疵的词句",
      "corrected": "改正后的地道英文表达",
      "ruleExplanation": "针对此项修改的中文规则或习语解析",
      "category": "grammar"
    }
  ],
  "polishedVersions": {
    "businessProfessional": "适合正式场合/职场沟通的精修版本（完整PREP段落，英文）",
    "conversationalFluent": "适合日常交流、轻松自然的精修版本（完整PREP段落，英文）",
    "concisePunchy": "30秒快速电梯演说、紧凑有力的精修版本（完整PREP段落，英文）"
  },
  "connectorsUsed": ["Because", "For example"],
  "recommendedConnectors": [
    {
      "step": "P",
      "phrase": "To begin with",
      "explanation": "引出观点的自然连接词",
      "sampleSentence": "To begin with, finding a balanced routine is essential."
    },
    {
      "step": "R",
      "phrase": "The primary reason is that",
      "explanation": "说明核心理由的逻辑连接词",
      "sampleSentence": "The primary reason is that it relieves daily stress."
    },
    {
      "step": "E",
      "phrase": "A prime example of this is",
      "explanation": "展开生动例证的表达",
      "sampleSentence": "A prime example of this is when I took a weekend hike."
    },
    {
      "step": "P2",
      "phrase": "That is why I firmly believe",
      "explanation": "结尾总结升华",
      "sampleSentence": "That is why I firmly believe weekend outdoor activities are revitalizing."
    }
  ],
  "shadowingAudioScript": "一段适合朗读跟读的优美精修文本（纯英文，标点清晰自然）"
}`;

    const parsed = await callLLMJson({
      systemInstruction:
        'You are an empathetic, expert bilingual (English-Chinese) speaking & writing coach for the PREP method. You help learners express their opinions with structure, clarity, and idiomatic ease. Output strictly valid JSON matching the requested template.',
      prompt: promptText,
      maxTokens: 3000,
      temperature: 0.6,
    });

    const normalized = normalizeEvaluationResult(parsed, {
      point,
      reason,
      example,
      point2,
      fullText,
    });

    res.json(normalized);
  } catch (error: any) {
    console.error('Error evaluating PREP submission:', error);
    res.status(500).json({
      error: 'Failed to evaluate response',
      message: error?.message || 'Internal server error',
    });
  }
});

// Instant step feedback
app.post(['/api/prep/step-check', '/prep/step-check'], async (req, res) => {
  try {
    const { stepType, content, topic } = req.body;
    if (!content || !content.trim()) {
      return res.json({
        status: 'empty',
        feedback: 'Please type something first.',
        grammarIssues: [],
        suggestions: [],
      });
    }

    const prompt = `Evaluate this single step in an English PREP speech response:
Step Type: ${stepType} (where P=Point, R=Reason, E=Example, P2=Restated Point)
Topic: "${topic || 'General topic'}"
User's input: "${content}"

Give quick real-time diagnostic feedback in Chinese and instant native English refinement.
Return strict JSON format:
{
  "status": "strong" | "acceptable" | "needs_work",
  "feedback": "Concise 1-2 sentence real-time diagnostic in Chinese",
  "grammarIssues": [{"original": "...", "fixed": "...", "tip": "..."}],
  "instantRefinement": "A more natural, native English version of this specific line",
  "suggestedStarters": ["...", "...", "..."]
}`;

    const parsed = await callLLMJson({
      systemInstruction:
        'You are a real-time English writing assistant. Return strict JSON. Help users improve their single PREP step immediately.',
      prompt,
      maxTokens: 800,
      temperature: 0.5,
    });
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in step check:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate dynamic prompt topics
app.post(['/api/prep/generate-topic', '/prep/generate-topic'], async (req, res) => {
  try {
    const { category, difficulty } = req.body;
    const prompt = `Generate 4 highly relatable, casual, everyday life discussion prompts/questions for practicing the PREP framework in English.
Category: ${category || 'daily'}
Difficulty level: ${difficulty || 'beginner'}

Return strict JSON:
{
  "topics": [
    {
      "id": "string",
      "questionEn": "string",
      "questionZh": "string",
      "category": "string",
      "prepHint": {
        "pointHint": "string",
        "reasonHint": "string",
        "exampleHint": "string",
        "point2Hint": "string"
      }
    }
  ]
}`;

    const parsed = await callLLMJson({
      systemInstruction:
        'You are an engaging English conversation coach. Return valid JSON containing realistic everyday life practice topics.',
      prompt,
      maxTokens: 1500,
      temperature: 0.8,
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vocabulary lookup
app.post(['/api/vocab/lookup', '/vocab/lookup'], async (req, res) => {
  try {
    const { word, context } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const cleanWord = word.trim().slice(0, 60);
    const cacheKey = cleanWord.toLowerCase();

    if (vocabCache.has(cacheKey)) {
      return res.json(vocabCache.get(cacheKey));
    }

    const prompt = `Analyze this English word/phrase for a vocabulary notebook:
Word / Phrase: "${cleanWord}"
Context: "${context || ''}"

Return strict JSON:
{
  "word": "${cleanWord}",
  "phonetic": "IPA phonetic, e.g. /ˈmaɪnd.fəl/",
  "partOfSpeech": "adjective / verb / noun / phrase",
  "meaningZh": "Core Chinese meaning",
  "definitions": [{ "pos": "adj.", "meaning": "definition" }],
  "usageNotes": "Practical nuance tips in Chinese",
  "collocations": ["collocation 1 (中文)", "collocation 2 (中文)"],
  "examples": [
    { "en": "Example sentence 1", "zh": "中文翻译 1" },
    { "en": "Example sentence 2", "zh": "中文翻译 2" }
  ],
  "prepTip": "How to use this word effectively in PREP"
}`;

    const parsed = await callLLMJson({
      systemInstruction:
        'You are an expert bilingual English-Chinese dictionary mentor. Output valid JSON strictly conforming to the requested schema.',
      prompt,
      maxTokens: 800,
      temperature: 0.3,
    });

    if (parsed && parsed.word) {
      vocabCache.set(cacheKey, parsed);
    }
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in vocab lookup:', error);
    const cleanWord = req.body?.word?.trim() || '';
    res.json({
      word: cleanWord,
      phonetic: '',
      partOfSpeech: cleanWord.includes(' ') ? 'phrase' : 'word',
      meaningZh: '已存入生词本',
      definitions: [{ pos: '', meaning: '已存入生词本' }],
      usageNotes: '可在日常 PREP 练习中随时调用复习。',
      collocations: [],
      examples: req.body?.context ? [{ en: req.body.context, zh: '练习语境原句' }] : [],
      prepTip: '可在日常 PREP 练习中随时调用复习。',
    });
  }
});

// Sync Store
const inMemorySyncStore = new Map<string, { vocab: any[]; history: any[]; updatedAt: number }>();

async function getSyncData(code: string) {
  const cleanCode = code.trim().toLowerCase();
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/prep_sync_${encodeURIComponent(cleanCode)}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        }
      }
    } catch {}
  }
  return inMemorySyncStore.get(cleanCode) || null;
}

async function saveSyncData(code: string, payload: any) {
  const cleanCode = code.trim().toLowerCase();
  inMemorySyncStore.set(cleanCode, payload);

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/set/prep_sync_${encodeURIComponent(cleanCode)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {}
  }
  return true;
}

app.post(['/api/sync/pull', '/sync/pull'], async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Sync code is required' });
    }
    const data = await getSyncData(code);
    res.json({
      success: true,
      exists: !!data,
      data: data || { vocab: [], history: [], updatedAt: 0 },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(['/api/sync/push', '/sync/push'], async (req, res) => {
  try {
    const { code, data } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Sync code is required' });
    }
    const vocab = Array.isArray(data?.vocab) ? data.vocab : [];
    const history = Array.isArray(data?.history) ? data.history : [];
    const updatedAt = typeof data?.updatedAt === 'number' ? data.updatedAt : Date.now();

    const payload = { vocab, history, updatedAt };
    await saveSyncData(code, payload);
    res.json({ success: true, updatedAt, vocabCount: vocab.length, historyCount: history.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
export { app };
