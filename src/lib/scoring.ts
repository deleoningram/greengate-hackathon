import weights from '@/data/weights.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReadinessLevel = 'low' | 'medium' | 'high';

export interface FactorScores {
  digital_maturity: number;
  esg_strategy: number;
  certification: number;
  enterprise_size: number;
  secondary_volume: number;
}

export interface ReadinessResult {
  totalScore: number;
  level: ReadinessLevel;
  levelLabel: string;
  factorScores: FactorScores;
  topBarriers: string[];
}

export interface CO2ImpactResult {
  volumeTons: number;
  materialType: string;
  coefficient: number;
  co2ReductionTons: number;
}

export interface EconomicEffectResult {
  volumeTons: number;
  materialType: string;
  disposalCostPerTon: number;
  marketValuePerTon: number;
  savingsPerTon: number;
  totalSavings: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LCA_COEFFICIENTS: Record<string, number> = {
  steel_scrap: 1.6,
  aluminum: 9.1,
  plastic: 1.4,
  paper: 0.9,
};

const DISPOSAL_COSTS: Record<string, number> = {
  steel_scrap: 2000,
  aluminum: 2000,
  plastic: 3000,
  paper: 1500,
};

const MARKET_VALUES: Record<string, number> = {
  steel_scrap: 15000,
  aluminum: 80000,
  plastic: 15000,
  paper: 5000,
};

const BARRIER_LABELS: Record<string, string> = {
  q12: 'Затраты на подключение, интеграцию и обучение персонала',
  q13: 'Отсутствие единого формата описания вторсырья',
  q14: 'Опасения по поводу конфиденциальности производственных данных',
  q15: 'Сложность интеграции платформы с текущими ИС предприятия',
  q16: 'Недоверие к качеству вторсырья и добросовестности контрагентов',
};

const DIGITAL_MATURITY_IDS = ['q6', 'q7', 'q8', 'q9', 'q10', 'q11'];
const BARRIER_IDS = ['q12', 'q13', 'q14', 'q15', 'q16'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function averageScore(ids: string[], answers: Record<string, number>): number {
  const scores = ids.map((id) => answers[id] ?? 0);
  const sum = scores.reduce((a, b) => a + b, 0);
  return scores.length > 0 ? sum / scores.length : 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the readiness score from questionnaire answers.
 *
 * @param answers — Record mapping question IDs (q1–q20) to their numeric
 *   scores (already normalised 0–1 from questions.json).
 * @returns ReadinessResult with totalScore (0–100), level, factor breakdown,
 *   and top barriers.
 */
export function calculateReadinessScore(
  answers: Record<string, number>,
): ReadinessResult {
  const factorScores: FactorScores = {
    digital_maturity: averageScore(DIGITAL_MATURITY_IDS, answers),
    esg_strategy: answers.q17 ?? 0,
    certification: answers.q18 ?? 0,
    enterprise_size: answers.q2 ?? 0,
    secondary_volume: answers.q3 ?? 0,
  };

  // Regression formula: intercept + Σ(beta × factor)
  let rawScore = weights.intercept;
  for (const [key, factor] of Object.entries(weights.factors)) {
    rawScore += factor.beta * (factorScores[key as keyof FactorScores] ?? 0);
  }

  // Normalise to 0–100.  The raw regression score ranges roughly 0.45–1.45.
  // Map: raw ∈ [intercept, intercept + Σbeta] → [0, 100]
  const maxBeta = Object.values(weights.factors).reduce(
    (sum, f) => sum + f.beta,
    0,
  );
  const minRaw = weights.intercept;
  const maxRaw = weights.intercept + maxBeta;
  const totalScore = Math.round(
    ((rawScore - minRaw) / (maxRaw - minRaw)) * 100,
  );

  // Level classification using thresholds from weights.json
  let level: ReadinessLevel;
  let levelLabel: string;
  if (rawScore < weights.thresholds.low.max) {
    level = 'low';
    levelLabel = weights.thresholds.low.label;
  } else if (rawScore < weights.thresholds.high.min) {
    level = 'medium';
    levelLabel = weights.thresholds.medium.label;
  } else {
    level = 'high';
    levelLabel = weights.thresholds.high.label;
  }

  // Top barriers: q12–q16 with score ≥ 0.6, sorted descending, top 3
  const barriers = BARRIER_IDS
    .filter((id) => (answers[id] ?? 0) >= 0.6)
    .sort((a, b) => (answers[b] ?? 0) - (answers[a] ?? 0))
    .slice(0, 3)
    .map((id) => BARRIER_LABELS[id]);

  return { totalScore, level, levelLabel, factorScores, topBarriers: barriers };
}

/**
 * Estimate CO₂ reduction from recycling instead of primary production.
 *
 * @param volumeTons — annual volume of secondary resources in metric tons.
 * @param materialType — one of 'steel_scrap', 'aluminum', 'plastic', 'paper'.
 * @returns CO2ImpactResult with the avoided emissions in tons of CO₂.
 */
export function calculateCO2Impact(
  volumeTons: number,
  materialType: string,
): CO2ImpactResult {
  const coefficient = LCA_COEFFICIENTS[materialType] ?? 0;
  return {
    volumeTons,
    materialType,
    coefficient,
    co2ReductionTons: Math.round(volumeTons * coefficient * 100) / 100,
  };
}

/**
 * Estimate economic savings from selling secondary resources instead of
 * paying for landfill disposal.
 *
 * @param volumeTons — annual volume of secondary resources in metric tons.
 * @param materialType — one of 'steel_scrap', 'aluminum', 'plastic', 'paper'.
 * @returns EconomicEffectResult with per-ton and total savings in RUB.
 */
export function calculateEconomicEffect(
  volumeTons: number,
  materialType: string,
): EconomicEffectResult {
  const disposalCostPerTon = DISPOSAL_COSTS[materialType] ?? 0;
  const marketValuePerTon = MARKET_VALUES[materialType] ?? 0;
  const savingsPerTon = disposalCostPerTon - marketValuePerTon;
  return {
    volumeTons,
    materialType,
    disposalCostPerTon,
    marketValuePerTon,
    savingsPerTon,
    totalSavings: Math.round(savingsPerTon * volumeTons * 100) / 100,
  };
}
