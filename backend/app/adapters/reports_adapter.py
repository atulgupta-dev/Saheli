from __future__ import annotations

import uuid
from app.core.exceptions import FeatureNotAvailableError
from app.core.models import ReportResponse
from app.services.firestore import FirestoreService
from app.services.storage import StorageService

class ReportsAdapter:
    """
    Adapter interfacing Member 3's pregnancy report extraction service.
    Designed for Firebase Spark plan:
    - Performs synchronous in-memory / ephemeral file processing without Cloud Storage bucket dependency.
    - Validates file content-type, magic byte signatures, and file size.
    - If consent_to_store=True, persists only structured metadata and extracted findings in Firestore.
    - If consent_to_store=False, neither the file nor its extracted contents are persisted.
    - Never promises persistent original-file retrieval.
    """

    def __init__(self, firestore_service: FirestoreService, storage_service: StorageService):
        self.firestore_service = firestore_service
        self.storage_service = storage_service

    async def handle_report_upload(
        self,
        uid: str,
        filename: str,
        file_bytes: bytes,
        content_type: str,
        stage: str,
        consent_to_store: bool,
    ) -> ReportResponse:
        if stage.lower() != "pregnancy":
            raise FeatureNotAvailableError(
                f"Document analysis is not available for '{stage}' in MVP. "
                "Only pregnancy ultrasound/medical reports are supported."
            )

        # Validate MIME type, size limit, and binary magic bytes
        self.storage_service.validate_file(content_type, file_bytes)

        report_id = f"rep_{uuid.uuid4().hex[:8]}"
        storage_uri = self.storage_service.upload_report_file(
            uid=uid,
            report_id=report_id,
            filename=filename,
            file_bytes=file_bytes,
            content_type=content_type,
            consent_to_store=consent_to_store,
        )

        # Check if Member 3 module is implemented
        try:
            from app.modules.pregnancy.reports import service as member3_reports_service  # type: ignore
            if hasattr(member3_reports_service, "process_report"):
                # Use ephemeral temporary file to pass to Member 3 if needed
                with self.storage_service.ephemeral_temp_file(filename, file_bytes) as temp_file_path:
                    return await member3_reports_service.process_report(
                        uid=uid,
                        report_id=report_id,
                        file_bytes=file_bytes,
                        content_type=content_type,
                        consent_to_store=consent_to_store,
                        storage_uri=storage_uri,
                        temp_file_path=temp_file_path,
                    )
        except (ImportError, AttributeError):
            pass

        raise FeatureNotAvailableError("Report analysis is not available yet")
