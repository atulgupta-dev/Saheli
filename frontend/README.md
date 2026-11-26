# Frontend owner — Member 4

Scaffold a Next.js TypeScript + Tailwind mobile-first PWA here, on `feature/frontend-experience` only.

User flow: login -> onboarding -> stage selection -> stage dashboard. Three stages menstrual, pregnancy, postpartum. Changing stage in Settings must work and preserve existing data. Pregnancy is the live MVP; other stages' incomplete capabilities must be clearly marked Coming Soon.

Use centralized stage enum and services from `shared/api-contracts.md`. Include Hindi/English language options and a text fallback if speech permissions are unavailable.
