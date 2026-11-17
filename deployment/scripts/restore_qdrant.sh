#!/usr/bin/env sh
set -eu

SNAPSHOT="${1:?Usage: restore_qdrant.sh path/to/snapshot}"
COLLECTION="${QDRANT_COLLECTION:-legal_knowledge_base}"
test -f "$SNAPSHOT" || { echo "Snapshot not found: $SNAPSHOT" >&2; exit 1; }

docker compose cp "$SNAPSHOT" "qdrant:/qdrant/snapshots/restore.snapshot"
docker compose exec -T qdrant sh -c \
  "curl --fail --silent --show-error -X PUT \
  -H 'api-key: ${QDRANT_API_KEY}' \
  'http://127.0.0.1:6333/collections/${COLLECTION}/snapshots/restore.snapshot'"
echo "Restore requested for $COLLECTION"
