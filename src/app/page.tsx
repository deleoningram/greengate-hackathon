'use client';

import Link from 'next/link';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    question: 'Что такое GreenGate?',
    answer:
      'GreenGate — это AI-инструмент для оценки готовности производственных предприятий к участию в цифровых платформах обмена вторичным сырьём. Мы анализируем цифровую зрелость, наличие ESG-стратегии, экологические сертификаты и другие факторы, чтобы дать объективную картину и персональные рекомендации.',
  },
  {
    question: 'Сколько времени занимает оценка?',
    answer:
      'Анкета состоит из 4 блоков и заполняется в среднем за 5–7 минут. Результаты формируются мгновенно после отправки — вы сразу увидите итоговый балл, барьеры и персональные рекомендации.',
  },
  {
    question: 'На каких данных основана скоринговая модель?',
    answer:
      'Модель построена на эмпирическом исследовании 94 производственных предприятий (R² = 0.54). Ключевые предикторы: цифровая зрелость (вес 0.412), ESG-стратегия (0.284), сертификация ISO 14001 (0.198), размер предприятия (0.154) и объём вторсырья (0.112).',
  },
  {
    question: 'Нужно ли регистрироваться?',
    answer:
      'Нет, GreenGate работает без регистрации. Данные анкеты хранятся только в вашем браузере и не передаются на сервер. Вы можете пройти оценку несколько раз, чтобы сравнить сценарии.',
  },
];

// ---------------------------------------------------------------------------
// How it works steps
// ---------------------------------------------------------------------------

const STEPS = [
  {
    emoji: '📋',
    title: 'Заполните анкету',
    description:
      'Ответьте на 4 блока вопросов о цифровой зрелости, ESG-стратегии, экологических сертификатах и объёмах вторсырья. Это займёт 5–7 минут.',
  },
  {
    emoji: '🧠',
    title: 'AI анализирует',
    description:
      'Скоринговая модель на основе исследования 94 предприятий рассчитывает ваш индекс готовности, выявляет барьеры и подбирает рекомендации.',
  },
  {
    emoji: '📊',
    title: 'Получите roadmap',
    description:
      'Мгновенный результат: итоговый балл, диаграмма барьеров, персональные рекомендации с приоритетами и оценкой экономического эффекта.',
  },
];

// ---------------------------------------------------------------------------
// Benefits
// ---------------------------------------------------------------------------

const BENEFITS = [
  {
    title: 'Научная модель',
    description:
      'Скоринг основан на регрессионном анализе 94 предприятий. Каждый коэффициент статистически значим (p < 0.05).',
  },
  {
    title: 'Мгновенный результат',
    description:
      'Результаты формируются сразу после отправки анкеты. Никакого ожидания — только actionable insights.',
  },
  {
    title: 'Персональные рекомендации',
    description:
      'AI генерирует roadmap с приоритетами, сроками и ожидаемым эффектом под ваш профиль предприятия.',
  },
  {
    title: 'Без регистрации',
    description:
      'Данные остаются в вашем браузере. Никаких форм регистрации, email-рассылок и хранения на сервере.',
  },
];

// ---------------------------------------------------------------------------
// FAQ Accordion item
// ---------------------------------------------------------------------------

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="flex-1 text-sm font-semibold text-gray-900">
          {question}
        </span>

        {/* Chevron — same pattern as RecommendationBlock */}
        <svg
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
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

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ================================================================ */}
      {/* Hero                                                             */}
      {/* ================================================================ */}
      <section className="bg-gradient-to-b from-emerald-900 to-emerald-700 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center animate-fadeIn">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            GreenGate
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-emerald-100 sm:text-xl">
            AI-оценка готовности производственного предприятия к участию в
            цифровых платформах обмена вторичным сырьём
          </p>

          <Link
            href="/assessment"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-emerald-700 shadow-lg transition-all duration-200 hover:bg-emerald-50 hover:shadow-xl active:scale-[0.98]"
          >
            Начать оценку
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
          </Link>
        </div>
      </section>

      {/* ================================================================ */}
      {/* How It Works                                                     */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Как это работает
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md animate-fadeIn"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-3xl">{step.emoji}</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Benefits                                                         */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Возможности GreenGate
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAQ                                                              */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Часто задаваемые вопросы
          </h2>

          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
