from __future__ import annotations

import contextlib
import io
import logging
import os
import re
import tempfile
from typing import Generator, Optional
from app.core.config import Settings, settings as app_settings
from app.core.exceptions import FileTooLargeError, UnsupportedMediaTypeError

logger = logging.getLogger("saheli.storage")

# Magic byte signatures for supported report formats
MAGIC_SIGNATURES = {
    "application/pdf": b"%PDF-",
    "image/jpeg": b"\xff\xd8\xff",
    "image/jpg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
}


class StorageService:
    """
    Manages document validation and ephemeral in-memory processing.
    Fully compatible with Firebase Spark (Free) plan without requiring active Cloud Storage bucket.
    """

    def __init__(self, use_mock: bool = True, cfg: Optional[Settings] = None):
        self.config = cfg or app_settings
        self.use_mock = use_mock
        self.bucket_name = self.config.GOOGLE_CLOUD_STORAGE_BUCKET
        self._client = None

        # On Spark plan, Cloud Storage is unavailable; we default to in-memory/ephemeral mode
        if not self.use_mock:
            try:
                from google.cloud import storage
                self._client = storage.Client(project=self.config.GOOGLE_CLOUD_PROJECT)
                logger.info("Connected to Cloud Storage")
            except Exception as exc:
                logger.info(f"Cloud Storage not active ({type(exc).__name__}). Using Spark-compatible ephemeral processing.")
                self.use_mock = True

    def validate_file(self, content_type: Optional[str], file_bytes: bytes) -> None:
        """Verify upload size, declared MIME type, and binary magic bytes."""
        file_size = len(file_bytes)

        if not content_type or content_type.lower() not in self.config.ALLOWED_UPLOAD_MIME_TYPES:
            raise UnsupportedMediaTypeError(
                f"Content-Type '{content_type}' is not supported. Allowed: {', '.join(self.config.ALLOWED_UPLOAD_MIME_TYPES)}"
            )

        if file_size > self.config.MAX_UPLOAD_SIZE_BYTES:
            raise FileTooLargeError(
                f"File size ({file_size} bytes) exceeds maximum limit of {self.config.MAX_UPLOAD_SIZE_BYTES} bytes"
            )

        # Validate binary file signatures (magic bytes) to prevent spoofing
        ct_clean = content_type.lower().strip()
        expected_magic = MAGIC_SIGNATURES.get(ct_clean)
        if expected_magic and not file_bytes.startswith(expected_magic):
            raise UnsupportedMediaTypeError(
                f"File content does not match declared MIME type '{content_type}'. Corrupted or invalid file signature."
            )

    @contextlib.contextmanager
    def ephemeral_temp_file(self, filename: str, file_bytes: bytes) -> Generator[str, None, None]:
        """
        Write file to a temporary location for downstream extraction and guarantee immediate deletion.
        Ensures zero persistent file leakage on Render Free / Spark plan.
        """
        safe_ext = os.path.splitext(filename)[1] or ".bin"
        temp_fd, temp_path = tempfile.mkstemp(prefix="saheli_report_", suffix=safe_ext)
        try:
            with os.fdopen(temp_fd, "wb") as f:
                f.write(file_bytes)
            yield temp_path
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    logger.debug(f"Ephemeral file securely removed: {temp_path}")
                except Exception as exc:
                    logger.warning(f"Could not remove temp file {temp_path}: {exc}")

    def build_object_path(self, uid: str, report_id: str, filename: str) -> str:
        """Construct scoped path: users/{uid}/reports/{report_id}/{safe_filename}."""
        safe_filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename or "unnamed_document")
        return f"users/{uid}/reports/{report_id}/{safe_filename}"

    def upload_report_file(
        self,
        uid: str,
        report_id: str,
        filename: str,
        file_bytes: bytes,
        content_type: str,
        consent_to_store: bool,
    ) -> Optional[str]:
        """
        Spark-compatible upload handler.
        If consent_to_store is False, the document is never stored.
        On Spark plan, returns ephemeral reference or gs:// URI if live GCS is active.
        """
        self.validate_file(content_type, file_bytes)

        if not consent_to_store:
            logger.info(f"User {uid} opted out of storage consent (consent_to_store=False). Original document will not be retained.")
            return None

        # On Firebase Spark / Render Free, we do not require a paid GCS bucket
        if self.use_mock or self._client is None:
            logger.info(f"[Spark Plan Ephemeral] Processed {len(file_bytes)} bytes for report {report_id} without persistent bucket.")
            return None

        # If Cloud Storage is configured in future
        try:
            object_path = self.build_object_path(uid, report_id, filename)
            bucket = self._client.bucket(self.bucket_name)
            blob = bucket.blob(object_path)
            blob.upload_from_file(io.BytesIO(file_bytes), content_type=content_type)
            logger.info(f"Uploaded {object_path} to gs://{self.bucket_name}")
            return f"gs://{self.bucket_name}/{object_path}"
        except Exception as exc:
            logger.warning(f"Cloud Storage upload skipped on Spark plan ({type(exc).__name__}). Using ephemeral metadata.")
            return None


_default_storage_service: Optional[StorageService] = None


def get_default_storage_service() -> StorageService:
    global _default_storage_service
    if _default_storage_service is None:
        _default_storage_service = StorageService(use_mock=True)
    return _default_storage_service
