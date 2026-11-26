import pytest
from app.services.firestore import get_default_firestore_service
from app.services.storage import get_default_storage_service


@pytest.fixture(autouse=True)
def clean_memory_stores():
    """Ensure every automated test runs against a clean, isolated in-memory mock store."""
    fs = get_default_firestore_service()
    fs.use_mock = True
    if hasattr(fs, "_memory_store"):
        fs._memory_store.clear()

    storage = get_default_storage_service()
    storage.use_mock = True
    if hasattr(storage, "_mock_storage"):
        storage._mock_storage.clear()

    yield
