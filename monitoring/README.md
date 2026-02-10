# Monitoring Stack — Modheshwari

This folder contains configs to run a simple Prometheus + Grafana stack for the backend.

Prerequisites
- Docker & Docker Compose
- The backend (`be`) must be reachable on Docker network as host `be` and listening on port `3001` (or update `monitoring/prometheus.yml` targets).

Quick start

```bash
# from repository root
docker compose -f docker-compose.monitoring.yml up -d
```

Accessing UIs
- Prometheus: http://localhost:9090
 - Grafana: http://localhost:3005 (user: `admin`, password: `admin`)

What is included
- `docker-compose.monitoring.yml` — launches Prometheus and Grafana
- `monitoring/prometheus.yml` — Prometheus scrape config (scrapes `http://be:3001/metrics`)
- `monitoring/grafana/provisioning` — Grafana datasource + a sample dashboard

Notes
- If running the backend locally (not in Docker), either run the backend in a container named `be` or update `monitoring/prometheus.yml` to point at your host (e.g. `host.docker.internal:3001`).
- The backend exposes `/metrics` implemented with `prom-client` and provides default metrics plus an HTTP request histogram.

Next steps (suggested)
- Add alerting rules to Prometheus or configure Grafana alerts. (Included in this repo as `monitoring/alert.rules.yml`.)
- Add Loki + promtail to collect application logs if you want log-based metrics and dashboards. (Included: `promtail-config.yml`, `loki` service.)

Bringing the stack up

```bash
# from repository root
docker compose -f docker-compose.monitoring.yml up -d
```

Notes about Promtail
- Promtail is configured to read Docker container logs from `/var/lib/docker/containers/*/*.log`. On macOS/ Docker Desktop this path may differ — if logs aren't visible, change `__path__` in `monitoring/promtail-config.yml` to the correct path or run Promtail on the host.

Alerting rules
- Alerts are defined in `monitoring/alert.rules.yml` and Prometheus is configured to talk to Alertmanager at `alertmanager:9093`.
- Alertmanager uses a minimal `dev-null` receiver by default — update `monitoring/alertmanager.yml` to integrate email, Slack, or PagerDuty.
 - Alertmanager has a placeholder PagerDuty receiver in `monitoring/alertmanager.yml`. Replace `REPLACE_WITH_PAGERDUTY_INTEGRATION_KEY` with your integration key to enable PagerDuty notifications.

Dashboards added
 - `request-duration` — p95 latency histogram (already provisioned)
 - `errors-and-rps` — error rate and request-per-second
 - `logs-overview` — recent error logs and log-rate (requires Loki/Promtail)

Additional provisioned dashboards (richer):
 - `backend-overview` — request rate, error rate, process CPU/memory, firing alerts
 - `latency-percentiles` — p50/p95/p99 panels and latency by route
 - `top-endpoints` — top endpoints by RPS and p95 latency per route

To enable alerts to PagerDuty, provide your integration key and restart Alertmanager:

```bash
# edit monitoring/alertmanager.yml and set the routing key
docker compose -f docker-compose.monitoring.yml up -d alertmanager
```
