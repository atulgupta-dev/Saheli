# Member 5 — Core Platform, Cloud Infrastructure & Integration Guide

This directory houses the foundational infrastructure for Saheli AI, owned by Member 5.

---

## 1. Architecture Overview

- **FastAPI Framework**: Modular router architecture mounted under `/api/v1` with a public `/health` endpoint. Runs on Render Free (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- **Firebase Authentication**: Bearer-token verification with Firebase Admin SDK using Application Default Credentials (ADC) or in-memory Base64 service account (`FIREBASE_SERVICE_ACCOUNT_B64`). Strict production security (no mock bypass allowed in production).
- **Firestore Persistence**: User profile persistence, stage switching, and strictly scoped subcollections (`users/{uid}/...`) on the Firebase Spark plan.
- **Spark Ephemeral Storage**: Validates MIME types (PDF/JPEG/PNG), file magic bytes, and 10 MB limits. Processes reports synchronously in memory / ephemeral temp files without requiring paid Cloud Storage buckets. Honors `consent_to_store`.
- **Request Tracing & Structured Errors**: Every request receives a correlation ID (`X-Request-ID`) tracked across middleware, logs, and structured error responses.

---

## 2. API Base URL & Health Check

- **Local Base URL**: `http://localhost:8080` (or `http://localhost:8000`)
- **API Prefix**: `/api/v1`
- **Public Health Check**: `GET /health`
  ```json
  {
    "status": "ok",
    "service": "saheli-api",
    "version": "0.1.0"
  }
  ```

---

## 3. Firebase Bearer Token Authentication

Every protected endpoint requires the `Authorization` header:
```http
Authorization: Bearer <Firebase_ID_Token>
```

### Development & Demo Mocks
When `ENABLE_DEMO_MOCKS=true` and `ENV!=production`, developers can use mock bearer tokens for quick local testing without needing active Google Cloud / Firebase credentials:
- Format: `Bearer mock_<uid>` (e.g. `Bearer mock_user_alice`, `Bearer mock_user_bob`)
- In production (`ENV=production`), mock tokens are strictly forbidden and rejected with `401 AUTHENTICATION_ERROR`.

---

## 4. API Endpoints & Request / Response Examples

### A. GET `/api/v1/profile`
Fetches the user's active stage, preferences, and stage profiles.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "user_id": "firebase_uid",
    "active_stage": "pregnancy",
    "locale": "hi-IN",
    "consent": {
      "store_conversations": true,
      "store_reports": false
    },
    "stage_profiles": {
      "pregnancy": {
        "gestational_week": 28
      }
    }
  }
  ```

### B. PATCH `/api/v1/profile/stage`
Switches active reproductive health stage (`menstrual`, `pregnancy`, `postpartum`). Previous stage data and history are **never** deleted.
- **Request**:
  ```json
  {
    "active_stage": "menstrual"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "active_stage": "menstrual"
  }
  ```

### C. POST `/api/v1/chat`
Conversational companion message (Gemini-backed via Member 1 adapter).
- **Request**:
  ```json
  {
    "stage": "pregnancy",
    "message": "Aaj thakan hai",
    "locale": "hi-IN",
    "conversation_id": null,
    "save_to_memory": true
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "conversation_id": "conv_a1b2c3d4",
    "reply": "Namaste! Main Saheli hoon...",
    "sources": ["Saheli Maternal Health Guide v0.1"],
    "safety": {
      "level": "informational",
      "message": null
    },
    "memory_saved": true
  }
  ```
- *Note*: If stage is `menstrual` or `postpartum`, returns `501 FEATURE_NOT_AVAILABLE`.

### D. POST `/api/v1/symptoms`
Records symptom entries and evaluates warning signs (Member 2 adapter).
- **Request**:
  ```json
  {
    "stage": "pregnancy",
    "reported_at": "2026-11-26T15:00:00Z",
    "symptoms": ["fatigue"],
    "notes": "Tired in afternoon"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "entry_id": "sym_e5f6g7h8",
    "saved": true,
    "safety": {
      "level": "informational",
      "message": "Symptoms recorded safely in your journal.",
      "rule_ids": []
    }
  }
  ```

### E. POST `/api/v1/reports`
Multipart upload for ultrasound/medical reports (PDF, JPEG, PNG).
- **Multipart Form Fields**:
  - `file`: binary file
  - `stage`: `"pregnancy"`
  - `consent_to_store`: `true` | `false`
- **Response (200 OK)**:
  ```json
  {
    "report_id": "rep_9i0j1k2l",
    "status": "completed",
    "extracted": {
      "gestational_age_weeks": 28,
      "measurements": [
        {"metric": "BPD", "value": "71mm", "percentile": "50th"}
      ]
    },
    "explanations": [],
    "citations": [
      {"page": 1, "quote": "Gestational age: 28 weeks 0 days"}
    ],
    "warnings": ["Education only"]
  }
  ```

### F. GET `/api/v1/reports/{report_id}`
Retrieves analysis strictly for the authenticated report owner. Other users receive `404 NOT_FOUND`.

### G. POST `/api/v1/care-summary`
Compiles reports and symptoms for clinical handoff.
- **Request**:
  ```json
  {
    "stage": "pregnancy",
    "report_ids": ["rep_9i0j1k2l"],
    "include_symptoms": true
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "summary": "Care summary for pregnancy stage (week 28)...",
    "references": ["rep_9i0j1k2l"],
    "medical_disclaimer": "For clinician review, not diagnosis"
  }
  ```

---

## 5. Structured Error Schema

All errors follow the unified schema from `shared/api-contracts.md`:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable error explanation",
    "request_id": "uuid-v4-string"
  }
}
```

