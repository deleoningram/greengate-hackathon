import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendations, type AssessmentData } from '@/lib/ai-client';
import recommendations from '@/data/recommendations.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecommendRequestBody {
  score: number;
  level: 'low' | 'medium' | 'high';
  factorScores: Record<string, number>;
  topBarriers: string[];
  industryType?: string;
  enterpriseSize?: string;
  co2Impact: {
    volumeTons: number;
    materialType: string;
    coefficient: number;
    co2ReductionTons: number;
  };
}

interface PreWrittenRecommendation {
  level: 'low' | 'medium' | 'high';
  barrier: string;
  title: string;
  description: string;
  steps: string[];
  timeline: string;
  priority: number;
  expected_effect: string;
}

// ---------------------------------------------------------------------------
// Barrier label → key mapping
// ---------------------------------------------------------------------------

const BARRIER_LABEL_TO_KEY: Record<string, string> = {
  'Затраты на подключение, интеграцию и обучение персонала': 'cost',
  'Отсутствие единого формата описания вторсырья': 'data_standards',
  'Опасения по поводу конфиденциальности производственных данных': 'confidentiality',
  'Сложность интеграции платформы с текущими ИС предприятия': 'erp_integration',
  'Недоверие к качеству вторсырья и добросовестности контрагентов': 'trust',
};

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
const rateLimitMap = new Map<string, number>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(sessionId);

  if (lastRequest !== undefined && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
    return false;
  }

  rateLimitMap.set(sessionId, now);

  // Clean up stale entries periodically
  if (rateLimitMap.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    rateLimitMap.forEach((timestamp, key) => {
      if (timestamp < cutoff) rateLimitMap.delete(key);
    });
  }

  return true;
}

// ---------------------------------------------------------------------------
// Fallback: match pre-written recommendations
// ---------------------------------------------------------------------------

function getFallbackRecommendations(
  level: 'low' | 'medium' | 'high',
  topBarriers: string[],
) {
  const typedRecs = recommendations as PreWrittenRecommendation[];

  // Map barrier labels to keys
  const barrierKeys = topBarriers
    .map((label) => BARRIER_LABEL_TO_KEY[label])
    .filter(Boolean);

  // Match: same level + barrier is in the top barriers list
  const matched = typedRecs.filter(
    (rec) => rec.level === level && barrierKeys.includes(rec.barrier),
  );

  // If no barrier-specific matches, return all for that level
  const selected = matched.length > 0
    ? matched
    : typedRecs.filter((rec) => rec.level === level);

  return {
    summary: `Рекомендации для предприятий с ${level === 'low' ? 'низким' : level === 'medium' ? 'средним' : 'высоким'} уровнем готовности.`,
    readiness_level: level,
    recommendations: selected.map((rec) => ({
      area: rec.barrier,
      title: rec.title,
      description: rec.description,
      steps: rec.steps,
      timeline: rec.timeline,
      priority: rec.priority,
      expected_impact: rec.expected_effect,
    })),
    next_steps: selected.flatMap((rec) => rec.steps.slice(0, 2)),
    estimated_co2_reduction: 'Расчёт CO₂-эффекта доступен после указания объёмов и типов вторсырья.',
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateBody(body: unknown): RecommendRequestBody {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Тело запроса должно быть JSON-объектом');
  }

  const data = body as Record<string, unknown>;

  if (typeof data.score !== 'number') {
    throw new ValidationError('Поле "score" обязательно и должно быть числом');
  }

  if (!['low', 'medium', 'high'].includes(data.level as string)) {
    throw new ValidationError(
      'Поле "level" обязательно и должно быть одним из: low, medium, high',
    );
  }

  if (!data.factorScores || typeof data.factorScores !== 'object') {
    throw new ValidationError('Поле "factorScores" обязательно и должно быть объектом');
  }

  if (!Array.isArray(data.topBarriers)) {
    throw new ValidationError('Поле "topBarriers" обязательно и должно быть массивом');
  }

  if (!data.co2Impact || typeof data.co2Impact !== 'object') {
    throw new ValidationError('Поле "co2Impact" обязательно и должно быть объектом');
  }

  return {
    score: data.score as number,
    level: data.level as 'low' | 'medium' | 'high',
    factorScores: data.factorScores as Record<string, number>,
    topBarriers: data.topBarriers as string[],
    industryType: (data.industryType as string) ?? 'manufacturing',
    enterpriseSize: (data.enterpriseSize as string) ?? 'medium',
    co2Impact: data.co2Impact as RecommendRequestBody['co2Impact'],
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // --- Rate limiting ---
  const sessionId =
    request.headers.get('x-session-id') ??
    request.headers.get('x-forwarded-for') ??
    'anonymous';

  if (!checkRateLimit(sessionId)) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Пожалуйста, подождите 10 секунд.' },
      {
        status: 429,
        headers: { 'Retry-After': '10' },
      },
    );
  }

  // --- Parse and validate ---
  let body: RecommendRequestBody;
  try {
    body = validateBody(await request.json());
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Некорректный JSON в теле запроса' },
        { status: 400 },
      );
    }
    throw error;
  }

  // --- Build AssessmentData for AI ---
  const assessmentData: AssessmentData = {
    score: body.score,
    level: body.level,
    factorScores: body.factorScores as unknown as AssessmentData['factorScores'],
    topBarriers: body.topBarriers,
    industryType: body.industryType ?? 'manufacturing',
    enterpriseSize: body.enterpriseSize ?? 'medium',
    co2Impact: body.co2Impact,
  };

  // --- Try AI, fall back to pre-written ---
  try {
    const aiResult = await generateRecommendations(assessmentData);
    return NextResponse.json(aiResult);
  } catch (aiError) {
    console.warn(
      'AI recommendation generation failed, using fallback:',
      (aiError as Error).message,
    );

    const fallback = getFallbackRecommendations(body.level, body.topBarriers);
    return NextResponse.json(fallback);
  }
}
