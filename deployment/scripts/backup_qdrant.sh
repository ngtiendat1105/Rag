#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups/qdrant}"
COLLECTION="${QDRANT_COLLECTION:-legal_knowledge_base}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/${COLLECTION}-${STAMP}.snapshot"

docker compose exec -T qdrant sh -c \
  "wget -qO- --header='api-key: ${QDRANT_API_KEY}' \
  --post-data='' http://127.0.0.1:6333/collections/${COLLECTION}/snapshots" \
  > "$BACKUP_DIR/${COLLECTION}-${STAMP}.json"

SNAPSHOT_NAME="$(sed -n 's/.*\"name\":\"\([^\"]*\)\".*/\1/p' "$BACKUP_DIR/${COLLECTION}-${STAMP}.json")"
if [ -z "$SNAPSHOT_NAME" ]; then
  echo "Qdrant did not return a snapshot name" >&2
  exit 1
fi

docker compose cp "qdrant:/qdrant/snapshots/${SNAPSHOT_NAME}" "$FILE"
rm -f "$BACKUP_DIR/${COLLECTION}-${STAMP}.json"
echo "Created $FILE"
