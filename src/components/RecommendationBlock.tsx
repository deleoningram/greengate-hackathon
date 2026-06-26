import { useState } from 'react';
import type { Recommendation } from '@/lib/ai-client';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RecommendationBlockProps {
  recommendations: Recommendation[];
}

// ---------------------------------------------------------------------------
// Priority badge colors
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-red-100', text: 'text-red-700', label: 'Высокий' },
  2: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Средний' },
  3: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Низкий' },
};

const AREA_LABELS: Record<string, string> = {
  cost: 'Затраты',
  data_standards: 'Стандартизация данных',
  confidentiality: 'Конфиденциальность',
  erp_integration: 'ERP-интеграция',
  trust: 'Доверие',
};

// ---------------------------------------------------------------------------
// Single recommendation card
// ---------------------------------------------------------------------------

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS[3];
  const areaLabel = AREA_LABELS[rec.area] ?? rec.area;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        {/* Priority badge */}
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${priority.bg} ${priority.text}`}
        >
          {priority.label}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm font-semibold text-gray-900">
          {rec.title}
        </span>

        {/* Area tag */}
        <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {areaLabel}
        </span>

        {/* Chevron */}
        <svg
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
          {/* Description */}
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Описание
            </h4>
            <p className="text-sm leading-relaxed text-gray-700">
              {rec.description}
            </p>
          </div>

          {/* Steps */}
          {rec.steps.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Шаги
              </h4>
              <ol className="list-inside list-decimal space-y-1.5">
                {rec.steps.map((step, i) => (
                  <li key={i} className="text-sm leading-relaxed text-gray-700">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Timeline & Expected impact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
              <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Сроки
              </span>
              <span className="mt-0.5 block text-sm font-medium text-emerald-900">
                {rec.timeline}
              </span>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
              <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Ожидаемый эффект
              </span>
              <span className="mt-0.5 block text-sm font-medium text-emerald-900">
                {rec.expected_impact}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecommendationBlock({ recommendations }: RecommendationBlockProps) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Нет доступных рекомендаций.
      </p>
    );
  }

  // Sort by priority (1 = highest first)
  const sorted = [...recommendations].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-3">
      {sorted.map((rec, i) => (
        <RecommendationCard key={`${rec.area}-${i}`} rec={rec} />
      ))}
    </div>
  );
}
