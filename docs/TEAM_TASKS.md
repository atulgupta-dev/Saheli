# Five developers — module ownership

| Developer | Branch | Scope | Delivered when |
| --- | --- | --- | --- |
| M1 Voice AI | `feature/voice-ai` | Gemini conversation, Hindi/Hinglish voice and text fallback, consented memory | Voice/text message reaches backend and response cites known context safely |
| M2 Safety | `feature/pregnancy-safety` | Pregnancy symptom journal, deterministic reviewed red-flag guidance, clinician summary | Synthetic benign/urgent cases tested |
| M3 Reports | `feature/report-intelligence` | Synthetic ultrasound PDF/image extraction, cited factual explanations and report comparison | Report upload produces referenced results, not invented values |
| M4 Frontend | `feature/frontend-experience` | Auth + onboarding + stage switch + all three mobile dashboards + pregnancy UX | Login -> stage dashboard -> settings switching works |
| M5 Cloud/Integration | `feature/backend-cloud` | FastAPI + Firebase token validation + Firestore/Storage + Cloud Run deployment | Health check, protected APIs and deployed demo verified |

Integration lead: repository owner reviews feature PRs targeting `develop`. Release only via PR from `develop` to `main`.

## Order of execution
1. **Hour 0–1:** Read AGENTS.md; agree schemas and sample profile; create Firebase/GCP project; start frontend/backend skeleton.
2. **Hour 1–2:** Show login -> onboarding -> stage -> dashboard and one mock backend response end-to-end.
3. **Hours 2–6:** Parallel module implementation; PRs every ~90 minutes.
4. **Hours 6–8:** Integration + mobile testing + safety/error cases.
5. **Hours 8–10:** Deploy on GCP, fix auth, test sample reports.
6. **Hours 10–12:** Presentation, backup demos and regression tests.

**Cut if behind:** 3D baby visualization, Partner Mode and nearby-care feature. Protect voice + safety + report + working deployment. All clinical claims must be appropriately qualified.
