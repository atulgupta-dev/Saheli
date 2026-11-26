# Saheli AI Frontend (`frontend/`)

Mobile-first Next.js (App Router, TypeScript, Tailwind CSS) Progressive Web App for **Saheli AI**, owned by **Member 4**.

## Quickstart

```bash
cd frontend
cp .env.local.example .env.local   # fill Firebase + NEXT_PUBLIC_API_BASE_URL for Live Mode
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Implemented Features & Scope Alignment

- **Life-stage design system (`LifeStageProvider` in [AppProviders.tsx](providers/AppProviders.tsx))**: Dynamically switches CSS custom properties, hero illustrations, symptom chips, AI starters, and report categories across `"menstrual"` (`#C96D90`), `"pregnancy"` (`#A16ADD`), and `"postpartum"` (`#659B83`) without losing stage-specific history.
- **Stage alignment note**: Follows `AGENTS.md` and `shared/api-contracts.md` (`menstrual` | `pregnancy` | `postpartum`). **Pregnancy** is the primary MVP experience; Menstrual and Postpartum are fully navigable with honest **Coming Soon** notices on unimplemented live backend/AI endpoints.
- **Splash & 5-step Onboarding ([page.tsx](app/page.tsx), [onboarding/page.tsx](app/onboarding/page.tsx))**: Welcome, English / Hindi / Hinglish language selector, life-stage cards, optional skippable personalisation, and explicit privacy/memory consent + Synthetic Demo Mode entry.
- **Pregnancy MVP Dashboard ([PregnancyDashboard.tsx](components/pregnancy/PregnancyDashboard.tsx))**: Progress ring, floating SVG illustration, interactive week timeline, Mother's Health bento grid (only user-logged or authorised entries), daily symptom check-in, report preview, and AI starters.
- **Menstrual & Postpartum Dashboards ([MenstrualDashboard.tsx](components/menstrual/MenstrualDashboard.tsx), [PostpartumDashboard.tsx](components/postpartum/PostpartumDashboard.tsx))**: Interactive SVG Cycle Wheel (labelled Estimate Only), monthly cycle calendar, and Botanical Wellness Flower (petal check-ins, not a medical score).
- **Saheli AI Voice & Chat ([chat/page.tsx](app/chat/page.tsx), [VoiceOrb.tsx](components/chat/VoiceOrb.tsx))**: Web Speech Recognition + SpeechSynthesis with explicit mic permission, live transcription preview, typed fallback, and consented memory badge shown only when returned.
- **Medical Report Intelligence ([reports/page.tsx](app/reports/page.tsx))**: Drag-and-drop PDF/JPEG/PNG upload with validation, real status states, cancel/retry, and separated **Extracted Findings + Page Citations** vs **Plain-Language AI Explanation**.
- **Symptom Journal, Safety & Clinician Summary ([symptoms/page.tsx](app/symptoms/page.tsx), [UrgentCareBanner.tsx](components/safety/UrgentCareBanner.tsx))**: Prominent accessible urgent-care banner outside chat bubbles and reviewable `.txt` / clipboard clinician summary.
- **PWA & Offline ([manifest.webmanifest](public/manifest.webmanifest), [sw.js](public/sw.js), [offline/page.tsx](app/offline/page.tsx))**: Installable manifest + static shell service worker (never caches `/api/*` or private medical data).

## Backend Integration (`shared/api-contracts.md`)

All backend calls go through [client.ts](lib/api/client.ts) using `NEXT_PUBLIC_API_BASE_URL` and Firebase ID Bearer tokens:

- `GET /health`
- `GET /api/v1/profile`
- `PATCH /api/v1/profile/stage`
- `POST /api/v1/chat`
- `POST /api/v1/symptoms`
- `POST /api/v1/reports` & `GET /api/v1/reports/{report_id}`
- `POST /api/v1/care-summary`

**Demo vs Live separation:** Synthetic Demo Mode uses [mockAdapter.ts](lib/api/mockAdapter.ts). Live Mode **never** silently substitutes synthetic data on API failure.

## Pending / Blocked on Backend & Cloud Config

- Live FastAPI `/api/v1/*` routes (Members 1, 2, 3, 5)
- Firebase project keys in `.env.local` for live Google/Email sign-in
- Optional Google Maps Places API key for live nearby facility search (currently opens Google Maps search or displays manual/emergency helpline guidance without fabricating clinics)

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
