"""Copy a local Qdrant collection to a remote Qdrant server.

Run this from a machine that can read the local storage and reach QDRANT_URL.
The destination collection is created only when it does not already exist.
"""

import argparse
import os
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.http import models


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--local-path", required=True)
    parser.add_argument("--remote-url", required=True)
    parser.add_argument("--remote-api-key", default=os.getenv("QDRANT_API_KEY"))
    parser.add_argument("--collection", default="legal_knowledge_base")
    parser.add_argument("--batch-size", type=int, default=128)
    args = parser.parse_args()

    local_path = Path(args.local_path)
    if not local_path.exists():
        raise SystemExit(f"Local Qdrant path does not exist: {local_path}")

    source = QdrantClient(path=str(local_path))
    target = QdrantClient(
        url=args.remote_url,
        api_key=args.remote_api_key or None,
        timeout=30,
    )
    source_info = source.get_collection(args.collection)
    if not target.collection_exists(args.collection):
        params = source_info.config.params
        target.create_collection(
            collection_name=args.collection,
            vectors_config=models.VectorParams(
                size=params.vectors.size,
                distance=params.vectors.distance,
            ),
        )

    offset = None
    copied = 0
    while True:
        points, offset = source.scroll(
            collection_name=args.collection,
            limit=args.batch_size,
            offset=offset,
            with_vectors=True,
            with_payload=True,
        )
        if not points:
            break
        target.upsert(collection_name=args.collection, points=points, wait=True)
        copied += len(points)
        print(f"Copied {copied} points")
        if offset is None:
            break

    print(f"Migration complete: {copied} points -> {args.remote_url}/{args.collection}")


if __name__ == "__main__":
    main()
