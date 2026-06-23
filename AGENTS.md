# GreenGate — AI ESG Readiness Assessment Tool
## Project Overview
GreenGate helps manufacturing enterprises assess their readiness
to participate in digital secondary raw materials exchange platforms.
It evaluates digital maturity, identifies barriers, and provides
an AI-powered roadmap.
## Tech Stack
- Next.js 14 (App Router), TypeScript strict, React 18
- Tailwind CSS (utility-first, no custom CSS)
- Recharts for data visualization
- JSON files for data storage (no database in MVP)
## Code Style
- Functional components with hooks only
- Named exports for components, default export for pages
- Tailwind classes directly in JSX, no CSS modules
- File naming: PascalCase for components, camelCase for utilities
- All text content in Russian (UI), prompts in English (AI)
## Business Logic
Scoring model based on empirical research (n=94 enterprises):
- Digital Maturity (weight 0.412) — strongest predictor
- ESG Strategy presence (weight 0.284)
- Environmental certification ISO 14001 (weight 0.198)
- Enterprise size (weight 0.154)
- Secondary resources volume (weight 0.112)
Total R² = 0.54
## Scoring Formula
ReadinessScore = 0.412×DigitalMaturity + 0.284×ESGStrategy
+ 0.198×Certification + 0.154×Size + 0.112×Volume + 0.452
## Key Files
- src/data/questions.json — questionnaire content
- src/data/weights.json — scoring model weights
- src/data/recommendations.json — AI recommendation templates
- src/lib/scoring.ts — scoring algorithm
## Current State (Phase 2)
- Project scaffold: Next.js 14, App Router, Tailwind, Recharts
- Data files ready: questions.json, weights.json
- Scoring engine: src/lib/scoring.ts (calculateReadinessScore,
  calculateCO2Impact, calculateEconomicEffect)
- API endpoint: src/app/api/score/route.ts (POST)
- Assessment page: src/app/assessment/page.tsx (full questionnaire flow)
- Results page: src/app/results/page.tsx (score gauge, barrier chart)
- Components: QuestionCard, ProgressBar, ScoreGauge, BarrierChart
## Decisions Made
- sessionStorage used to pass score data between /assessment and /results
- Green/emerald color scheme (#059669 primary)
- Questions grouped in 4 blocks: general, digital_maturity, barriers, readiness
- Score normalization: all inputs mapped to 0-1 before applying weights