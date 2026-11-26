# Agent instructions — Saheli AI

This file applies to all AI coding tools (Codex, Antigravity, Claude Code, Cursor).

## Non-negotiable rules
1. First read `README.md`, `docs/ARCHITECTURE.md`, `shared/api-contracts.md`, `docs/TEAM_TASKS.md`.
2. Keep `main` untouched. Feature work occurs on your assigned `feature/*` branch; open a small PR against `develop`. The integration lead handles all merges. Never auto-merge or force push teammates' branches.
3. Work primarily in your owned directory. Propose cross-team edits and API changes before touching shared schemas.
4. Only **pregnancy** endpoints/AI features are implemented in MVP. Menstrual and postpartum UI is navigable but displays "Coming soon" on unavailable features. Onboarding and stage switcher work for all stages.
5. Use synthetic patient data only. Don't commit credentials, authentic health records, API keys, or service account JSON.
6. Medical responses must be non-diagnostic. Implement reviewed deterministic pregnancy warning-sign rules independent of LLM; urgent guidance may never be downgraded by Gemini. Do not claim to be a doctor or recommend medications/treatments.
7. API keys and Gemini requests stay on FastAPI server. Require Firebase ID token verification and user-specific authorization before accessing private data.
8. Use accessible mobile designs, loading/error/empty states, typed fallback for unreliable voice functionality, and tests for essential flows.
9. PR descriptions must include file changes, API changes, tests run, screenshots (for UI) and known issues.
10. If the repo lacks a required shared integration, stub to the documented contracts and notify the relevant owner instead of changing someone else's module.

## Owners
- Member 1: `backend/app/services/voice/` and voice-specific API component, coordinating UI with Member 4.
- Member 2: `backend/app/modules/pregnancy/safety/`; journal and warning signs.
- Member 3: `backend/app/modules/pregnancy/reports/`; document analysis.
- Member 4: `frontend/`; Next.js, onboarding, all three dashboards, Settings stage switch.
- Member 5: `backend/app/core/`, `backend/app/main.py`, Firebase/Cloud wiring, infra, cross-module integration.

## First milestone
One vertical slice: frontend form -> authenticated FastAPI endpoint -> mock/Gemini response -> frontend. Then add voice, memory, safety and reports in parallel. Integration lead merges early and tests frequently.
