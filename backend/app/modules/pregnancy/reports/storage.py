"""Owner-scoped in-memory report storage (stub for Firestore users/{uid}/reports/{id})."""

from __future__ import annotations

from dataclasses import dataclass
from threading import Lock

from .errors import ReportAPIError
from .schemas import ReportResponse


@dataclass(frozen=True)
class StoredReport:
    owner_uid: str
    report: ReportResponse


class InMemoryReportStore:
    """Thread-safe owner-authorized store for consented reports."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._records: dict[str, StoredReport] = {}

    def save(self, owner_uid: str, report: ReportResponse) -> None:
        with self._lock:
            self._records[report.report_id] = StoredReport(
                owner_uid=owner_uid,
                report=report,
            )

    def get_for_owner(self, owner_uid: str, report_id: str) -> ReportResponse:
        with self._lock:
            record = self._records.get(report_id)
        if record is None:
            raise ReportAPIError(
                code="NOT_FOUND",
                message=f"Report '{report_id}' was not found.",
                status_code=404,
            )
        if record.owner_uid != owner_uid:
            raise ReportAPIError(
                code="FORBIDDEN",
                message="You do not have permission to access this report.",
                status_code=403,
            )
        return record.report

    def clear(self) -> None:
        with self._lock:
            self._records.clear()


report_store = InMemoryReportStore()
