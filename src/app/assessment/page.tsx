'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import questionsData from '@/data/questions.json';
import { QuestionCard, type Question } from '@/components/QuestionCard';
import { ProgressBar } from '@/components/ProgressBar';
import { convertAnswers } from '@/lib/convertAnswers';

const questions = questionsData as Question[];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BLOCK_LABEL_MAP: Record<string, string> = {
  general: 'Общие сведения',
  digital_maturity: 'Цифровая зрелость',
  barriers: 'Барьеры',
  readiness: 'Готовность',
};

const blockLabels = questions.map((q) => BLOCK_LABEL_MAP[q.block] ?? q.block);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AssessmentPage() {
  const router = useRouter();

  const [screen, setScreen] = useState<'intro' | 'questions'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;

  // ---- Handlers ----

  const handleStart = useCallback(() => {
    setScreen('questions');
  }, []);

  const handleAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      setAnswers((prev: Record<string, string | string[]>) => ({
        ...prev,
        [questionId]: value,
      }));
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      handleSubmit();
      return;
    }
    setDirection('forward');
    setCurrentIndex((i) => i + 1);
  }, [isLastQuestion]);

  const handleBack = useCallback(() => {
    setDirection('back');
    setCurrentIndex((i) => i - 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = convertAnswers(answers);

      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? `Ошибка сервера (${response.status})`,
        );
      }

      const result = await response.json();
      sessionStorage.setItem('greengate_results', JSON.stringify(result));
      router.push('/results');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
      setSubmitting(false);
    }
  }, [answers, router]);

  const handleRetry = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // ---- Render: Intro ----

  if (screen === 'intro') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
        <div className="w-full max-w-xl animate-fadeIn text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            GreenGate
          </h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-wide text-emerald-600">
            Оценка готовности к цифровому обмену вторсырьём
          </p>

          <div className="mt-8 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              GreenGate — это инструмент оценки готовности промышленных
              предприятий к участию в цифровых платформах обмена вторичными
              ресурсами. Опрос из 20 вопросов займёт около 5 минут и поможет
              определить уровень цифровой зрелости, выявить ключевые барьеры и
              получить персональные рекомендации.
            </p>
            <p>
              Результаты основаны на эмпирическом исследовании 94 предприятий
              обрабатывающей промышленности и учитывают пять ключевых факторов:
              цифровую зрелость, наличие ESG-стратегии, экологическую
              сертификацию, размер предприятия и объём вторичных ресурсов.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-emerald-700 hover:shadow-xl active:scale-[0.98]"
          >
            Начать опрос
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </main>
    );
  }

  // ---- Render: Questions ----

  const currentQuestion = questions[currentIndex];
  const currentAnswer: string | string[] | null = answers[currentQuestion.id] ?? null;
  const hasAnswer =
    currentAnswer !== null &&
    (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 to-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Progress bar */}
        <ProgressBar
          current={currentIndex}
          total={totalQuestions}
          blockLabels={blockLabels}
        />

        {/* Question card with slide animation */}
        <div
          key={currentIndex}
          className={
            direction === 'forward'
              ? 'animate-slideInRight'
              : 'animate-slideInLeft'
          }
        >
          <div className="mt-8">
            <QuestionCard
              question={currentQuestion}
              currentAnswer={currentAnswer}
              onAnswer={handleAnswer}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirstQuestion || submitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
            Назад
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnswer || submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
          >
            {isLastQuestion ? 'Завершить' : 'Далее'}
            {!isLastQuestion && (
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="text-base font-medium text-gray-700">
              Рассчитываем результаты...
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
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
            <p className="text-center text-sm text-gray-700">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
