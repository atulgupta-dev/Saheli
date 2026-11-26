# Shared API contracts v0.1

API base: `/api/v1`; standard JSON except multipart reports. Protected endpoints send `Authorization: Bearer <Firebase ID token>`, validated in FastAPI. No client-chosen user id.

**Error** `{"error":{"code":"VALIDATION_ERROR","message":"Readable message","request_id":"uuid"}}`

### GET /health
`200 {"status":"ok","service":"saheli-api","version":"0.1.0"}` (public)

### GET /api/v1/profile
```json
{"user_id":"firebase_uid","active_stage":"pregnancy","locale":"hi-IN","consent":{"store_conversations":true,"store_reports":false},"stage_profiles":{"pregnancy":{"gestational_week":28}}}
```

### PATCH /api/v1/profile/stage
Request `{"active_stage":"menstrual"}` returns `{"active_stage":"menstrual"}`. Allowed menstrual/pregnancy/postpartum. Switching does **not** delete previous history.

### POST /api/v1/chat
Request:
```json
{"stage":"pregnancy","message":"Aaj thakan hai","locale":"hi-IN","conversation_id":null,"save_to_memory":true}
```
Response:
```json
{"conversation_id":"conv_demo","reply":"...","sources":[],"safety":{"level":"informational","message":null},"memory_saved":true}
```
`safety.level` is informational/consult/urgent. Only pregnancy implemented in MVP. Other stages may return 501 FEATURE_NOT_AVAILABLE.

### POST /api/v1/symptoms
Request:
```json
{"stage":"pregnancy","reported_at":"2026-11-26T15:00:00Z","symptoms":["fatigue"],"notes":"Tired in afternoon"}
```
Response:
```json
{"entry_id":"sym_demo","saved":true,"safety":{"level":"informational","message":"...","rule_ids":[]}}
```
Safety rule IDs must refer to reviewed deterministic rules; Gemini may not downgrade urgency.

### POST /api/v1/reports
Multipart fields: `file` (PDF/JPEG/PNG), `stage=pregnancy`, `consent_to_store=false`.
```json
{"report_id":"rep_demo","status":"completed","extracted":{"gestational_age_weeks":28,"measurements":[]},"explanations":[],"citations":[{"page":1,"quote":"..."}],"warnings":["Education only"]}
```
Use null / unknown for missing values. For async processing use status processing.

### GET /api/v1/reports/{report_id}
Return owner-authorized status/result only.

### POST /api/v1/care-summary
Request `{"stage":"pregnancy","report_ids":["rep_demo"],"include_symptoms":true}`.
Response `{"summary":"...","references":[],"medical_disclaimer":"For clinician review, not diagnosis"}`.

Every agent: confirm contract changes with backend and frontend owners **before** editing.
