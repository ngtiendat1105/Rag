# LegalAI: Bedrock generation + Qdrant retrieval

The generation model is `us.amazon.nova-lite-v1:0` in `us-east-1`, invoked with
the Bedrock Converse API. Lambda uses its execution role, not static AWS keys.
The scoped policy in `bedrock-policy.json` targets the current deployment's
account and the three destination Regions of its US Nova Lite profile. Review
these ARNs before using the file in another account or changing models.

The embedding model remains
`sentence-transformers/paraphrase-multilingual-mpnet-base-v2` (768 dimensions).
Changing to Titan embeddings would require a new collection and re-embedding;
do not point Titan query vectors at this existing collection.

## Runtime settings

```dotenv
RAG_LLM_PROVIDER=bedrock
RAG_LLM_MODEL=us.amazon.nova-lite-v1:0
BEDROCK_REGION=us-east-1
LLM_REQUEST_TIMEOUT_SECONDS=18
LLM_MAX_RETRIES=0
RAG_TOP_K=3
RAG_MAX_OUTPUT_TOKENS=700
RAG_MAX_CONTEXT_DOCUMENTS=3
RAG_MAX_CONTEXT_CHARS=8000
```

Keep existing QDRANT_URL, QDRANT_API_KEY and LEGALAI_API_KEY server-side.
GOOGLE_API_KEY is not used by the production Bedrock image. API Gateway and
Amplify's RAG_API_URL and LEGALAI_API_KEY remain the same.

## Before deployment (PowerShell, repository root)

```powershell
.\.venv\Scripts\python.exe -X utf8 backend\payload_indexes.py
.\.venv\Scripts\python.exe -X utf8 backend\payload_indexes.py --apply
.\.venv\Scripts\python.exe -X utf8 -m pytest backend\tests\unit -q
.\.venv\Scripts\python.exe -X utf8 deployment\scripts\verify_bedrock_rag.py
```

The index tool only creates missing payload indexes; existing vectors and
indexes are preserved. Numeric `metadata.weight` indexes may be float or
integer. Mandatory query filters must never be removed after an error.

## Verify deployment

```powershell
.\.venv\Scripts\python.exe -X utf8 deployment\scripts\verify_bedrock_rag.py --lambda-function legalai-rag
.\.venv\Scripts\python.exe -X utf8 deployment\scripts\verify_bedrock_rag.py --api-url https://qacd9d453h.execute-api.us-east-1.amazonaws.com
```

The Bedrock migration is prepared, not enabled in production. Production uses
the original Lambda image and environment restored from version 3. Local
`.env.local` selects Bedrock for optional local testing with the same embedding.
Do not run `switch_lambda_bedrock.py` against the production function until a
deployment is explicitly requested: the production Gateway invokes `$LATEST`,
so updating it changes the live function even before publishing a version.
For a future rollout, validate a separate test function or a fully tested alias
integration first. Test the exact version with `--qualifier VERSION` and the
real Gateway path before promotion.

Tests cover the reported social-insurance query, probation question and an
off-topic question. Keys are read from the environment/.env.local and are not
written into test events on disk. A nonzero exit is a failure, not a completed
deployment. Check CloudWatch for retrieval errors, Bedrock access errors or
timeouts. Do not automatically retry Lambda invokes after a client timeout:
the first invocation may still be running.

## Cold starts

HTTP API's existing integration timeout is 30 seconds. Local embedding imports
and model initialization can exceed that on a new execution environment.
This image removes Gemini/unused dependencies, bounds CPU threads, and loads
the cached model from `/opt/embedding-model` without Hugging Face network calls.
These improvements did not solve the observed Lambda cold start: candidate
version 5 timed out at 120 seconds while importing/loading the local ML stack,
before invoking Bedrock. It was not promoted. Keep production on the old image.
Moving generation to Bedrock alone does not eliminate the local embedding
startup. A future remote embedding migration needs a new vector collection and
separate approval; the existing 768-dimensional collection remains intact.
Reserved concurrency alone does
not keep a function warm; provisioned concurrency would require a separate
deployment/cost decision.

References: [Bedrock Converse](https://docs.aws.amazon.com/nova/latest/userguide/using-converse-api.html),
[cross-Region IAM permissions](https://docs.aws.amazon.com/bedrock/latest/userguide/geographic-cross-region-inference.html),
[Qdrant payload indexes](https://qdrant.tech/documentation/manage-data/indexing/).