Standard Error Codes:
- `AUTHENTICATION_ERROR` (401)
- `AUTHORIZATION_ERROR` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (422)
- `FILE_TOO_LARGE` (413)
- `UNSUPPORTED_MEDIA_TYPE` (415)
- `FEATURE_NOT_AVAILABLE` (501)
- `INTERNAL_SERVER_ERROR` (500)

---

## 6. Firestore Schema (docs/ARCHITECTURE.md)

All documents and subcollections are strictly scoped to `users/{uid}`:

```
users/{uid}
  ├── active_stage: "pregnancy" | "menstrual" | "postpartum"
  ├── locale: "hi-IN"
  ├── consent: { store_conversations: bool, store_reports: bool }
  ├── created_at: ISO8601
  ├── updated_at: ISO8601
  │
  ├── stage_profiles/
  │     └── {stage} (e.g. pregnancy: { gestational_week: 28 })
  │
  ├── conversations/
  │     └── {conversation_id}/
  │           └── messages/
  │                 └── {message_id}: { user_message, agent_reply, timestamp }
  │
  ├── symptom_entries/
  │     └── {entry_id}: { stage, reported_at, symptoms, notes, safety }
  │
  ├── reports/
  │     └── {report_id}: { status, storage_uri, consent_to_store, extracted, citations }
  │
  └── care_events/
        └── {event_id}: { summary, references, stage, created_at }
```

---

## 7. Adapter Replacement Points for Teammates

Clean adapters in `backend/app/adapters/` decouple core infrastructure from module implementations:

1. **Member 1 (Voice AI)**:
   - Module directory: `backend/app/services/voice/`
   - Adapter: `backend/app/adapters/voice_adapter.py`
   - Wire your service by exposing `async def process_chat(uid: str, request: ChatRequest) -> ChatResponse` in `app.services.voice.service`.

2. **Member 2 (Pregnancy Safety)**:
   - Module directory: `backend/app/modules/pregnancy/safety/`
   - Adapter: `backend/app/adapters/safety_adapter.py`
   - Wire your service by exposing `async def evaluate_symptoms(uid: str, request: SymptomRequest) -> SymptomResponse` in `app.modules.pregnancy.safety.service`.

3. **Member 3 (Report Intelligence)**:
   - Module directory: `backend/app/modules/pregnancy/reports/`
   - Adapter: `backend/app/adapters/reports_adapter.py`
   - Wire your service by exposing `async def process_report(...)` in `app.modules.pregnancy.reports.service`.

4. **Member 4 (Frontend)**:
   - Connect Next.js fetch client to `http://localhost:8080/api/v1`
   - Send `Authorization: Bearer <token>`
   - Use `mock_<uid>` tokens during local testing.

---

## 8. Environment Variables

Configure in `backend/.env`:
| Variable | Description | Default |
|---|---|---|
| `ENV` | Environment name (`development`, `production`, `testing`) | `development` |
| `PORT` | Listening port for server | `8080` |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | `saheli-dev` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `saheli-dev` |
| `GOOGLE_CLOUD_STORAGE_BUCKET` | Private Cloud Storage Bucket for reports | `saheli-reports-dev` |
| `GEMINI_API_KEY` | Server-only Gemini API Key (keep private) | `""` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `ENABLE_DEMO_MOCKS` | Enable mock tokens & mock fallback services | `true` |
| `MAX_UPLOAD_SIZE_BYTES` | Maximum report file size in bytes | `10485760` (10 MB) |

---

## 9. Local Startup & Testing

### Run backend locally:
```bash
cd backend
uvicorn app.main:app --reload --port 8080
```

### Run automated tests:
```bash
cd backend
python -m pytest -v
```

---

## 10. Cloud Run Deployment

Deployment is managed via `backend/deploy.sh`:
- Uses Google Cloud Build to containerize `Dockerfile`.
- Deploys to Google Cloud Run with least-privilege service account.
- Injects `GEMINI_API_KEY` securely from Secret Manager (never in plain text).
- Enforces Application Default Credentials (ADC) for Firestore and Cloud Storage.
