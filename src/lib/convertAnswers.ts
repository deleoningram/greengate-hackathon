import questionsData from '@/data/questions.json';
import type { Question } from '@/components/QuestionCard';

const questions = questionsData as Question[];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawAnswers = Record<string, string | string[]>;

type ApiAnswers = Record<string, number>;

export interface ConvertedResult {
  answers: ApiAnswers;
  volumeTons: number;
  materialType: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VOLUME_MAP: Record<string, number> = {
  lt_10t: 5,
  '10_100t': 55,
  '100_1000t': 550,
  gt_1000t: 1500,
};

const INDUSTRY_MATERIAL_MAP: Record<string, string> = {
  metallurgy: 'steel_scrap',
  chemical: 'plastic',
  machinery: 'steel_scrap',
  woodworking: 'paper',
  food: 'plastic',
  other: 'steel_scrap',
};

// ---------------------------------------------------------------------------
// Converter
// ---------------------------------------------------------------------------

/**
 * Convert raw UI answers (Record<string, number | string[]>) into the
 * shape expected by POST /api/score: { answers: Record<string, number>,
 * volumeTons: number, materialType: string }.
 *
 * - single_choice / scale_1_5: looks up the option's score directly.
 * - multi_choice: averages the scores of all selected options.
 * - volumeTons is derived from q3 (volume bracket → midpoint in tons).
 * - materialType is derived from q1 (industry → material category).
 */
export function convertAnswers(rawAnswers: RawAnswers): ConvertedResult {
  const answers: ApiAnswers = {};

  for (const question of questions) {
    const raw = rawAnswers[question.id];
    if (raw === undefined || raw === null) continue;

    if (question.type === 'multi_choice') {
      const selected = Array.isArray(raw) ? raw : [];
      if (selected.length === 0) continue;

      const scores = selected.map((val) => {
        const option = question.options.find((o) => o.value === val);
        return option?.score ?? 0;
      });
      answers[question.id] =
        scores.reduce((a, b) => a + b, 0) / scores.length;
    } else if (typeof raw === 'string') {
      const option = question.options.find((o) => o.value === raw);
      answers[question.id] = option?.score ?? 0;
    }
  }

  // Derive volumeTons from q3
  const q3Answer = rawAnswers.q3;
  const volumeTons =
    typeof q3Answer === 'string' ? (VOLUME_MAP[q3Answer] ?? 5) : 5;

  // Derive materialType from q1
  const q1Answer = rawAnswers.q1;
  const materialType =
    typeof q1Answer === 'string'
      ? (INDUSTRY_MATERIAL_MAP[q1Answer] ?? 'steel_scrap')
      : 'steel_scrap';

  return { answers, volumeTons, materialType };
}
