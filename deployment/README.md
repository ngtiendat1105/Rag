# Production deployment runbook

## 1. Target layout

See [ARCHITECTURE.md](./ARCHITECTURE.md). Vercel hosts Next.js. A Linux GPU
host runs FastAPI, Qdrant Server, Ollama and Nginx on a private Docker network.
Only TCP 80/443 are exposed publicly.

## 2. Prepare the host

Install Docker Engine/Compose, NVIDIA Container Toolkit (GPU hosts), Git and
Certbot. Allow inbound 80/443 in the cloud security group; deny 6333, 6334,
8000 and 11434. Clone the repository and enter `deployment/`.

Generate secrets without putting them in Git:

```bash
cp .env.example .env
openssl rand -hex 32 # use one value for LEGALAI_API_KEY
openssl rand -hex 32 # use a different value for QDRANT_API_KEY
chmod 600 .env
```

Set `RAG_DOMAIN` and `CORS_ALLOWED_ORIGINS` to the real Vercel/custom domain.

## 3. Migrate the existing local Qdrant

Install the backend requirements on a migration workstation, then run:

```bash
python deployment/scripts/migrate_qdrant.py \
  --local-path backend/vector_db/qdrant_storage \
  --remote-url https://qdrant.internal.example \
  --remote-api-key "$QDRANT_API_KEY"
```

For the bundled Compose stack, use `--remote-url http://127.0.0.1:6333` only
if Qdrant is temporarily published through an SSH tunnel. Do not publish
Qdrant directly to the Internet. Verify point count and run retrieval smoke
tests before switching the API.

## 4. Issue the TLS certificate

Point DNS `api.example.com` at the host. Before starting Nginx, issue a
certificate using a host-installed Certbot and mount/copy its `/etc/letsencrypt`
directory into the `letsencrypt` Docker volume, or use your cloud certificate
manager. The Nginx template expects:

```text
/etc/letsencrypt/live/${RAG_DOMAIN}/fullchain.pem
/etc/letsencrypt/live/${RAG_DOMAIN}/privkey.pem
```

The first deployment should start the included HTTP-only bootstrap override:

```bash
mkdir -p certbot-www letsencrypt
docker compose -f docker-compose.yml -f docker-compose.bootstrap.yml up -d --build
certbot certonly --webroot -w certbot-www \
  -d api.example.com
```

The certificate is now available under the bind-mounted `letsencrypt`
directory. Then stop the bootstrap stack and start the normal compose file so
the HTTPS server block is used.
Renew before expiry and reload Nginx after renewal.

## 5. Start and verify

```bash
docker compose config
docker compose up -d --build
docker compose ps
curl --fail https://api.example.com/health
docker compose logs --tail=200 rag-api
```

The API container pulls the configured Ollama model on first start. Keep the
API at one worker per GPU model instance; scale FastAPI only after moving
Qdrant to a shared server and provisioning enough Ollama concurrency.

## 6. Vercel configuration

Set these server-side variables in Vercel (Production):

```text
RAG_API_URL=https://api.example.com
LEGALAI_API_KEY=<same value as the backend>
RAG_REQUEST_TIMEOUT_MS=300000
```

Do not prefix the API key with `NEXT_PUBLIC_`. Redeploy after changing it.
The existing Next.js route already keeps the key server-side and aborts
requests after the configured timeout.

## 7. Backup and restore

Run backups from `deployment/`:

```bash
QDRANT_API_KEY="$(sed -n 's/^QDRANT_API_KEY=//p' .env)" \
  ./scripts/backup_qdrant.sh
./scripts/restore_qdrant.sh ./backups/qdrant/legal_knowledge_base-*.snapshot
```

Encrypt backup files at rest, copy them to separate object storage, retain
daily/weekly generations, and test restoration monthly. Never commit snapshots
or `.env`.

## 8. Security checklist

- [ ] HTTPS only; redirect HTTP and enable TLS 1.2+.
- [ ] Ports 6333/6334/8000/11434 blocked by firewall and not published.
- [ ] `LEGALAI_API_KEY` and `QDRANT_API_KEY` are random, distinct, rotated,
  and stored in Vercel encrypted variables or AWS Secrets Manager/SSM.
- [ ] CORS contains only the real frontend origins; never use `*` with credentials.
- [ ] Nginx request limits and FastAPI rate limits are enabled.
- [ ] Container images are pinned, scanned, and rebuilt for security updates.
- [ ] Qdrant snapshots and logs are encrypted; access is least-privilege.
- [ ] SSH uses keys, a non-root user, MFA/bastion access and automatic patching.
- [ ] Monitor `/health`, latency, 429/5xx rates, GPU memory and disk usage.
- [ ] Backups are tested and their restore credentials are stored separately.

## 9. High availability evolution

Compose on one VPS is not zone-level HA. For HA, put two or more API replicas
behind an AWS ALB/Cloud Run service, use Qdrant Cloud or a replicated Qdrant
cluster, and run Ollama behind a private GPU load balancer with model capacity
and queue limits. Keep document ingestion as a separate job so API replicas
never rebuild the index concurrently.
