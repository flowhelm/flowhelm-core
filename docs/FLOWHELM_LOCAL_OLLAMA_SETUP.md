# Flowhelm + Ollama (small model) local/server setup

This stack runs:
- Flowhelm gateway container
- Ollama container (local model serving)

## 1) Prepare env

```bash
cp .env.flowhelm-local.example .env.flowhelm-local
# edit token/ports if needed
```

## 2) Start stack

```bash
docker compose --env-file .env.flowhelm-local -f docker-compose.flowhelm-local.yml up -d --build
```

## 3) Pull a small Ollama model

Recommended smallest useful baseline:
- `qwen2.5:0.5b`

```bash
docker exec -it flowhelm-ollama ollama pull qwen2.5:0.5b
```

## 4) Verify

```bash
curl -s http://127.0.0.1:11434/api/tags | jq
curl -s http://127.0.0.1:18789/health || true
```

## 5) Next config step (agent provider)

Point Flowhelm/OpenClaw model config to Ollama endpoint (`http://ollama:11434` from container network or `http://<host>:11434` from host runtime), then pick the local model in model selection.

## Notes

- This is a baseline dev setup (no GPU tuning yet).
- For server production hardening, add reverse proxy, auth boundary, and backup policy for `ollama-data`.
