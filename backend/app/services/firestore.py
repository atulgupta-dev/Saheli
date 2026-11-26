from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List, Optional
from google.cloud import firestore
from app.core.config import settings
from app.core.models import (
    ConsentPreferences,
    PregnancyStageProfile,
    UserProfileResponse,
)

logger = logging.getLogger("saheli.firestore")


def _utc_now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


class FirestoreService:
    """
    Manages persistence for users and subcollections conforming to docs/ARCHITECTURE.md.
    Supports live Google Cloud Firestore with automatic in-memory fallback for local/testing.
    All operations are strictly scoped to users/{uid}.
    """

    def __init__(self, client: Optional[firestore.Client] = None, use_mock: bool = False):
        self.use_mock = use_mock
        self._client = client
        # In-memory store: {uid: {"profile": {...}, "stage_profiles": {...}, "conversations": {...}, ...}}
        self._memory_store: Dict[str, Dict[str, Any]] = {}

        if not self.use_mock and self._client is None:
            try:
                from app.core.firebase import get_service_account_info
                sa_info = get_service_account_info(settings)
                if sa_info:
                    from google.oauth2 import service_account
                    creds = service_account.Credentials.from_service_account_info(sa_info)
                    self._client = firestore.Client(project=settings.FIREBASE_PROJECT_ID, credentials=creds)
                    logger.info(f"Connected to Cloud Firestore using service account ({settings.FIREBASE_PROJECT_ID})")
                else:
                    self._client = firestore.Client(project=settings.GOOGLE_CLOUD_PROJECT)
                    logger.info(f"Connected to Cloud Firestore via ADC ({settings.GOOGLE_CLOUD_PROJECT})")
            except Exception as exc:
                logger.warning(f"Could not connect to live Cloud Firestore ({type(exc).__name__}). Using in-memory fallback.")
                self.use_mock = True

    # ---------------------------------------------------------
    # User Profile & Stage Operations
    # ---------------------------------------------------------

    def get_user_profile(self, uid: str) -> Optional[UserProfileResponse]:
        """Fetch user document and all stage profiles under users/{uid}."""
        if self.use_mock:
            user_data = self._memory_store.get(uid)
            if not user_data:
                return None
            profile = user_data.get("profile", {})
            stage_profiles = user_data.get("stage_profiles", {})
            return UserProfileResponse(
                user_id=uid,
                active_stage=profile.get("active_stage", "pregnancy"),
                locale=profile.get("locale", "hi-IN"),
                consent=ConsentPreferences(**profile.get("consent", {})),
                stage_profiles=stage_profiles,
                display_name=profile.get("display_name"),
                photo_url=profile.get("photo_url"),
                auth_provider=profile.get("auth_provider"),
            )

        assert self._client is not None
        user_ref = self._client.collection("users").document(uid)
        user_doc = user_ref.get()
        if not user_doc.exists:
            return None

        data = user_doc.to_dict() or {}
        # Fetch stage profiles subcollection
        stage_profiles: Dict[str, Any] = {}
        stage_docs = user_ref.collection("stage_profiles").stream()
        for doc in stage_docs:
            stage_profiles[doc.id] = doc.to_dict()

        return UserProfileResponse(
            user_id=uid,
            active_stage=data.get("active_stage", "pregnancy"),
            locale=data.get("locale", "hi-IN"),
            consent=ConsentPreferences(**data.get("consent", {})),
            stage_profiles=stage_profiles,
            display_name=data.get("display_name"),
            photo_url=data.get("photo_url"),
            auth_provider=data.get("auth_provider"),
        )

    def create_or_get_user_profile(
        self,
        uid: str,
        email: Optional[str] = None,
        display_name: Optional[str] = None,
        photo_url: Optional[str] = None,
        auth_provider: Optional[str] = None,
        initial_stage: str = "pregnancy",
        initial_locale: str = "hi-IN",
    ) -> UserProfileResponse:
        """
        Fetch existing profile or create a default user profile.
        CRITICAL: Never resets active stage, stage profiles, or symptom history for returning users.
        """
        existing = self.get_user_profile(uid)
        if existing:
            # Optionally sync display_name/photo_url/auth_provider if provided
            updates: Dict[str, Any] = {}
            if display_name and not existing.display_name:
                updates["display_name"] = display_name
            if photo_url and not existing.photo_url:
                updates["photo_url"] = photo_url
            if auth_provider and not existing.auth_provider:
                updates["auth_provider"] = auth_provider

            if updates:
                updates["updated_at"] = _utc_now_iso()
                if self.use_mock:
                    self._memory_store[uid]["profile"].update(updates)
                elif self._client is not None:
                    self._client.collection("users").document(uid).update(updates)
                return self.get_user_profile(uid) or existing
            return existing

        now = _utc_now_iso()
        default_profile = {
            "active_stage": initial_stage,
            "locale": initial_locale,
            "email": email,
            "display_name": display_name,
            "photo_url": photo_url,
            "auth_provider": auth_provider,
            "consent": {
                "store_conversations": True,
                "store_reports": False,
            },
            "created_at": now,
            "updated_at": now,
        }
        default_stage_profiles = {
            "pregnancy": {"gestational_week": 28, "updated_at": now}
        }

        if self.use_mock:
            self._memory_store[uid] = {
                "profile": default_profile,
                "stage_profiles": default_stage_profiles,
                "conversations": {},
                "symptom_entries": {},
                "reports": {},
                "care_events": {},
            }
            return UserProfileResponse(
                user_id=uid,
                active_stage=initial_stage,  # type: ignore[arg-type]
                locale=initial_locale,
                consent=ConsentPreferences(**default_profile["consent"]),
                stage_profiles=default_stage_profiles,
                display_name=display_name,
                photo_url=photo_url,
                auth_provider=auth_provider,
            )

        assert self._client is not None
        user_ref = self._client.collection("users").document(uid)
        user_ref.set(default_profile)
        # Create default pregnancy stage profile document
        user_ref.collection("stage_profiles").document("pregnancy").set(default_stage_profiles["pregnancy"])

        return UserProfileResponse(
            user_id=uid,
            active_stage=initial_stage,  # type: ignore[arg-type]
            locale=initial_locale,
            consent=ConsentPreferences(**default_profile["consent"]),
            stage_profiles=default_stage_profiles,
            display_name=display_name,
            photo_url=photo_url,
            auth_provider=auth_provider,
        )

    def update_active_stage(self, uid: str, new_stage: str) -> UserProfileResponse:
        """
        Switch active stage for user.
        CRITICAL: Never deletes previous history or stage profiles.
        """
        now = _utc_now_iso()
        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            self._memory_store[uid]["profile"]["active_stage"] = new_stage
            self._memory_store[uid]["profile"]["updated_at"] = now
            return self.get_user_profile(uid)  # type: ignore[return-value]

        assert self._client is not None
        user_ref = self._client.collection("users").document(uid)
        user_doc = user_ref.get()
        if not user_doc.exists:
            self.create_or_get_user_profile(uid, initial_stage=new_stage)
        else:
            user_ref.update({
                "active_stage": new_stage,
                "updated_at": now,
            })
        return self.get_user_profile(uid)  # type: ignore[return-value]

    def set_stage_profile(self, uid: str, stage: str, stage_data: Dict[str, Any]) -> None:
        """Persist stage-specific profile fields under users/{uid}/stage_profiles/{stage}."""
        stage_data["updated_at"] = _utc_now_iso()
        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            self._memory_store[uid]["stage_profiles"][stage] = stage_data
            return

        assert self._client is not None
        user_ref = self._client.collection("users").document(uid)
        user_ref.collection("stage_profiles").document(stage).set(stage_data, merge=True)

    def get_stage_profile(self, uid: str, stage: str) -> Optional[Dict[str, Any]]:
        """Retrieve stage-specific profile fields under users/{uid}/stage_profiles/{stage}."""
        if self.use_mock:
            user_data = self._memory_store.get(uid)
            if not user_data:
                return None
            return user_data.get("stage_profiles", {}).get(stage)

        assert self._client is not None
        doc = self._client.collection("users").document(uid).collection("stage_profiles").document(stage).get()
        return doc.to_dict() if doc.exists else None

    # ---------------------------------------------------------
    # Subcollections (Scoped strictly under users/{uid}/...)
    # ---------------------------------------------------------

    def save_conversation_message(self, uid: str, conversation_id: str, message_data: Dict[str, Any]) -> str:
        """Store message under users/{uid}/conversations/{id}/messages."""
        message_data["timestamp"] = _utc_now_iso()
        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            convs = self._memory_store[uid].setdefault("conversations", {})
            conv = convs.setdefault(conversation_id, {"messages": []})
            conv["messages"].append(message_data)
            conv["updated_at"] = _utc_now_iso()
            return conversation_id

        assert self._client is not None
        conv_ref = self._client.collection("users").document(uid).collection("conversations").document(conversation_id)
        conv_ref.set({"updated_at": _utc_now_iso()}, merge=True)
        conv_ref.collection("messages").add(message_data)
        return conversation_id

    def save_symptom_entry(self, uid: str, entry_id: str, entry_data: Dict[str, Any]) -> str:
        """Store symptom journal entry under users/{uid}/symptom_entries/{id}."""
        entry_data["created_at"] = _utc_now_iso()
        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            self._memory_store[uid].setdefault("symptom_entries", {})[entry_id] = entry_data
            return entry_id

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("symptom_entries").document(entry_id)
        doc_ref.set(entry_data)
        return entry_id

    def save_report_metadata(self, uid: str, report_id: str, report_data: Dict[str, Any]) -> None:
        """Store report analysis metadata under users/{uid}/reports/{id}."""
        report_data["user_id"] = uid
        report_data["report_id"] = report_id
        report_data["created_at"] = _utc_now_iso()

        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            self._memory_store[uid].setdefault("reports", {})[report_id] = report_data
            return

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("reports").document(report_id)
        doc_ref.set(report_data)

    def get_report_metadata(self, uid: str, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch report metadata strictly scoped to the authenticated user.
        Cross-user access is impossible.
        """
        if self.use_mock:
            user_data = self._memory_store.get(uid)
            if not user_data:
                return None
            return user_data.get("reports", {}).get(report_id)

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("reports").document(report_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
        return doc.to_dict()

    def save_care_event(self, uid: str, event_id: str, event_data: Dict[str, Any]) -> str:
        """Store care event under users/{uid}/care_events/{id}."""
        event_data["created_at"] = _utc_now_iso()
        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            self._memory_store[uid].setdefault("care_events", {})[event_id] = event_data
            return event_id

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("care_events").document(event_id)
        doc_ref.set(event_data)
        return event_id

    # ---------------------------------------------------------
    # Menstrual Health Subcollections (users/{uid}/...)
    # ---------------------------------------------------------

    def save_menstrual_cycle(self, uid: str, cycle_id: str, cycle_data: Dict[str, Any]) -> None:
        """Store or update a menstrual cycle record under users/{uid}/menstrual_cycles/{cycle_id}."""
        now = _utc_now_iso()
        cycle_data["updated_at"] = now
        if "created_at" not in cycle_data:
            cycle_data["created_at"] = now

        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            cycles = self._memory_store[uid].setdefault("menstrual_cycles", {})
            cycles[cycle_id] = cycle_data
            return

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("menstrual_cycles").document(cycle_id)
        doc_ref.set(cycle_data, merge=True)

    def get_menstrual_cycle(self, uid: str, cycle_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific menstrual cycle record strictly scoped to users/{uid}."""
        if self.use_mock:
            user_data = self._memory_store.get(uid)
            if not user_data:
                return None
            return user_data.get("menstrual_cycles", {}).get(cycle_id)

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("menstrual_cycles").document(cycle_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
        return doc.to_dict()

    def list_menstrual_cycles(self, uid: str) -> List[Dict[str, Any]]:
        """List all menstrual cycle records for the authenticated user, sorted by start_date ascending."""
        if self.use_mock:
            user_data = self._memory_store.get(uid)
            if not user_data:
                return []
            cycles = list(user_data.get("menstrual_cycles", {}).values())
            return sorted(cycles, key=lambda c: c.get("start_date", ""))

        assert self._client is not None
        coll_ref = self._client.collection("users").document(uid).collection("menstrual_cycles")
        docs = coll_ref.order_by("start_date").stream()
        return [doc.to_dict() for doc in docs]

    def delete_menstrual_cycle(self, uid: str, cycle_id: str) -> bool:
        """Delete a menstrual cycle record under users/{uid}/menstrual_cycles/{cycle_id}."""
        if self.use_mock:
            user_data = self._memory_store.get(uid)
            if not user_data or "menstrual_cycles" not in user_data:
                return False
            cycles = user_data["menstrual_cycles"]
            if cycle_id in cycles:
                del cycles[cycle_id]
                return True
            return False

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("menstrual_cycles").document(cycle_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False
        doc_ref.delete()
        return True

    def save_menstrual_symptom(self, uid: str, entry_id: str, entry_data: Dict[str, Any]) -> str:
        """Store menstrual symptom record under users/{uid}/menstrual_symptoms/{entry_id}."""
        entry_data["created_at"] = _utc_now_iso()
        if self.use_mock:
            if uid not in self._memory_store:
                self.create_or_get_user_profile(uid)
            self._memory_store[uid].setdefault("menstrual_symptoms", {})[entry_id] = entry_data
            return entry_id

        assert self._client is not None
        doc_ref = self._client.collection("users").document(uid).collection("menstrual_symptoms").document(entry_id)
        doc_ref.set(entry_data)
        return entry_id

    def list_menstrual_symptoms(self, uid: str) -> List[Dict[str, Any]]:
        """List all menstrual symptoms for user sorted by date descending."""
        if self.use_mock:
            user_data = self._memory_store.get(uid)
            if not user_data:
                return []
            symptoms = list(user_data.get("menstrual_symptoms", {}).values())
            return sorted(symptoms, key=lambda s: s.get("date", ""), reverse=True)

        assert self._client is not None
        coll_ref = self._client.collection("users").document(uid).collection("menstrual_symptoms")
        docs = coll_ref.order_by("date", direction="DESCENDING").stream()
        return [doc.to_dict() for doc in docs]


_default_firestore_service: Optional[FirestoreService] = None


def get_default_firestore_service() -> FirestoreService:
    global _default_firestore_service
    if _default_firestore_service is None:
        _default_firestore_service = FirestoreService()
    return _default_firestore_service
