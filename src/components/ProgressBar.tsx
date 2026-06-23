export interface ProgressBarProps {
  current: number;
  total: number;
  blockLabels: string[];
}

export function ProgressBar({ current, total, blockLabels }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const currentBlockLabel = blockLabels[current] ?? '';

  return (
    <div className="w-full">
      {/* Step indicator and block label */}
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium text-gray-700">
          Вопрос {current + 1} из {total}
        </span>
        {currentBlockLabel && (
          <span className="inline-block max-w-full truncate rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-800 sm:max-w-[50%]">
            {currentBlockLabel}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Percentage label */}
      <div className="mt-1 text-right text-xs text-gray-500">
        {percentage}%
      </div>
    </div>
  );
}
