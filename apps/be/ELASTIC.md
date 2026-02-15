Elasticsearch (Elastic Cloud) integration
=======================================

Quick notes to get started locally or with Elastic Cloud.

Environment variables (recommended):

- `ELASTIC_CLOUD_ID` — Elastic Cloud ID (preferred for Elastic Cloud)
- `ELASTIC_API_KEY` — API key for the cluster (preferred)
- `ELASTIC_USERNAME` / `ELASTIC_PASSWORD` — alternative to API key
- `ELASTIC_NODE` — fallback node URL (e.g. http://localhost:9200)

Setup indices (creates `users` and `events`):

```bash
cd apps/be
# install dependencies (use the package manager you prefer)
bun add @elastic/elasticsearch

# then run the setup script
bun run scripts/setup-elastic.ts
```

Notes:
- The script attempts to detect an existing index and will skip creation if present.
- Mappings include an `edge_ngram` analyzer for simple autocomplete/suggestions and `geo_point` fields for geo queries.
- Indexing on writes should be implemented asynchronously (a worker or background job) to avoid blocking API responses.
