import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center animate-fadeIn">
        <h1 className="text-4xl font-bold text-emerald-600 sm:text-5xl">
          GreenGate
        </h1>

        <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
          AI-оценка готовности предприятия к обмену вторсырьём
        </p>

        <Link
          href="/assessment"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-emerald-700 hover:shadow-xl active:scale-[0.98]"
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

        <Link
          href="/results"
          className="mt-2 text-sm font-medium text-gray-500 underline underline-offset-4 transition-colors hover:text-emerald-600"
        >
          Результаты
        </Link>
      </div>
    </main>
  );
}
