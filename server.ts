import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-c8d05ec58402403d868c50f1a55cca6d';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateContentWithFallback(
  ai: GoogleGenAI,
  config: any,
  models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
) {
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...config,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        const isRateLimit = msg.includes('resource_exhausted') || msg.includes('429') || msg.includes('quota');
        console.warn(`Model ${model} attempt ${attempt + 1} failed. RateLimit: ${isRateLimit}. Error:`, msg);

        if (isRateLimit && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1200));
        } else {
          break;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  throw lastError;
}

// Unified high-reliability LLM caller: Primary DeepSeek-V3, fallback to Gemini
async function callLLMJson(options: {
  systemInstruction?: string;
  prompt: string;
  geminiSchema?: any;
  maxTokens?: number;
  temperature?: number;
}): Promise<any> {
  const deepseekKey = (process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY).trim();

  // 1. Primary: DeepSeek-V3 (OpenAI-compatible)
  if (deepseekKey) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        messages.push({ role: 'user', content: options.prompt });

        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            response_format: { type: 'json_object' },
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2500,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || '{}';
          return JSON.parse(content);
        } else {
          const errText = await res.text();
          console.warn(`DeepSeek API error status ${res.status}:`, errText);
        }
      } catch (e) {
        console.warn(`DeepSeek attempt ${attempt + 1} error:`, e);
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // 2. Secondary fallback: Gemini
  if (process.env.GEMINI_API_KEY) {
    const config: any = {
      systemInstruction: options.systemInstruction,
      responseMimeType: 'application/json',
    };
    if (options.geminiSchema) {
      config.responseSchema = options.geminiSchema;
    }
    const response = await generateContentWithFallback(ai, {
      contents: options.prompt,
      config,
    });
    return JSON.parse(response.text || '{}');
  }

  throw new Error('AI service error: Unable to complete LLM request');
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
1. PREP Structure Fidelity:
   - Point 1: Did they state their preference, stance, or core opinion directly upfront?
   - Reason: Did they provide a real reason why, rather than just repeating "because it is good" (avoiding circular logic)?
   - Example: Is it a relatable personal experience, vivid scenario, or concrete situation?
   - Point 2 (Reiterate): Does it tie the thought back together nicely without verbatim repetition?
2. Real-time Grammar, Collocations, and Phrasing Corrections:
   - Identify grammatical mistakes, awkward phrasing, unnatural Chinglish/translation artifacts, wrong prepositions, or tense slips.
   - Provide the exact natural native English fix and explain the rule/idiom in friendly Chinese.
3. Native Speaker Polish:
   - Provide three natural variations:
     1. "Expressive & Natural" (natural, fluent everyday spoken English with idioms and rhythm)
     2. "Elegant & Thoughtful" (smooth, well-crafted, articulate)
     3. "Concise & Punchy" (clean, compact 20-30 second conversational delivery)
4. Actionable Connectors & Next Steps:
   - Suggest great conversational and logical transition phrases that fit this context naturally.

Output STRICTLY valid JSON conforming to the requested schema.`;

    const parsed = await callLLMJson({
      systemInstruction:
        'You are an empathetic, expert bilingual (English-Chinese) speaking & writing coach for the PREP method. You help learners express their opinions on daily life and general topics with structure, clarity, and idiomatic ease. Output strictly valid JSON. Keep explanations in Chinese for clarity, while all English text must be natural, authentic native English.',
      prompt: promptText,
      maxTokens: 3000,
      geminiSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.INTEGER, description: 'Score from 0 to 100' },
          scores: {
            type: Type.OBJECT,
            properties: {
              structure: { type: Type.INTEGER, description: 'Score 0-100 for PREP structural adherence' },
              clarity: { type: Type.INTEGER, description: 'Score 0-100 for clarity and conciseness' },
              logic: { type: Type.INTEGER, description: 'Score 0-100 for logical depth and cause-effect connection' },
              grammar: { type: Type.INTEGER, description: 'Score 0-100 for grammatical accuracy' },
              vocabulary: { type: Type.INTEGER, description: 'Score 0-100 for lexical richness and idiomatic collocations' },
            },
            required: ['structure', 'clarity', 'logic', 'grammar', 'vocabulary'],
          },
          executiveSummary: {
            type: Type.STRING,
            description: 'Comprehensive constructive summary of performance in Chinese (2-3 sentences)',
          },
          stepAnalysis: {
            type: Type.OBJECT,
            properties: {
              point: {
                type: Type.OBJECT,
                properties: {
                  extractedText: { type: Type.STRING },
                  status: { type: Type.STRING, description: '"excellent", "good", or "needs_improvement"' },
                  critique: { type: Type.STRING, description: 'Detailed feedback on this point' },
                  betterAlternative: { type: Type.STRING, description: 'A more powerful phrasing of the Point' },
                },
                required: ['extractedText', 'status', 'critique', 'betterAlternative'],
              },
              reason: {
                type: Type.OBJECT,
                properties: {
                  extractedText: { type: Type.STRING },
                  status: { type: Type.STRING, description: '"excellent", "good", or "needs_improvement"' },
                  critique: { type: Type.STRING, description: 'Detailed feedback on the reason' },
                  betterAlternative: { type: Type.STRING, description: 'A more compelling phrasing of the Reason' },
                },
                required: ['extractedText', 'status', 'critique', 'betterAlternative'],
              },
              example: {
                type: Type.OBJECT,
                properties: {
                  extractedText: { type: Type.STRING },
                  status: { type: Type.STRING, description: '"excellent", "good", or "needs_improvement"' },
                  critique: { type: Type.STRING, description: 'Detailed feedback on the example' },
                  betterAlternative: { type: Type.STRING, description: 'A more concrete phrasing of the Example' },
                },
                required: ['extractedText', 'status', 'critique', 'betterAlternative'],
              },
              point2: {
                type: Type.OBJECT,
                properties: {
                  extractedText: { type: Type.STRING },
                  status: { type: Type.STRING, description: '"excellent", "good", or "needs_improvement"' },
                  critique: { type: Type.STRING, description: 'Detailed feedback on the restated point' },
                  betterAlternative: { type: Type.STRING, description: 'A more impactful closing phrasing' },
                },
                required: ['extractedText', 'status', 'critique', 'betterAlternative'],
              },
            },
            required: ['point', 'reason', 'example', 'point2'],
          },
          grammarCorrections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING, description: 'The exact problematic phrase or sentence segment' },
                corrected: { type: Type.STRING, description: 'The grammatically and idiomatically corrected version' },
                ruleExplanation: { type: Type.STRING, description: 'Explanation in Chinese of the rule or idiom' },
                category: { type: Type.STRING, description: '"grammar", "vocabulary", "collocation", or "transition"' },
              },
              required: ['original', 'corrected', 'ruleExplanation', 'category'],
            },
          },
          polishedVersions: {
            type: Type.OBJECT,
            properties: {
              businessProfessional: {
                type: Type.STRING,
                description: 'A polished, executive-ready version suitable for meetings, emails, or presentations',
              },
              conversationalFluent: {
                type: Type.STRING,
                description: 'A smooth, naturally flowing version suitable for networking or informal discussions',
              },
              concisePunchy: {
                type: Type.STRING,
                description: 'A compact 30-second elevator pitch version',
              },
            },
            required: ['businessProfessional', 'conversationalFluent', 'concisePunchy'],
          },
          connectorsUsed: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Transitional connectors detected in user input',
          },
          recommendedConnectors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING, description: '"P", "R", "E", or "P2"' },
                phrase: { type: Type.STRING },
                explanation: { type: Type.STRING },
                sampleSentence: { type: Type.STRING },
              },
              required: ['step', 'phrase', 'explanation', 'sampleSentence'],
            },
          },
          shadowingAudioScript: {
            type: Type.STRING,
            description: 'A clean, well-paced script of the best revision for the user to practice reading aloud',
          },
        },
        required: [
          'overallScore',
          'scores',
          'executiveSummary',
          'stepAnalysis',
          'grammarCorrections',
          'polishedVersions',
          'recommendedConnectors',
          'shadowingAudioScript',
        ],
      },
    });

    res.json(parsed);
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

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PREP Master server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
