import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FactorScores } from '@/lib/scoring';
import weights from '@/data/weights.json';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BarrierChartProps {
  factorScores: FactorScores;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ChartDatum {
  key: string;
  label: string;
  score: number;
}

function buildChartData(factorScores: FactorScores): ChartDatum[] {
  const factorEntries = Object.entries(weights.factors) as [
    string,
    { beta: number; label: string },
  ][];

  return factorEntries.map(([key, factor]) => ({
    key,
    label: factor.label,
    score: Math.round((factorScores[key as keyof FactorScores] ?? 0) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BarrierChart({ factorScores }: BarrierChartProps) {
  const data = buildChartData(factorScores);

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">Нет данных для отображения.</p>
    );
  }

  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 13, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={150}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Оценка']}
            contentStyle={{
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '0.875rem',
            }}
          />
          <Bar
            dataKey="score"
            radius={[0, 6, 6, 0]}
            barSize={28}
            animationDuration={800}
          >
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={
                  entry.score >= 70
                    ? '#10b981'
                    : entry.score >= 40
                      ? '#eab308'
                      : '#ef4444'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
