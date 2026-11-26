from __future__ import annotations

import datetime
import math
from typing import List, Optional, Tuple
from app.modules.menstrual.models import (
    CyclePrediction,
    CycleStatistics,
    PeriodRecordResponse,
)


def calculate_cycle_lengths(sorted_periods: List[PeriodRecordResponse]) -> List[int]:
    """Calculate cycle lengths in days from consecutive period start dates."""
    lengths: List[int] = []
    for i in range(len(sorted_periods) - 1):
        d1 = datetime.date.fromisoformat(sorted_periods[i].start_date)
        d2 = datetime.date.fromisoformat(sorted_periods[i + 1].start_date)
        diff = (d2 - d1).days
        if diff > 0:
            lengths.append(diff)
    return lengths


def check_period_overlap(
    new_start: datetime.date,
    new_end: Optional[datetime.date],
    existing_periods: List[PeriodRecordResponse],
    ignore_cycle_id: Optional[str] = None,
) -> Optional[Tuple[str, str]]:
    """
    Check if a proposed period date range overlaps with any existing period record.
    Returns (start_str, end_str) of the overlapping period if found, else None.
    """
    effective_new_end = new_end or new_start

    for record in existing_periods:
        if ignore_cycle_id and record.cycle_id == ignore_cycle_id:
            continue

        rec_start = datetime.date.fromisoformat(record.start_date)
        rec_end = datetime.date.fromisoformat(record.end_date) if record.end_date else rec_start

        # Interval overlap condition: (start1 <= end2) and (end1 >= start2)
        if new_start <= rec_end and effective_new_end >= rec_start:
            return (record.start_date, record.end_date or record.start_date)

    return None


def calculate_statistics(periods: List[PeriodRecordResponse]) -> CycleStatistics:
    """Calculate deterministic cycle statistics from user period history."""
    if not periods:
        return CycleStatistics(
            total_records=0,
            completed_cycles_evaluated=0,
            average_cycle_length_days=None,
            average_period_duration_days=None,
            min_cycle_length_days=None,
            max_cycle_length_days=None,
            is_irregular=False,
            notes="No cycle records available to compute statistics.",
        )

    # Sort periods chronologically
    sorted_periods = sorted(
        periods,
        key=lambda x: datetime.date.fromisoformat(x.start_date),
    )

    cycle_lengths = calculate_cycle_lengths(sorted_periods)

    # Calculate average period bleeding duration
    durations = [
        p.duration_days
        for p in sorted_periods
        if p.duration_days is not None and p.duration_days > 0
    ]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else None

    if not cycle_lengths:
        return CycleStatistics(
            total_records=len(sorted_periods),
            completed_cycles_evaluated=0,
            average_cycle_length_days=None,
            average_period_duration_days=avg_duration,
            min_cycle_length_days=None,
            max_cycle_length_days=None,
            is_irregular=False,
            notes="At least 2 period records are required to calculate cycle intervals.",
        )

    avg_cycle = round(sum(cycle_lengths) / len(cycle_lengths), 1)
    min_cycle = min(cycle_lengths)
    max_cycle = max(cycle_lengths)

    # Irregularity heuristic: variation > 7 days or cycle length outside 21-35 days
    is_irregular = (max_cycle - min_cycle > 7) or (avg_cycle < 21) or (avg_cycle > 35)

    notes = (
        f"Evaluated {len(cycle_lengths)} consecutive cycle interval(s). "
        f"{'Cycle variation detected (>7 days difference).' if is_irregular else 'Cycle rhythm appears consistent.'}"
    )

    return CycleStatistics(
        total_records=len(sorted_periods),
        completed_cycles_evaluated=len(cycle_lengths),
        average_cycle_length_days=avg_cycle,
        average_period_duration_days=avg_duration,
        min_cycle_length_days=min_cycle,
        max_cycle_length_days=max_cycle,
        is_irregular=is_irregular,
        notes=notes,
    )


def predict_next_cycle(periods: List[PeriodRecordResponse]) -> CyclePrediction:
    """
    Deterministic next period estimation.
    Uses clinical 28-day baseline for single record, and personal historical average for multiple records.
    Never fabricates clinical certainty; includes explicit disclaimers.
    """
    if not periods:
        return CyclePrediction(
            status="insufficient_data",
            predicted_next_start_date=None,
            predicted_next_end_date=None,
            estimated_cycle_length_days=None,
            confidence="none",
            cycle_variation_days=None,
            is_irregular=False,
            message="No period records logged. Please log a period start date to begin cycle estimation.",
        )

    sorted_periods = sorted(
        periods,
        key=lambda x: datetime.date.fromisoformat(x.start_date),
    )
    latest_period = sorted_periods[-1]
    latest_start = datetime.date.fromisoformat(latest_period.start_date)

    # Calculate bleeding duration estimate
    durations = [p.duration_days for p in sorted_periods if p.duration_days is not None]
    default_duration = round(sum(durations) / len(durations)) if durations else 5

    cycle_lengths = calculate_cycle_lengths(sorted_periods)

    if not cycle_lengths:
        # Exactly 1 period record: provisional 28-day baseline
        provisional_length = 28
        predicted_start = latest_start + datetime.timedelta(days=provisional_length)
        predicted_end = predicted_start + datetime.timedelta(days=default_duration - 1)

        return CyclePrediction(
            status="insufficient_data",
            predicted_next_start_date=predicted_start.isoformat(),
            predicted_next_end_date=predicted_end.isoformat(),
            estimated_cycle_length_days=provisional_length,
            confidence="low",
            cycle_variation_days=None,
            is_irregular=False,
            message=(
                "Provisional estimate based on standard 28-day cycle baseline. "
                "Log your next period start date for personalized cycle estimates."
            ),
        )

    # 2 or more period records: personalized calculation
    avg_cycle = round(sum(cycle_lengths) / len(cycle_lengths))
    variation = max(cycle_lengths) - min(cycle_lengths)
    is_irregular = (variation > 7) or (avg_cycle < 21) or (avg_cycle > 35)

    predicted_start = latest_start + datetime.timedelta(days=avg_cycle)
    predicted_end = predicted_start + datetime.timedelta(days=default_duration - 1)

    # Confidence calculation
    if len(cycle_lengths) >= 3 and not is_irregular:
        confidence = "high"
    elif not is_irregular:
        confidence = "medium"
    else:
        confidence = "low"

    msg = (
        f"Estimated based on your average {avg_cycle}-day cycle length over {len(cycle_lengths)} cycle(s). "
        f"{'Note: Your cycle exhibits variation (>7 days); actual start date may vary.' if is_irregular else 'Cycle pattern is regular.'}"
    )

    return CyclePrediction(
        status="calculated",
        predicted_next_start_date=predicted_start.isoformat(),
        predicted_next_end_date=predicted_end.isoformat(),
        estimated_cycle_length_days=avg_cycle,
        confidence=confidence,
        cycle_variation_days=variation,
        is_irregular=is_irregular,
        message=msg,
    )
