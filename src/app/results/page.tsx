'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScoreGauge } from '@/components/ScoreGauge';
import { BarrierChart } from '@/components/BarrierChart';
import type { ReadinessLevel, FactorScores } from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CO2Impact {
  volumeTons: number;
  materialType: string;
  coefficient: number;
  co2ReductionTons: number;
}

interface EconomicEffect {
  volumeTons: number;
  materialType: string;
  disposalCostPerTon: number;
  marketValuePerTon: number;
  savingsPerTon: number;
  totalSavings: number;
}

interface ResultsData {
  score: number;
  level: ReadinessLevel;
  levelLabel: string;
  factorScores: FactorScores;
  topBarriers: string[];
  co2Impact: CO2Impact;
  economicEffect: EconomicEffect;
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; data: ResultsData }
  | { status: 'error'; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MATERIAL_LABELS: Record<string, string> = {
  steel_scrap: 'Стальной лом',
  aluminum: 'Алюминий',
  plastic: 'Пластик',
  paper: 'Бумага',
};

function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTons(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResultsPage() {
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('greengate_results');
      if (!raw) {
        setState({
          status: 'error',
          message:
            'Результаты не найдены. Пожалуйста, пройдите опрос сначала.',
        });
        return;
      }

      const data = JSON.parse(raw) as ResultsData;

      // Basic validation
      if (
        typeof data.score !== 'number' ||
        !data.level ||
        !data.factorScores
      ) {
        throw new Error('Некорректный формат данных');
      }

      setState({ status: 'ready', data });
    } catch {
      setState({
        status: 'error',
        message:
          'Не удалось загрузить результаты. Пожалуйста, пройдите опрос заново.',
      });
    }
  }, []);

  // ---- Loading ----

  if (state.status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-base font-medium text-gray-700">
            Загрузка результатов...
          </p>
        </div>
      </main>
    );
  }

  // ---- Error / missing data ----

  if (state.status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-7 w-7 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-base text-gray-700">{state.message}</p>
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
          >
            Пройти опрос
          </Link>
        </div>
      </main>
    );
  }

  // ---- Ready ----

  const { data } = state;
  const materialLabel =
    MATERIAL_LABELS[data.co2Impact.materialType] ?? data.co2Impact.materialType;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Результаты оценки GreenGate
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Оценка готовности вашего предприятия к цифровому обмену вторсырьём
          </p>
        </div>

        {/* Score gauge */}
        <section className="flex justify-center">
          <ScoreGauge
            score={data.score}
            level={data.level}
            levelLabel={data.levelLabel}
          />
        </section>

        {/* Factor breakdown */}
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Разбивка по факторам
          </h2>
          <BarrierChart factorScores={data.factorScores} />
        </section>

        {/* Key barriers */}
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Ключевые барьеры
          </h2>
          {data.topBarriers.length > 0 ? (
            <ol className="list-inside list-decimal space-y-2">
              {data.topBarriers.map((barrier, i) => (
                <li key={i} className="text-sm leading-relaxed text-gray-700">
                  {barrier}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-500">
              Значимых барьеров не выявлено.
            </p>
          )}
        </section>

        {/* Impact cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* CO2 impact */}
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Снижение выбросов CO₂
            </h2>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-emerald-600">
                {formatTons(data.co2Impact.co2ReductionTons)} т
              </p>
              <p className="text-sm text-gray-500">
                CO₂-эквивалента в год
              </p>
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <p>
                  Материал: {materialLabel}
                </p>
                <p>
                  Объём: {formatTons(data.co2Impact.volumeTons)} т/год
                </p>
                <p>
                  Коэффициент LCA: {data.co2Impact.coefficient} т CO₂/т
                </p>
              </div>
            </div>
          </section>

          {/* Economic effect */}
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Экономический эффект
            </h2>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-emerald-600">
                {formatRub(data.economicEffect.totalSavings)}
              </p>
              <p className="text-sm text-gray-500">
                экономия в год
              </p>
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <p>
                  Экономия на тонну: {formatRub(data.economicEffect.savingsPerTon)}
                </p>
                <p>
                  Объём: {formatTons(data.economicEffect.volumeTons)} т/год
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled
            title="Рекомендации на основе ИИ будут доступны в следующей фазе проекта"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-300 px-6 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
            Получить рекомендации
          </button>

          <Link
            href="/assessment"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50 active:scale-[0.98]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Пройти заново
          </Link>
        </div>
      </div>
    </main>
  );
}
