// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KpiDefinition {
  id: string;
  name: string;
  category: string;
  unit: string;
  formula: string;
  target_pilot: number | string;
  target_scale: number | string;
  visualization: 'gauge' | 'number' | 'bar';
  description: string;
  coefficients?: Record<string, number>;
}

export interface KPICardProps {
  kpiDefinition: KpiDefinition;
  currentValue: number;
  previousValue?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StatusColors {
  stroke: string;
  text: string;
  bg: string;
  bar: string;
}

function getTargetValue(target: number | string): number | null {
  if (typeof target === 'number') return target;
  return null;
}

function getStatusColor(current: number, target: number | null): StatusColors {
  if (target === null) {
    return {
      stroke: 'stroke-gray-400',
      text: 'text-gray-600',
      bg: 'bg-gray-50',
      bar: 'bg-gray-400',
    };
  }

  const ratio = current / target;

  if (ratio >= 1) {
    return {
      stroke: 'stroke-emerald-500',
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      bar: 'bg-emerald-500',
    };
  }

  if (ratio >= 0.8) {
    return {
      stroke: 'stroke-yellow-500',
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      bar: 'bg-yellow-500',
    };
  }

  return {
    stroke: 'stroke-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
    bar: 'bg-red-500',
  };
}

function getDelta(
  current: number,
  previous: number,
): { symbol: string; color: string } {
  if (current > previous) return { symbol: '↑', color: 'text-emerald-500' };
  if (current < previous) return { symbol: '↓', color: 'text-red-500' };
  return { symbol: '→', color: 'text-gray-400' };
}

function formatValue(value: number, unit: string): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} млн ${unit}`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} тыс. ${unit}`;
  }
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

// ---------------------------------------------------------------------------
// Gauge visualization (circular progress — for percentages)
// ---------------------------------------------------------------------------

function GaugeVisualization({
  current,
  target,
  unit,
  colors,
}: {
  current: number;
  target: number | null;
  unit: string;
  colors: StatusColors;
}) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;

  const percentage = target ? Math.min(current / target, 1) : 0;
  const dashOffset = arcLength - percentage * arcLength;
  const center = size / 2;

  return (
    <div className="flex justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${current}${unit} — ${target ? Math.round(percentage * 100) + '% от цели' : 'цель не задана'}`}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference * 0.375}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
        />

        {/* Colored arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference * 0.375 + dashOffset}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />

        {/* Percentage */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-900"
          style={{ fontSize: '1.125rem', fontWeight: 700 }}
        >
          {target ? `${Math.round(percentage * 100)}%` : '—'}
        </text>

        {/* Unit */}
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-500"
          style={{ fontSize: '0.625rem' }}
        >
          {unit}
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Number visualization (large number — for counts / volumes)
// ---------------------------------------------------------------------------

function NumberVisualization({
  current,
  unit,
  colors,
}: {
  current: number;
  unit: string;
  colors: StatusColors;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg px-3 py-3 ${colors.bg}`}
    >
      <span className={`text-3xl font-bold leading-none ${colors.text}`}>
        {current.toLocaleString('ru-RU')}
      </span>
      <span className={`mt-1 text-xs ${colors.text} opacity-70`}>{unit}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar visualization (progress bar — for trends / volumes with target)
// ---------------------------------------------------------------------------

function BarVisualization({
  current,
  target,
  unit,
  colors,
}: {
  current: number;
  target: number | null;
  unit: string;
  colors: StatusColors;
}) {
  const percentage = target ? Math.min((current / target) * 100, 100) : 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className={`text-2xl font-bold ${colors.text}`}>
          {current.toLocaleString('ru-RU')}
        </span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {target !== null && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>Цель: {target.toLocaleString('ru-RU')} {unit}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KPICard({
  kpiDefinition,
  currentValue,
  previousValue,
}: KPICardProps) {
  const target = getTargetValue(kpiDefinition.target_pilot);
  const colors = getStatusColor(currentValue, target);
  const delta =
    previousValue !== undefined ? getDelta(currentValue, previousValue) : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header: name + delta arrow */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight text-gray-900">
          {kpiDefinition.name}
        </h3>
        {delta && (
          <span
            className={`flex-shrink-0 text-lg font-bold leading-none ${delta.color}`}
          >
            {delta.symbol}
          </span>
        )}
      </div>

      {/* Visualization */}
      <div className="mb-3">
        {kpiDefinition.visualization === 'gauge' && (
          <GaugeVisualization
            current={currentValue}
            target={target}
            unit={kpiDefinition.unit}
            colors={colors}
          />
        )}
        {kpiDefinition.visualization === 'number' && (
          <NumberVisualization
            current={currentValue}
            unit={kpiDefinition.unit}
            colors={colors}
          />
        )}
        {kpiDefinition.visualization === 'bar' && (
          <BarVisualization
            current={currentValue}
            target={target}
            unit={kpiDefinition.unit}
            colors={colors}
          />
        )}
      </div>

      {/* Footer: current value + target */}
      <div className="flex items-baseline justify-between border-t border-gray-100 pt-2.5">
        <div>
          <span className="text-xs text-gray-500">Текущее</span>
          <p className="text-sm font-medium text-gray-900">
            {formatValue(currentValue, kpiDefinition.unit)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">Цель (пилот)</span>
          <p className="text-sm font-medium text-gray-900">
            {typeof kpiDefinition.target_pilot === 'number'
              ? formatValue(
                  kpiDefinition.target_pilot as number,
                  kpiDefinition.unit,
                )
              : kpiDefinition.target_pilot}
          </p>
        </div>
      </div>

      {/* Previous period delta detail */}
      {previousValue !== undefined && delta && (
        <div className="mt-2 text-xs text-gray-500">
          Предыдущий период: {formatValue(previousValue, kpiDefinition.unit)}{' '}
          <span className={delta.color}>
            ({delta.symbol}
            {Math.abs(
              ((currentValue - previousValue) / previousValue) * 100,
            ).toFixed(1)}
            %)
          </span>
        </div>
      )}
    </div>
  );
}
