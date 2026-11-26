# Saheli AI

**A mobile-first reproductive health companion** for Menstrual, Pregnancy, and Postpartum journeys.

## MVP: one deeply integrated Pregnancy experience
- **Shared:** Firebase login, onboarding, user profile, stage selection & stage switching in Settings, consent, bilingual UI.
- **Pregnancy (live):** Gemini conversational companion with memory, symptom journal and reviewed warning-sign escalation, source-grounded ultrasound explanation, week-by-week dashboard.
- **Menstrual + Postpartum:** fully navigable frontend shells; clearly mark features without real backend as **Coming Soon**. Do not fake AI features.
- **Demo:** use only synthetic patient data and test reports. This is educational support, **not** a licensed doctor, a diagnosis or a clinical decision system.

## Stack
Next.js, TypeScript, Tailwind CSS (mobile-first PWA); Python/FastAPI deployed to Google Cloud Run; Firebase Auth + Firestore + Storage; Gemini API called from backend; browser speech with text fallback. Google Maps/Places is optional. **Gemini API is not Gemini Enterprise.**

## Team workflow
`main` = stable release only. `develop` = integrated test branch. Five feature branches owned by five developers; Pull Requests target `develop` and only a tested release PR from `develop` goes to `main`.

- `feature/voice-ai`
- `feature/pregnancy-safety`
- `feature/report-intelligence`
- `feature/frontend-experience`
- `feature/backend-cloud`

**Start:** [AGENTS.md](AGENTS.md) · [Architecture](docs/ARCHITECTURE.md) · [API Contracts](shared/api-contracts.md) · [Team Tasks](docs/TEAM_TASKS.md) · [Quickstart](docs/QUICKSTART.md)

This is a collaboration scaffold, **not yet a deployed product**. Firebase / Google Cloud resources and secrets must be configured separately.
