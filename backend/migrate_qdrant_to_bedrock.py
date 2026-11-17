"""Re-embed the existing Qdrant collection with Bedrock Titan V2.

The source collection is never modified or deleted. The target collection is
created separately so production can be switched back by changing one env var.
"""

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models

from bedrock_embedder import BedrockEmbedder


def client_from_env() -> QdrantClient:
    url = os.environ.get("QDRANT_URL", "").strip()
    if not url:
        raise RuntimeError("QDRANT_URL is required")
    return QdrantClient(
        url=url,
        api_key=os.environ.get("QDRANT_API_KEY", "").strip() or None,
        timeout=float(os.environ.get("QDRANT_TIMEOUT_SECONDS", "60")),
    )


def ensure_indexes(client: QdrantClient, collection: str) -> None:
    for field, schema in (
        ("metadata.source_file", models.PayloadSchemaType.KEYWORD),
        ("metadata.is_verified", models.PayloadSchemaType.BOOL),
        ("metadata.weight", models.PayloadSchemaType.FLOAT),
    ):
        try:
            client.create_payload_index(collection, field, schema, wait=True)
        except Exception as exc:
            if "already exists" not in str(exc).lower():
                raise


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=os.getenv("QDRANT_COLLECTION", "legal_knowledge_base"))
    parser.add_argument("--target", default="legal_knowledge_base_titan_v2_1024")
    parser.add_argument("--batch-size", type=int, default=16)
    args = parser.parse_args()

    client = client_from_env()
    embedder = BedrockEmbedder(
        model_name=os.getenv("RAG_EMBEDDING_MODEL", "amazon.titan-embed-text-v2:0"),
        dimension=int(os.getenv("RAG_EMBEDDING_DIMENSION", "1024")),
        region_name=os.getenv("BEDROCK_REGION", "us-east-1"),
    )
    source_info = client.get_collection(args.source)
    source_count = client.count(args.source, exact=True).count
    target_names = {item.name for item in client.get_collections().collections}
    if args.target not in target_names:
        client.create_collection(
            collection_name=args.target,
            vectors_config=models.VectorParams(size=embedder.get_embedding_dimension(), distance=models.Distance.COSINE),
            hnsw_config=models.HnswConfigDiff(m=16, ef_construct=100),
            optimizers_config=models.OptimizersConfigDiff(default_segment_number=2),
        )
    ensure_indexes(client, args.target)

    existing_ids = set()
    target_offset = None
    while True:
        target_points, target_offset = client.scroll(
            collection_name=args.target, limit=256, offset=target_offset,
            with_payload=False, with_vectors=False,
        )
        existing_ids.update(point.id for point in target_points)
        if target_offset is None:
            break

    offset = None
    migrated = 0
    while True:
        points, offset = client.scroll(
            collection_name=args.source,
            limit=args.batch_size,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        if not points:
            break
        points = [point for point in points if point.id not in existing_ids]
        if not points:
            if offset is None:
                break
            continue
        vectors = []
        for point in points:
            payload = point.payload or {}
            content = payload.get("content") or ""
            if not content.strip():
                raise RuntimeError(f"Point {point.id} has no content payload")
            # Titan V2 accepts at most 8192 tokens. The source chunks are
            # retained verbatim in payload; only the embedding input is capped.
            embedding_input = content[:20000]
            while True:
                try:
                    vectors.append(embedder.embed_text(embedding_input).tolist())
                    break
                except RuntimeError as exc:
                    if "Too many input tokens" not in str(exc) or len(embedding_input) < 4000:
                        raise
                    embedding_input = embedding_input[: int(len(embedding_input) * 0.65)]
        client.upsert(
            collection_name=args.target,
            points=[
                models.PointStruct(id=point.id, vector=vector, payload=point.payload)
                for point, vector in zip(points, vectors)
            ],
            wait=True,
        )
        migrated += len(points)
        existing_ids.update(point.id for point in points)
        print(f"Migrated {migrated}/{source_count} points")
        if offset is None:
            break

    target_count = client.count(args.target, exact=True).count
    if target_count != source_count:
        raise RuntimeError(f"Migration count mismatch: source={source_count}, target={target_count}")
    print(f"Migration complete: {args.source} -> {args.target}, points={target_count}, dim={embedder.get_embedding_dimension()}")


if __name__ == "__main__":
    load_dotenv(Path(__file__).resolve().parents[1] / ".env.local", override=False)
    main()

