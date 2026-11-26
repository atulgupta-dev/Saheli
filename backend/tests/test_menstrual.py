import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
USER_A_HEADERS = {"Authorization": "Bearer mock_menst_user_a"}
USER_B_HEADERS = {"Authorization": "Bearer mock_menst_user_b"}


# -------------------------------------------------------------
# 1. Period Creation & Retrieval
# -------------------------------------------------------------

def test_create_period_record_success():
    payload = {
        "start_date": "2026-01-01",
        "end_date": "2026-01-05",
        "flow_intensity": "medium",
        "notes": "First logged period",
    }
    res = client.post("/api/v1/menstrual/cycles", headers=USER_A_HEADERS, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["cycle_id"].startswith("cyc_")
    assert data["start_date"] == "2026-01-01"
    assert data["end_date"] == "2026-01-05"
    assert data["duration_days"] == 5
    assert data["flow_intensity"] == "medium"

    # Verify retrieval
    get_res = client.get(f"/api/v1/menstrual/cycles/{data['cycle_id']}", headers=USER_A_HEADERS)
    assert get_res.status_code == 200
    assert get_res.json()["cycle_id"] == data["cycle_id"]


def test_list_period_records():
    # Create record first
    client.post(
        "/api/v1/menstrual/cycles",
        headers=USER_A_HEADERS,
        json={"start_date": "2026-01-01", "end_date": "2026-01-05"},
    )
    res = client.get("/api/v1/menstrual/cycles", headers=USER_A_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "cycles" in data
    assert isinstance(data["cycles"], list)
    assert data["total_count"] >= 1


# -------------------------------------------------------------
# 2. Date Validation & Overlap Checks
# -------------------------------------------------------------

def test_create_period_invalid_end_date():
    # End date earlier than start date
    payload = {
        "start_date": "2026-02-10",
        "end_date": "2026-02-05",
    }
    res = client.post("/api/v1/menstrual/cycles", headers=USER_A_HEADERS, json=payload)
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_create_period_excessive_duration():
    # Duration > 16 days
    payload = {
        "start_date": "2026-02-01",
        "end_date": "2026-02-25",
    }
    res = client.post("/api/v1/menstrual/cycles", headers=USER_A_HEADERS, json=payload)
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_create_period_overlapping_rejected():
    # Create initial period record
    init_res = client.post(
        "/api/v1/menstrual/cycles",
        headers=USER_A_HEADERS,
        json={"start_date": "2026-01-01", "end_date": "2026-01-05"},
    )
    assert init_res.status_code == 201

    # Overlaps with 2026-01-01 to 2026-01-05
    payload = {
        "start_date": "2026-01-03",
        "end_date": "2026-01-07",
    }
    res = client.post("/api/v1/menstrual/cycles", headers=USER_A_HEADERS, json=payload)
    assert res.status_code == 422
    data = res.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "overlaps with an existing" in data["error"]["message"].lower()


# -------------------------------------------------------------
# 3. Period Update & Deletion
# -------------------------------------------------------------

def test_update_period_record():
    # Log a distinct cycle in March
    create_res = client.post(
        "/api/v1/menstrual/cycles",
        headers=USER_A_HEADERS,
        json={"start_date": "2026-03-01", "end_date": "2026-03-05"},
    )
    assert create_res.status_code == 201
    cycle_id = create_res.json()["cycle_id"]

    # Update flow and notes
    patch_res = client.patch(
        f"/api/v1/menstrual/cycles/{cycle_id}",
        headers=USER_A_HEADERS,
        json={"flow_intensity": "heavy", "notes": "Cramps on day 2"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["flow_intensity"] == "heavy"
    assert patch_res.json()["notes"] == "Cramps on day 2"


def test_delete_period_record():
    create_res = client.post(
        "/api/v1/menstrual/cycles",
        headers=USER_A_HEADERS,
        json={"start_date": "2026-04-01", "end_date": "2026-04-04"},
    )
    cycle_id = create_res.json()["cycle_id"]

    del_res = client.delete(f"/api/v1/menstrual/cycles/{cycle_id}", headers=USER_A_HEADERS)
    assert del_res.status_code == 204

    # Now retrieval should 404
    get_res = client.get(f"/api/v1/menstrual/cycles/{cycle_id}", headers=USER_A_HEADERS)
    assert get_res.status_code == 404
    assert get_res.json()["error"]["code"] == "NOT_FOUND"


# -------------------------------------------------------------
# 4. Cycle Statistics & Predictions
# -------------------------------------------------------------

def test_cycle_statistics_and_prediction_flow():
    user_calc_headers = {"Authorization": "Bearer mock_calc_user"}

    # 0 records: insufficient data
    pred_0 = client.get("/api/v1/menstrual/cycles/predictions", headers=user_calc_headers).json()
    assert pred_0["status"] == "insufficient_data"
    assert pred_0["confidence"] == "none"

    stats_0 = client.get("/api/v1/menstrual/cycles/statistics", headers=user_calc_headers).json()
    assert stats_0["total_records"] == 0
    assert stats_0["completed_cycles_evaluated"] == 0

    # 1 record: insufficient data (no predicted date returned to avoid misleading users)
    client.post(
        "/api/v1/menstrual/cycles",
        headers=user_calc_headers,
        json={"start_date": "2026-01-01", "end_date": "2026-01-05"},
    )
    pred_1 = client.get("/api/v1/menstrual/cycles/predictions", headers=user_calc_headers).json()
    assert pred_1["status"] == "insufficient_data"
    assert pred_1["confidence"] == "none"
    assert pred_1["predicted_next_start_date"] is None
    assert "at least two" in pred_1["message"].lower()

    # 2 records (Cycle length: 28 days: Jan 1 to Jan 29)
    client.post(
        "/api/v1/menstrual/cycles",
        headers=user_calc_headers,
        json={"start_date": "2026-01-29", "end_date": "2026-02-02"},
    )
    # 3 records (Cycle length: 28 days: Jan 29 to Feb 26)
    client.post(
        "/api/v1/menstrual/cycles",
        headers=user_calc_headers,
        json={"start_date": "2026-02-26", "end_date": "2026-03-02"},
    )

    stats = client.get("/api/v1/menstrual/cycles/statistics", headers=user_calc_headers).json()
    assert stats["total_records"] == 3
    assert stats["completed_cycles_evaluated"] == 2
    assert stats["average_cycle_length_days"] == 28.0
    assert stats["is_irregular"] is False

    pred = client.get("/api/v1/menstrual/cycles/predictions", headers=user_calc_headers).json()
    assert pred["status"] == "calculated"
    assert pred["confidence"] == "medium"
    assert pred["predicted_next_start_date"] == "2026-03-26"  # 2026-02-26 + 28 days
    assert pred["is_irregular"] is False
    assert "medical_disclaimer" in pred


def test_cycle_irregularity_detection():
    user_irreg_headers = {"Authorization": "Bearer mock_irreg_user"}
    # Cycle 1: 21 days (Jan 1 to Jan 22)
    client.post("/api/v1/menstrual/cycles", headers=user_irreg_headers, json={"start_date": "2026-01-01"})
    client.post("/api/v1/menstrual/cycles", headers=user_irreg_headers, json={"start_date": "2026-01-22"})
    # Cycle 2: 36 days (Jan 22 to Feb 27) -> variation > 7 days
    client.post("/api/v1/menstrual/cycles", headers=user_irreg_headers, json={"start_date": "2026-02-27"})

    stats = client.get("/api/v1/menstrual/cycles/statistics", headers=user_irreg_headers).json()
    assert stats["is_irregular"] is True
    assert stats["max_cycle_length_days"] - stats["min_cycle_length_days"] > 7

    pred = client.get("/api/v1/menstrual/cycles/predictions", headers=user_irreg_headers).json()
    assert pred["is_irregular"] is True
    assert pred["confidence"] == "low"


# -------------------------------------------------------------
# 5. Menstrual Symptoms & Safety Escalation
# -------------------------------------------------------------

def test_log_menstrual_symptom_routine():
    payload = {
        "date": "2026-01-02",
        "symptoms": ["mild cramps", "bloating"],
        "severity": "mild",
        "notes": "Rested with warm tea",
    }
    res = client.post("/api/v1/menstrual/symptoms", headers=USER_A_HEADERS, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["entry_id"].startswith("msym_")
    assert data["safety"]["level"] == "informational"
    assert data["safety"]["rule_ids"] == []


def test_log_menstrual_symptom_urgent_escalation():
    payload = {
        "date": "2026-01-02",
        "symptoms": ["excessive bleeding", "fainting"],
        "severity": "severe",
        "notes": "Soaking pad hourly and feeling dizzy",
    }
    res = client.post("/api/v1/menstrual/symptoms", headers=USER_A_HEADERS, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["safety"]["level"] == "urgent"
    assert "RULE-MENST-URG-01" in data["safety"]["rule_ids"]


# -------------------------------------------------------------
# 6. User Isolation
# -------------------------------------------------------------

def test_menstrual_cross_user_isolation():
    # User A creates a cycle record
    create_res = client.post(
        "/api/v1/menstrual/cycles",
        headers=USER_A_HEADERS,
        json={"start_date": "2026-05-01", "end_date": "2026-05-05"},
    )
    cycle_id = create_res.json()["cycle_id"]

    # User B cannot access User A's cycle record
    get_res = client.get(f"/api/v1/menstrual/cycles/{cycle_id}", headers=USER_B_HEADERS)
    assert get_res.status_code == 404
    assert get_res.json()["error"]["code"] == "NOT_FOUND"

    # User B cannot delete User A's cycle record
    del_res = client.delete(f"/api/v1/menstrual/cycles/{cycle_id}", headers=USER_B_HEADERS)
    assert del_res.status_code == 404
    assert del_res.json()["error"]["code"] == "NOT_FOUND"


# -------------------------------------------------------------
# 7. Unauthenticated Requests Rejected
# -------------------------------------------------------------

def test_menstrual_unauthenticated_rejected():
    res = client.get("/api/v1/menstrual/cycles")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "AUTHENTICATION_ERROR"
