import { NextRequest, NextResponse } from 'next/server';
import {
  calculateReadinessScore,
  calculateCO2Impact,
  calculateEconomicEffect,
} from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreRequestBody {
  answers: Record<string, number>;
  volumeTons: number;
  materialType: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_MATERIAL_TYPES = ['steel_scrap', 'aluminum', 'plastic', 'paper'];

function validateBody(body: unknown): ScoreRequestBody {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Тело запроса должно быть JSON-объектом');
  }

  const { answers, volumeTons, materialType } = body as Record<string, unknown>;

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new ValidationError(
      'Поле "answers" обязательно и должно быть объектом вида { "q1": 0.5, ... }',
    );
  }

  for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
    if (typeof value !== 'number') {
      throw new ValidationError(
        `Значение ответа "${key}" должно быть числом, получено ${typeof value}`,
      );
    }
    if (value < 0 || value > 1) {
      throw new ValidationError(
        `Значение ответа "${key}" должно быть в диапазоне 0–1, получено ${value}`,
      );
    }
  }

  if (volumeTons === undefined || volumeTons === null) {
    throw new ValidationError('Поле "volumeTons" обязательно');
  }
  if (typeof volumeTons !== 'number' || !Number.isFinite(volumeTons)) {
    throw new ValidationError('Поле "volumeTons" должно быть числом');
  }
  if (volumeTons <= 0) {
    throw new ValidationError('Поле "volumeTons" должно быть положительным числом');
  }

  if (!materialType || typeof materialType !== 'string') {
    throw new ValidationError('Поле "materialType" обязательно и должно быть строкой');
  }
  if (!VALID_MATERIAL_TYPES.includes(materialType)) {
    throw new ValidationError(
      `Недопустимый materialType "${materialType}". Допустимые значения: ${VALID_MATERIAL_TYPES.join(', ')}`,
    );
  }

  return { answers: answers as Record<string, number>, volumeTons, materialType };
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, volumeTons, materialType } = validateBody(body);

    const readiness = calculateReadinessScore(answers);
    const co2Impact = calculateCO2Impact(volumeTons, materialType);
    const economicEffect = calculateEconomicEffect(volumeTons, materialType);

    return NextResponse.json({
      score: readiness.totalScore,
      level: readiness.level,
      levelLabel: readiness.levelLabel,
      factorScores: readiness.factorScores,
      topBarriers: readiness.topBarriers,
      co2Impact,
      economicEffect,
    });
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

    console.error('Unexpected error in /api/score:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
