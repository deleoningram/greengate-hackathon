import type { FactorScores, CO2ImpactResult, ReadinessLevel } from './scoring';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssessmentData {
  score: number;
  level: ReadinessLevel;
  factorScores: FactorScores;
  topBarriers: string[];
  industryType: string;
  enterpriseSize: string;
  co2Impact: CO2ImpactResult;
}

export interface Recommendation {
  area: string;
  title: string;
  description: string;
  steps: string[];
  timeline: string;
  priority: number;
  expected_impact: string;
}

export interface AIRecommendations {
  summary: string;
  readiness_level: 'low' | 'medium' | 'high';
  recommendations: Recommendation[];
  next_steps: string[];
  estimated_co2_reduction: string;
}

export interface AIClientOptions {
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are an expert ESG consultant specializing in digital transformation
of Russian manufacturing enterprises. You help companies assess their
readiness to participate in secondary raw materials exchange platforms.
Based on the assessment data provided, generate specific, actionable
recommendations in Russian. Structure your response as JSON with
the following format:
{
  "summary": "Brief overall assessment (2-3 sentences)",
  "readiness_level": "low|medium|high",
  "recommendations": [
    {
      "area": "barrier area name",
      "title": "recommendation title",
      "description": "detailed description",
      "steps": ["step 1", "step 2"],
      "timeline": "estimated timeline",
      "priority": 1-3,
      "expected_impact": "expected outcome"
    }
  ],
  "next_steps": ["immediate action 1", "immediate action 2"],
  "estimated_co2_reduction": "text summary of environmental impact"
}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUserPrompt(data: AssessmentData): string {
  const factorLines = Object.entries(data.factorScores)
    .map(([key, value]) => `  - ${key}: ${value}`)
    .join('\n');

  const barrierLines = data.topBarriers
    .map((b, i) => `  ${i + 1}. ${b}`)
    .join('\n');

  return `Assessment results for a Russian manufacturing enterprise:

Overall readiness score: ${data.score}/100
Readiness level: ${data.level}

Factor scores (0-1 scale):
${factorLines}

Industry type: ${data.industryType}
Enterprise size: ${data.enterpriseSize}

Top barriers identified:
${barrierLines || '  (none)'}

CO2 impact estimate:
  Material type: ${data.co2Impact.materialType}
  Annual volume: ${data.co2Impact.volumeTons} tons
  Potential CO2 reduction: ${data.co2Impact.co2ReductionTons} tons/year

Based on this data, generate a personalized action plan in Russian
that addresses the specific barriers and leverages the enterprise's
strengths. Focus on practical, implementable steps.`;
}

function extractJsonFromResponse(text: string): string {
  // Try to find a JSON block wrapped in ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Fallback: find the first { and last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call an OpenAI-compatible LLM API to generate personalised ESG
 * recommendations for a manufacturing enterprise.
 *
 * @param assessmentData — scored assessment results including factor
 *   breakdown, barriers, and CO₂ impact.
 * @param options — optional overrides for model, temperature, and timeout.
 * @returns Structured AIRecommendations parsed from the LLM response.
 */
export async function generateRecommendations(
  assessmentData: AssessmentData,
  options: AIClientOptions = {},
): Promise<AIRecommendations> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY environment variable is not set. ' +
        'Set it in .env.local or your deployment environment.',
    );
  }

  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(assessmentData) },
          ],
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `LLM API returned ${response.status} ${response.statusText}. ${errorBody}`.trim(),
      );
    }

    const json = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('LLM API returned an empty response.');
    }

    const parsed = JSON.parse(
      extractJsonFromResponse(rawContent),
    ) as AIRecommendations;

    // Basic validation
    if (!parsed.summary || !Array.isArray(parsed.recommendations)) {
      throw new Error('LLM response is missing required fields.');
    }

    return parsed;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        `LLM API request timed out after ${timeoutMs / 1000} seconds.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
