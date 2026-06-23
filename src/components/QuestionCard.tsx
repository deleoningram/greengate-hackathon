import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestionOption {
  value: string;
  label: string;
  score: number;
}

export interface Question {
  id: string;
  block: string;
  text: string;
  type: 'single_choice' | 'multi_choice' | 'scale_1_5';
  options: QuestionOption[];
  weight_factor: string;
  tooltip: string;
}

export interface QuestionCardProps {
  question: Question;
  currentAnswer: string | string[] | null;
  onAnswer: (questionId: string, value: string | string[]) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSelected(
  currentAnswer: string | string[] | null,
  optionValue: string,
  type: Question['type'],
): boolean {
  if (currentAnswer === null || currentAnswer === undefined) return false;
  if (type === 'multi_choice') {
    return Array.isArray(currentAnswer) && currentAnswer.includes(optionValue);
  }
  return currentAnswer === optionValue;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuestionCard({ question, currentAnswer, onAnswer }: QuestionCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSingleChoice = (value: string) => {
    onAnswer(question.id, value);
  };

  const handleMultiChoice = (value: string) => {
    const current = Array.isArray(currentAnswer) ? currentAnswer : [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onAnswer(question.id, next);
  };

  const handleScale = (value: string) => {
    onAnswer(question.id, value);
  };

  const cardBase =
    'relative flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ease-in-out';
  const cardDefault = 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md';
  const cardSelected = 'border-emerald-500 bg-emerald-50 shadow-md';

  const radioBase =
    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200';
  const radioDefault = 'border-gray-300';
  const radioSelected = 'border-emerald-500 bg-emerald-500';

  const checkboxBase =
    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200';
  const checkboxDefault = 'border-gray-300';
  const checkboxSelected = 'border-emerald-500 bg-emerald-500';

  const scaleBtnBase =
    'flex-1 min-w-0 rounded-xl border-2 py-3 px-2 text-center text-sm font-medium transition-all duration-200 ease-in-out';
  const scaleBtnDefault = 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50';
  const scaleBtnSelected = 'border-emerald-500 bg-emerald-500 text-white shadow-md';

  return (
    <div className="w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-4 flex items-start gap-2">
        <h3 className="text-lg font-semibold text-gray-900 leading-snug">
          {question.text}
        </h3>

        {/* Tooltip icon */}
        <div className="relative shrink-0">
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-300 transition-colors"
            onClick={() => setShowTooltip(!showTooltip)}
            onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
            aria-label="Показать подсказку"
          >
            ?
          </button>
          {showTooltip && (
            <div className="absolute left-0 top-7 z-10 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg">
              {question.tooltip}
            </div>
          )}
        </div>
      </div>

      {/* single_choice */}
      {question.type === 'single_choice' && (
        <div className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2">
          {question.options.map((option) => {
            const selected = isSelected(currentAnswer, option.value, 'single_choice');
            return (
              <label
                key={option.value}
                className={`${cardBase} ${selected ? cardSelected : cardDefault}`}
              >
                <div className={`${radioBase} ${selected ? radioSelected : radioDefault}`}>
                  {selected && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={selected}
                  onChange={() => handleSingleChoice(option.value)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-800 leading-snug">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* multi_choice */}
      {question.type === 'multi_choice' && (
        <div className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2">
          {question.options.map((option) => {
            const selected = isSelected(currentAnswer, option.value, 'multi_choice');
            return (
              <label
                key={option.value}
                className={`${cardBase} ${selected ? cardSelected : cardDefault}`}
              >
                <div className={`${checkboxBase} ${selected ? checkboxSelected : checkboxDefault}`}>
                  {selected && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  value={option.value}
                  checked={selected}
                  onChange={() => handleMultiChoice(option.value)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-800 leading-snug">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* scale_1_5 */}
      {question.type === 'scale_1_5' && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => {
            const selected = isSelected(currentAnswer, option.value, 'scale_1_5');
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleScale(option.value)}
                className={`${scaleBtnBase} ${selected ? scaleBtnSelected : scaleBtnDefault}`}
              >
                <div className="text-xs text-current opacity-70">{option.value}</div>
                <div className="mt-1 text-xs leading-tight">{option.label}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
