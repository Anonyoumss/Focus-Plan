import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Status endpoint: tells the frontend if server-side Gemini is configured
  app.get('/api/gemini/status', (_req: Request, res: Response) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      available: hasKey,
      model: 'gemini-3.8-flash',
      storage: 'server-side environment variable (never exposed in browser bundle)',
    });
  });

  // Feature (a): Test Intake Consult
  app.post('/api/gemini/intake-consult', async (req: Request, res: Response): Promise<void> => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_KEY_UNAVAILABLE',
          message: 'Server-side Gemini API key is not configured in environment.',
          fallback: true,
        });
        return;
      }

      const {
        testId,
        testName,
        currentScore,
        targetScore,
        weeksRemaining,
        currentDailyHours,
        sections,
        locale = 'en',
      } = req.body;

      if (!testId || typeof currentScore !== 'number' || typeof targetScore !== 'number') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'testId, currentScore, and targetScore are required.' });
        return;
      }

      const systemInstruction =
        'You are an expert academic advisor for standardized tests. Given test metadata, user baseline, and target score, output per-section target scores and total weekly pomodoros (25m each). Never invent unofficial scoring ranges or exam dates. Output strict JSON with aiSuggested: true.';

      const prompt = JSON.stringify({
        testId,
        testName: testName || testId,
        currentScore,
        targetScore,
        weeksRemaining: weeksRemaining || 8,
        currentDailyHours: currentDailyHours || 2,
        sections: sections || [],
        locale,
        instructions:
          locale === 'ar'
            ? 'اكتب التوجيهات والاستراتيجية باللغة العربية مع إبقاء مسميات الاختبار الرسمية كما هي.'
            : 'Write strategy summary in English keeping official test terminology.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sectionTargets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sectionId: { type: Type.STRING },
                    targetScore: { type: Type.NUMBER },
                    weeklyPomodoros: { type: Type.INTEGER },
                  },
                  required: ['sectionId', 'targetScore', 'weeklyPomodoros'],
                },
              },
              totalWeeklyPomodoros: { type: Type.INTEGER },
              strategySummary: { type: Type.STRING },
              aiSuggested: { type: Type.BOOLEAN },
              disclaimer: { type: Type.STRING },
            },
            required: ['sectionTargets', 'totalWeeklyPomodoros', 'strategySummary', 'aiSuggested', 'disclaimer'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini model');
      }

      const parsed = JSON.parse(text);
      res.json({
        ...parsed,
        aiSuggested: true,
        disclaimer:
          locale === 'ar'
            ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق من الجهة الرسمية للاختبار'
            : 'AI suggested, verify with official testing authorities',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'GEMINI_INFERENCE_ERROR', message, fallback: true });
    }
  });

  // Feature (b): Study Plan Generator
  app.post('/api/gemini/study-plan', async (req: Request, res: Response): Promise<void> => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_KEY_UNAVAILABLE',
          message: 'Server-side Gemini API key is not configured in environment.',
          fallback: true,
        });
        return;
      }

      const {
        testId,
        testName,
        weeklyPomodoroTarget,
        sectionPriorities,
        locale = 'en',
      } = req.body;

      if (!testId || !Array.isArray(sectionPriorities)) {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'testId and sectionPriorities are required.' });
        return;
      }

      const systemInstruction =
        'Generate a weekly pomodoro task schedule based on section gaps and weekly capacity. Output actionable task items with estimated pomodoros and weekday distribution. Never invent exam dates. Output strict JSON with aiSuggested: true.';

      const prompt = JSON.stringify({
        testId,
        testName: testName || testId,
        weeklyPomodoroTarget: weeklyPomodoroTarget || 20,
        sectionPriorities,
        locale,
        instructions:
          locale === 'ar'
            ? 'اكتب عناوين المهام باللغة العربية الواضحة المحددة.'
            : 'Write actionable, concrete study task titles in English.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    sectionId: { type: Type.STRING },
                    estimatedPomodoros: { type: Type.INTEGER },
                    dayOfWeek: {
                      type: Type.STRING,
                      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                    },
                  },
                  required: ['title', 'sectionId', 'estimatedPomodoros', 'dayOfWeek'],
                },
              },
              aiSuggested: { type: Type.BOOLEAN },
              disclaimer: { type: Type.STRING },
            },
            required: ['tasks', 'aiSuggested', 'disclaimer'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini model');
      }

      const parsed = JSON.parse(text);
      res.json({
        ...parsed,
        aiSuggested: true,
        disclaimer:
          locale === 'ar'
            ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق من خطتك ومراجعتها'
            : 'AI suggested, verify with your study plan and official sources',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'GEMINI_INFERENCE_ERROR', message, fallback: true });
    }
  });

  // Feature (c): Post-Test Score Analysis
  app.post('/api/gemini/post-test-analysis', async (req: Request, res: Response): Promise<void> => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_KEY_UNAVAILABLE',
          message: 'Server-side Gemini API key is not configured in environment.',
          fallback: true,
        });
        return;
      }

      const {
        testId,
        testName,
        targetScore,
        actualScores,
        sectionTargets,
        sectionNames,
        locale = 'en',
      } = req.body;

      if (!testId || !actualScores || typeof targetScore !== 'number') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'testId, targetScore, and actualScores are required.' });
        return;
      }

      const systemInstruction =
        'Analyze completed mock/real test section scores against targets. Identify largest gaps and suggest compensatory study adjustments. Never invent official score scales or exam dates. Output strict JSON with aiSuggested: true.';

      const prompt = JSON.stringify({
        testId,
        testName: testName || testId,
        targetScore,
        actualScores,
        sectionTargets: sectionTargets || {},
        sectionNames: sectionNames || {},
        locale,
        instructions:
          locale === 'ar'
            ? 'اكتب التحليل والتوصيات باللغة العربية بأسلوب تحفيزي وإرشادي محكم.'
            : 'Write actionable diagnostic narrative and recommendations in English.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallGap: { type: Type.NUMBER },
              weakestSection: { type: Type.STRING },
              recommendedWeeklyShift: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sectionId: { type: Type.STRING },
                    deltaPomodoros: { type: Type.INTEGER },
                  },
                  required: ['sectionId', 'deltaPomodoros'],
                },
              },
              analysisNarrative: { type: Type.STRING },
              aiSuggested: { type: Type.BOOLEAN },
              disclaimer: { type: Type.STRING },
            },
            required: ['overallGap', 'weakestSection', 'recommendedWeeklyShift', 'analysisNarrative', 'aiSuggested', 'disclaimer'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini model');
      }

      const parsed = JSON.parse(text);
      res.json({
        ...parsed,
        aiSuggested: true,
        disclaimer:
          locale === 'ar'
            ? 'مقترح بالذكاء الاصطناعي، يرجى مراجعة النتائج والتحقق'
            : 'AI suggested, verify with your official score report',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'GEMINI_INFERENCE_ERROR', message, fallback: true });
    }
  });

  // Mount Vite middleware in development; serve built static dist in production
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Focus Plan M3E server running on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
