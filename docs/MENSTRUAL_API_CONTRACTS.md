# Proposed Menstrual Health API Contracts v0.1

This document specifies the Menstrual Health tracking and prediction API extensions implemented in the backend under `/api/v1/menstrual`.

---

## 1. Endpoints Overview

All endpoints require `Authorization: Bearer <Firebase ID token>`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/menstrual/cycles` | Log a new period cycle start/end date |
| `GET` | `/api/v1/menstrual/cycles` | Retrieve period cycle history |
| `GET` | `/api/v1/menstrual/cycles/{cycle_id}` | Retrieve a specific cycle record |
| `PATCH` | `/api/v1/menstrual/cycles/{cycle_id}` | Update period dates, flow, or notes |
| `DELETE` | `/api/v1/menstrual/cycles/{cycle_id}` | Delete a period record |
| `GET` | `/api/v1/menstrual/cycles/statistics` | Retrieve calculated statistics (average cycle length, variation) |
| `GET` | `/api/v1/menstrual/cycles/predictions` | Retrieve deterministic next period estimation |
| `POST` | `/api/v1/menstrual/symptoms` | Log daily symptoms with safety rule evaluation |
| `GET` | `/api/v1/menstrual/symptoms` | Retrieve logged symptom entries |
| `POST` | `/api/v1/chat` | Conversational companion (`stage="menstrual"`) |

---

## 2. Request & Response Schemas

### A. POST `/api/v1/menstrual/cycles`
- **Request**:
  ```json
  {
    "start_date": "2026-01-01",
    "end_date": "2026-01-05",
    "flow_intensity": "medium",
    "notes": "Mild cramps on day 1"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "cycle_id": "cyc_a1b2c3d4",
    "start_date": "2026-01-01",
    "end_date": "2026-01-05",
    "duration_days": 5,
    "flow_intensity": "medium",
    "notes": "Mild cramps on day 1",
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
  }
  ```

### B. GET `/api/v1/menstrual/cycles/statistics`
- **Response (200 OK)**:
  ```json
  {
    "total_records": 3,
    "completed_cycles_evaluated": 2,
    "average_cycle_length_days": 28.0,
    "average_period_duration_days": 5.0,
    "min_cycle_length_days": 28,
    "max_cycle_length_days": 28,
    "is_irregular": false,
    "notes": "Evaluated 2 consecutive cycle interval(s). Cycle rhythm appears consistent."
  }
  ```

### C. GET `/api/v1/menstrual/cycles/predictions`
- **Behavior**:
  - Requires at least 2 recorded period start dates to calculate cycle intervals.
  - If 0 or 1 period record exists, returns `status: "insufficient_data"`, `confidence: "none"`, and `predicted_next_start_date: null` to avoid presenting a misleading personalized date without adequate history.
  - Once 2+ cycles are logged, calculates personalized estimation using the user's average cycle length.
- **Response (200 OK - With >= 2 records)**:
  ```json
  {
    "status": "calculated",
    "predicted_next_start_date": "2026-03-26",
    "predicted_next_end_date": "2026-03-30",
    "estimated_cycle_length_days": 28,
    "confidence": "high",
    "cycle_variation_days": 0,
    "is_irregular": false,
    "message": "Estimated based on your average 28-day cycle length over 2 cycle(s). Cycle pattern is regular.",
    "medical_disclaimer": "Educational estimate only. Do not use for contraception, fertility planning, or medical diagnosis."
  }
  ```

### D. POST `/api/v1/menstrual/symptoms`
- **Request**:
  ```json
  {
    "date": "2026-01-02",
    "symptoms": ["cramps", "fatigue"],
    "severity": "mild",
    "notes": "Rested with warm compress"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "entry_id": "msym_9e8d7c6b",
    "date": "2026-01-02",
    "symptoms": ["cramps", "fatigue"],
    "severity": "mild",
    "notes": "Rested with warm compress",
    "safety": {
      "level": "informational",
      "message": "Symptoms logged in your menstrual health journal. Gentle warmth, hydration, and rest can help manage routine discomfort.",
      "rule_ids": []
    },
    "created_at": "2026-01-02T12:00:00Z"
  }
  ```

---

## 3. Firestore Storage Schema

All documents are strictly scoped to the authenticated user UID:

```
users/{uid}
  ├── stage_profiles/
  │     └── menstrual: { last_period_date, average_cycle_length, average_period_duration, is_irregular }
  ├── menstrual_cycles/
  │     └── {cycle_id}: { cycle_id, start_date, end_date, duration_days, flow_intensity, notes, created_at, updated_at }
  └── menstrual_symptoms/
        └── {entry_id}: { entry_id, date, symptoms, severity, notes, safety, created_at }
```
