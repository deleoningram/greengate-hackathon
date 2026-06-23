import type { ReadinessLevel } from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScoreGaugeProps {
  score: number;
  level: ReadinessLevel;
  levelLabel: string;
}

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<ReadinessLevel, { stroke: string; text: string; bg: string }> = {
  high: {
    stroke: 'stroke-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  medium: {
    stroke: 'stroke-yellow-500',
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  low: {
    stroke: 'stroke-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScoreGauge({ score, level, levelLabel }: ScoreGaugeProps) {
  const colors = COLOR_MAP[level];

  // SVG arc geometry
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc spans 270° (from 135° to 405°), leaving bottom 90° empty
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength - (score / 100) * arcLength;

  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
        role="img"
        aria-label={`Оценка готовности: ${score} из 100 — ${levelLabel}`}
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
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />

        {/* Score number */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-900 text-4xl font-bold"
          style={{ fontSize: '2.25rem' }}
        >
          {score}
        </text>

        {/* /100 label */}
        <text
          x={center}
          y={center + 22}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-500"
          style={{ fontSize: '0.75rem' }}
        >
          из 100
        </text>
      </svg>

      {/* Level label below the gauge */}
      <span
        className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${colors.bg} ${colors.text}`}
      >
        {levelLabel}
      </span>
    </div>
  );
}
