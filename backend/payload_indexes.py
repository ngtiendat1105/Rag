"""Explicit, idempotent provisioning of the payload fields used by RAG filters.

Run ``python backend/payload_indexes.py`` to inspect a remote collection, then
``python backend/payload_indexes.py --apply`` to create missing indexes. Existing
points, vectors, collection settings and correctly typed indexes are preserved.
This is an ingestion/deployment step, never a chat request side effect.
"""

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient, models


REQUIRED_PAYLOAD_INDEXES = {
    "metadata.source_file": models.PayloadSchemaType.KEYWORD,
    "metadata.is_verified": models.PayloadSchemaType.BOOL,
    "metadata.weight": models.PayloadSchemaType.INTEGER,
}


def missing_payload_indexes(client, collection_name: str) -> dict:
    """Return absent indexes, rejecting incompatible existing field types."""
    existing = client.get_collection(collection_name=collection_name).payload_schema or {}
    missing = {}
    for field, expected_type in REQUIRED_PAYLOAD_INDEXES.items():
        if field not in existing:
            missing[field] = expected_type
            continue
        actual_type = existing[field].data_type
        # Numeric range filters work with either numeric index type. Preserve
        # the existing FLOAT index used by older collections and fractional data.
        if field == "metadata.weight" and actual_type in (
            models.PayloadSchemaType.INTEGER, models.PayloadSchemaType.FLOAT
        ):
            continue
        if actual_type != expected_type:
            raise ValueError(
                f"Payload index {field} has type {actual_type}; expected {expected_type}. "
                "Inspect the payload values before changing the index."
            )
    return missing


def ensure_payload_indexes(client, collection_name: str) -> list[str]:
    """Create only absent indexes; fail rather than silently replace schemas."""
    missing = missing_payload_indexes(client, collection_name)
    for field, schema in missing.items():
        client.create_payload_index(
            collection_name=collection_name,
            field_name=field,
            field_schema=schema,
            wait=True,
        )
    # Confirm completion before callers issue strict-mode filtered queries.
    remaining = missing_payload_indexes(client, collection_name)
    if remaining:
        raise RuntimeError(f"Payload indexes not ready: {', '.join(remaining)}")
    return list(missing)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Create missing indexes")
    parser.add_argument("--collection", default="legal_knowledge_base")
    args = parser.parse_args()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env.local")
    url = os.getenv("QDRANT_URL", "").strip()
    if not url:
        parser.error("QDRANT_URL is required; this tool targets remote Qdrant only")
    client = QdrantClient(
        url=url,
        api_key=os.getenv("QDRANT_API_KEY", "").strip() or None,
        timeout=float(os.getenv("QDRANT_TIMEOUT_SECONDS", "30")),
    )
    try:
        if args.apply:
            created = ensure_payload_indexes(client, args.collection)
            print(f"Created indexes: {', '.join(created) if created else 'none (already ready)'}")
        else:
            missing = missing_payload_indexes(client, args.collection)
            print(f"Missing indexes: {', '.join(missing) if missing else 'none'}")
            if missing:
                print("Run again with --apply to create them; vectors will be preserved.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
