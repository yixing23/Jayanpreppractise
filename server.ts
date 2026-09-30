import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// DeepSeek API Configuration
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();

/**
 * Robust JSON extraction helper that strips code fences and parses valid JSON
 */
function extractJsonFromText(rawText: string): any {
  if (!rawText || !rawText.trim()) return {};

  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }

  // Find boundaries of outer JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt graceful recovery if truncated by token limit
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
  geminiSchema?: any; // kept for interface backwards-compatibility
}): Promise<any> {
  const apiKey = (process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY).trim();
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured in environment variables');
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
const vocabCache = new Map<string, any>([
  [
    'unwind',
    {
      word: 'unwind',
      phonetic: '/ʌnˈwaɪnd/',
      partOfSpeech: 'verb',
      meaningZh: '放松身心，解压舒缓；解开',
      definitions: [{ pos: 'v.', meaning: '在工作或紧张活动之后放松身心、卸下紧绷' }],
      usageNotes: '常用于描述“下班后卸下一天疲惫”的日常治愈语境，比单纯的 relax 更有画面感。',
      collocations: ['unwind after a long day (漫长一天后解压)', 'a ritual to unwind (放松仪式)', 'help unwind (帮助舒缓)'],
      examples: [
        { en: 'Cooking a quick hot meal serves as a calming ritual to unwind after work.', zh: '下班后做一顿热腾腾的快手餐，是我用来舒缓身心的放松仪式。' }
      ],
      prepTip: '在 PREP 的 Reason 或 Example 环节表达个人情感状态转变时极其地道。'
    }
  ],
  [
    'mindful',
    {
      word: 'mindful',
      phonetic: '/ˈmaɪnd.fəl/',
      partOfSpeech: 'adjective',
      meaningZh: '留神的，正念专注的；留心体会的',
      definitions: [{ pos: 'adj.', meaning: '对当下体验保持专注觉察的；注意留心的' }],
      usageNotes: '在当代生活习惯探讨中极高频，常与 eating, living, transition 搭配。',
      collocations: ['mindful transition (专注平缓的心理过渡)', 'be mindful of (留心某事)', 'mindful living (正念慢生活)'],
      examples: [
        { en: 'Spending 15 mindful minutes in the kitchen helps me disconnect from screen fatigue.', zh: '在厨房度过 15 分钟专注而宁静的烹饪时光，能帮我摆脱屏幕疲劳。' }
      ],
      prepTip: '适合用于 Reason 解释为什么某个生活习惯能够提升生活品质与幸福感。'
    }
  ],
  [
    'tactile',
    {
      word: 'tactile',
      phonetic: '/ˈtæk.taɪl/',
      partOfSpeech: 'adjective',
      meaningZh: '触觉的；有实物触感的',
      definitions: [{ pos: 'adj.', meaning: '与触觉有关的；给人真实触觉反馈的' }],
      usageNotes: '常用于讨论纸质书 vs 电子书、烹饪、手工艺等充满真实触觉体验的场景。',
      collocations: ['tactile pleasure (触觉愉悦感)', 'tactile experience (真实触感体验)'],
      examples: [
        { en: 'Flipping through paper pages delivers a tactile pleasure that screens cannot replicate.', zh: '翻阅纸质书页能带来屏幕无法复制的真实触感愉悦。' }
      ],
      prepTip: '在 PREP 的 Example 环节提供感官细节支撑，增强说服力。'
    }
  ],
  [
    'nuanced',
    {
      word: 'nuanced',
      phonetic: '/ˈnuː.ɑːnst/',
      partOfSpeech: 'adjective',
      meaningZh: '细致入微的；有微妙差别的',
      definitions: [{ pos: 'adj.', meaning: '充满微妙细节与层次的' }],
      usageNotes: '用来赞扬思考全面、不是非黑即白的观点。',
      collocations: ['nuanced perspective (细腻深刻的视角)', 'nuanced understanding (精细的理解)'],
      examples: [
        { en: 'She gave a nuanced perspective on balancing career ambition and personal well-being.', zh: '她对平衡职业野心与个人身心健康给出了细腻深刻的见解。' }
      ],
      prepTip: 'Point 环节提出不走极端的平衡观点时极佳。'
    }
  ]
]);

// Real-time evaluation of complete PREP output
app.post('/api/prep/evaluate', async (req, res) => {
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

// Lightweight instant step feedback (called when user finishes a step or requests a hint)
app.post('/api/prep/step-check', async (req, res) => {
  try {
    const { stepType, content, topic } = req.body;
    // stepType: 'point' | 'reason' | 'example' | 'point2'
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

    const systemInstruction =
      'You are a real-time English writing assistant. Return strict JSON. Help users improve their single PREP step immediately.';
    const parsed = await callLLMJson({
      systemInstruction,
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
app.post('/api/prep/generate-topic', async (req, res) => {
  try {
    const { category, difficulty } = req.body;
    const prompt = `Generate 4 highly relatable, casual, everyday life discussion prompts/questions for practicing the PREP framework in English.
These questions should be grounded in daily living, personal habits, food & cooking, weekend plans, social media, pets, movies, travel, coffee, or relatable life dilemmas that anyone can easily talk about (e.g., cooking vs takeout, waking up early vs staying up late, physical books vs kindle, gym vs outdoor run, texting vs phone calls, living alone vs roommates).
DO NOT generate overly rigid corporate, enterprise business, or academic jargon questions unless specifically requested.

Category: ${category || 'daily'}
Difficulty level: ${difficulty || 'beginner'} (keep language natural and conversational)

For each question:
- Provide the English question (relatable and natural)
- Chinese translation
- Brief hint on how to structure the PREP response (sample Point choice, typical Reason, concrete Example idea)

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

// Word / Phrase Dictionary Lookup for Vocabulary Notebook
app.post('/api/vocab/lookup', async (req, res) => {
  try {
    const { word, context } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const cleanWord = word.trim().slice(0, 60);
    const cacheKey = cleanWord.toLowerCase();

    // 1. Return immediately from server memory cache if available (< 2ms)
    if (vocabCache.has(cacheKey)) {
      return res.json(vocabCache.get(cacheKey));
    }

    const prompt = `You are an expert bilingual English-Chinese lexicographer and speaking coach.
Analyze the following English word or short phrase for a learner's vocabulary notebook.

Word / Phrase: "${cleanWord}"
Context sentence (if available): "${context || ''}"

Return a comprehensive, learner-friendly dictionary entry in strict JSON format:
{
  "word": "${cleanWord}",
  "phonetic": "Accurate IPA phonetic symbols, e.g. /ˈmaɪnd.fəl/",
  "partOfSpeech": "e.g. adjective / verb / noun / phrase",
  "meaningZh": "Concise core Chinese translation (e.g. 留心的，正念专注的)",
  "definitions": [
    { "pos": "adj.", "meaning": "专注于当下的；留心的" }
  ],
  "usageNotes": "1-2 practical usage tips in Chinese explaining nuances, register (casual/formal), and common mistakes",
  "collocations": [
    "mindful eating (专心进食)",
    "be mindful of (留心/注意某事)",
    "mindful transition (平缓专注的心态过渡)"
  ],
  "examples": [
    {
      "en": "Cooking a simple meal serves as a mindful ritual to unwind after work.",
      "zh": "下班后做一顿简餐是一种专注于当下的治愈仪式，能帮我彻底放松。"
    },
    {
      "en": "We should be mindful of how much time we spend scrolling social media.",
      "zh": "我们应当留心自己每天在刷社交媒体上花了多少时间。"
    }
  ],
  "prepTip": "In PREP, this word works great in the Reason step to explain psychological benefits, or in the Point step for a nuanced stance."
}`;

    const parsed = await callLLMJson({
      systemInstruction:
        'You are an expert bilingual English-Chinese dictionary and vocabulary mentor. Output valid JSON strictly conforming to the requested schema. Ensure authentic native pronunciations and high-yield collocations.',
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
    // Graceful offline fallback so user is never blocked when API rate limit occurs
    const cleanWord = req.body?.word?.trim() || '';
    const fallbackEntry = {
      word: cleanWord,
      phonetic: '',
      partOfSpeech: cleanWord.includes(' ') ? 'phrase' : 'word',
      meaningZh: '已存入生词本（API 配额繁忙，可在空闲时点重试刷新）',
      definitions: [{ pos: '', meaning: '已存入生词本' }],
      usageNotes: '当前请求频次较高，单词已为您安全保存在本地。',
      collocations: [],
      examples: req.body?.context ? [{ en: req.body.context, zh: '练习语境原句' }] : [],
      prepTip: '可在日常 PREP 练习中随时调用复习。',
    };
    res.json(fallbackEntry);
  }
});

// --- Cross-Device Cloud Sync Endpoints (Upstash Redis / Vercel KV / In-Memory Fallback) ---
const inMemorySyncStore = new Map<string, { vocab: any[]; history: any[]; updatedAt: number }>();

async function getSyncData(code: string): Promise<{ vocab: any[]; history: any[]; updatedAt: number } | null> {
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
    } catch (err) {
      console.warn('KV get failed, using fallback:', err);
    }
  }

  return inMemorySyncStore.get(cleanCode) || null;
}

async function saveSyncData(
  code: string,
  payload: { vocab: any[]; history: any[]; updatedAt: number }
): Promise<boolean> {
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
    } catch (err) {
      console.warn('KV set failed, fallback saved in memory:', err);
    }
  }

  return true;
}

// 1. Pull data by sync code
app.post('/api/sync/pull', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Sync code is required' });
    }

    const data = await getSyncData(code);
    res.json({
      success: true,
      exists: !!data,
      data: data || { vocab: [], history: [], updatedAt: 0 },
    });
  } catch (error: any) {
    console.error('Error pulling sync data:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Push data by sync code
app.post('/api/sync/push', async (req, res) => {
  try {
    const { code, data } = req.body;
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Sync code is required' });
    }

    const vocab = Array.isArray(data?.vocab) ? data.vocab : [];
    const history = Array.isArray(data?.history) ? data.history : [];
    const updatedAt = typeof data?.updatedAt === 'number' ? data.updatedAt : Date.now();

    const payload = { vocab, history, updatedAt };
    await saveSyncData(code, payload);

    res.json({
      success: true,
      updatedAt,
      vocabCount: vocab.length,
      historyCount: history.length,
    });
  } catch (error: any) {
    console.error('Error pushing sync data:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`PREP Master server running on port ${PORT}`);
  });
}

// Export Express app for Vercel Serverless Function
export default app;

// Only start standalone HTTP server if not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer();
}
