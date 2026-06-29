'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { KPICard, type KpiDefinition } from '@/components/KPICard';
import { calculateCO2Impact } from '@/lib/scoring';
import kpiDefinitions from '@/data/kpi-definitions.json';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const MATERIAL_LABELS: Record<string, string> = {
  steel_scrap: 'Стальной лом',
  aluminum: 'Алюминий',
  plastic: 'Пластик',
  paper: 'Бумага',
};

const allKpis = kpiDefinitions as KpiDefinition[];

const platformKpis = allKpis.filter((k) => k.category === 'platform');
const esgKpis = allKpis.filter((k) => k.category === 'esg');
const economicKpis = allKpis.filter((k) => k.category === 'economic');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTons(value: number): string {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)} т`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [volumePerMonth, setVolumePerMonth] = useState(100);
  const [materialType, setMaterialType] = useState('steel_scrap');
  const [transactionsPerMonth, setTransactionsPerMonth] = useState(10);
  const [showInput, setShowInput] = useState(true);

  // ---- Derived computations ----

  const derived = useMemo(() => {
    const annualVolume = volumePerMonth * 12;

    const co2Impact = calculateCO2Impact(annualVolume, materialType);
    const disposalCostPerTon = DISPOSAL_COSTS[materialType] ?? 0;
    const marketValuePerTon = MARKET_VALUES[materialType] ?? 0;

    const disposalSavings = disposalCostPerTon * annualVolume;
    const totalEconomicEffect =
      disposalCostPerTon * annualVolume + marketValuePerTon * annualVolume;

    const avgDealSize =
      transactionsPerMonth > 0
        ? Math.round((volumePerMonth / transactionsPerMonth) * 10) / 10
        : 0;

    // Simulated readiness score using moderate defaults for non-volume
    // factors.  This is an approximation without full questionnaire answers.
    const volumeScore = Math.min(annualVolume / 20000, 1);
    const rawScore =
      0.452 +
      0.412 * 0.5 +
      0.284 * 0.5 +
      0.198 * 0.5 +
      0.154 * 0.5 +
      0.112 * volumeScore;
    const readinessScore = Math.round(((rawScore - 0.452) / 1.16) * 100);

    // KPI values map
    const kpiValues: Record<string, number> = {
      kpi_lcr: Math.round(35 + (transactionsPerMonth % 15)),
      kpi_ttd: Math.max(10, 45 - transactionsPerMonth),
      kpi_active_participants: Math.max(1, Math.round(transactionsPerMonth * 1.8)),
      kpi_avg_deal_size: avgDealSize,
      kpi_secondary_volume: annualVolume,
      kpi_co2_reduction: co2Impact.co2ReductionTons,
      kpi_landfill_diversion: annualVolume,
      kpi_scope3_share: 25,
      kpi_disposal_savings: disposalSavings,
      kpi_total_economic_effect: totalEconomicEffect,
    };

    return {
      annualVolume,
      co2ReductionTons: co2Impact.co2ReductionTons,
      totalEconomicEffect,
      readinessScore,
      kpiValues,
    };
  }, [volumePerMonth, materialType, transactionsPerMonth]);

  // ---- Render ----

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Мониторинг ESG-эффективности
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ключевые показатели платформы, ESG и экономики
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            На главную
          </Link>
        </div>

        {/* Summary card */}
        <div className="mb-8 rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Сводка
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
            {/* CO₂ */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Снижение CO₂
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatTons(derived.co2ReductionTons)}
                </p>
              </div>
            </div>

            {/* Economic */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Экономический эффект
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatRub(derived.totalEconomicEffect)}
                </p>
              </div>
            </div>

            {/* Readiness */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Готовность
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {derived.readinessScore} / 100
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data input section */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-900">
              Входные данные предприятия
            </span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${showInput ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showInput && (
            <div className="border-t border-gray-100 px-6 pb-6 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Volume */}
                <div>
                  <label
                    htmlFor="volume"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    Объём вторсырья (т / месяц)
                  </label>
                  <input
                    id="volume"
                    type="number"
                    min={0}
                    value={volumePerMonth}
                    onChange={(e) =>
                      setVolumePerMonth(Number(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Material type */}
                <div>
                  <label
                    htmlFor="material"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    Тип материала
                  </label>
                  <select
                    id="material"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {Object.entries(MATERIAL_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transactions */}
                <div>
                  <label
                    htmlFor="transactions"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    Сделок в месяц
                  </label>
                  <input
                    id="transactions"
                    type="number"
                    min={0}
                    value={transactionsPerMonth}
                    onChange={(e) =>
                      setTransactionsPerMonth(Number(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-400">
                Все KPI пересчитываются автоматически при изменении входных
                данных. Показатели платформы — расчётные (MVP).
              </p>
            </div>
          )}
        </div>

        {/* KPI Sections */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Платформенные
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformKpis.map((kpi) => (
              <KPICard
                key={kpi.id}
                kpiDefinition={kpi}
                currentValue={derived.kpiValues[kpi.id] ?? 0}
              />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">ESG</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {esgKpis.map((kpi) => (
              <KPICard
                key={kpi.id}
                kpiDefinition={kpi}
                currentValue={derived.kpiValues[kpi.id] ?? 0}
              />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Экономические
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {economicKpis.map((kpi) => (
              <KPICard
                key={kpi.id}
                kpiDefinition={kpi}
                currentValue={derived.kpiValues[kpi.id] ?? 0}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
