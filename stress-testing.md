# Local Stress Testing Guide

This document contains practical instructions for stress testing your local backend using k6 and Apache JMeter.

## Test Artifacts Available

- `tests/k6/search-and-requests.js` — k6 script that logs in and exercises `/api/search` and `/api/resource-requests`
- `tests/jmeter/starter-testplan.jmx` — minimal JMeter test plan (open in JMeter GUI and extend)
- `tests/k6/users.csv` — test user credentials
- `tests/k6/cleanup-resource-requests.js` — cleanup script for test data
- `tests/k6/grafana-dashboard.json` — Grafana dashboard for visualizing k6 metrics

**Important**: These tests are designed for local development and testing environments. Make sure your local database is backed up or use a separate test database.

---

## k6 (Recommended)

k6 is lightweight, scriptable in JavaScript, and easy to run locally.

### Installation

```bash
# macOS
brew install k6

# Windows (using Chocolatey)
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Or see https://k6.io/docs/getting-started/installation
```

### Running Locally

```bash
# Basic run against local server
BASE_URL=http://localhost:3001 \
TEST_EMAIL=member@demo.com \
TEST_PW=123 \
K6_VUS=20 \
K6_DURATION=30s \
k6 run tests/k6/search-and-requests.js
```

### Advanced Run with Test Run ID

```bash
# Run with test identifier for easy cleanup
TEST_RUN_ID=local-test-001 \
BASE_URL=http://localhost:3001 \
k6 run tests/k6/search-and-requests.js
```

### Custom Load Stages

Override the default stages by setting `K6_STAGES`:

```bash
K6_STAGES='[{"duration":"30s","target":10},{"duration":"2m","target":50},{"duration":"30s","target":0}]' \
BASE_URL=http://localhost:3001 \
k6 run tests/k6/search-and-requests.js
```

### Using Pre-warmed Tokens

The k6 script uses a `setup()` function that pre-logs in all users from `tests/k6/users.csv` before the test starts. This:

- Reduces load on your login endpoint
- Provides each virtual user (VU) with pre-authenticated tokens
- Makes tests more realistic and performant

To use multiple test users, add them to `tests/k6/users.csv`:

```csv
email,password
test1@demo.com,password123
test2@demo.com,password123
test3@demo.com,password123
```

---

## Cleaning Up Test Data

After running write-heavy tests locally, clean up test-created data:

```bash
TEST_RUN_ID=local-test-001 \
DATABASE_URL=postgresql://user:pass@localhost:5432/modheshwari \
node tests/k6/cleanup-resource-requests.js
```

**Requirements**:

- The script uses Prisma (`@prisma/client`)
- Requires `DATABASE_URL` environment variable
- Deletes ResourceRequest rows where `details` contains the `TEST_RUN_ID`

**Warning**: Double-check your DATABASE_URL and TEST_RUN_ID before running!

---

## Apache JMeter

JMeter provides a GUI for building complex test scenarios.

### Installation

Download from [jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi) or use Homebrew:

```bash
brew install jmeter
```

### Running in GUI Mode (Development)

```bash
jmeter -t tests/jmeter/starter-testplan.jmx
```

Use the GUI to:

- Configure thread groups (virtual users)
- Set up CSV data feeders
- Add assertions and listeners
- Build and debug your test plan

### Running in Non-GUI Mode (Load Testing)

```bash
jmeter -n \
  -t tests/jmeter/starter-testplan.jmx \
  -l results.jtl \
  -e \
  -o ./jmeter-report
```

This generates an HTML report in `./jmeter-report/`.

### JMeter Tips

- **CSV Data Set Config**: Feed multiple user credentials to avoid hammering one account
- **JSON Post-Processor**: Extract auth tokens from login responses
- **Regular Expression Extractor**: Parse response data for dynamic values
- **Disable heavy listeners**: During load runs, write to JTL files instead of viewing real-time results

---

## Local Monitoring with InfluxDB + Grafana

### Setup InfluxDB (Docker)

```bash
docker run -d -p 8086:8086 \
  -v influxdb-data:/var/lib/influxdb \
  --name influxdb \
  influxdb:1.8
```

Create a database:

```bash
docker exec influxdb influx -execute 'CREATE DATABASE k6db'
```

### Run k6 with InfluxDB Export

```bash
TEST_RUN_ID=local-test-001 \
BASE_URL=http://localhost:3001 \
k6 run --out influxdb=http://localhost:8086/k6db \
  tests/k6/search-and-requests.js
```

### Setup Grafana (Docker)

```bash
docker run -d -p 3000:3000 \
  --name grafana \
  grafana/grafana
```

Access Grafana at `http://localhost:3000` (default login: admin/admin)

### Import Dashboard

1. Add InfluxDB as a datasource in Grafana:
   - Name it `K6_INFLUX`
   - URL: `http://localhost:8086`
   - Database: `k6db`
2. Import the dashboard:
   - Go to Dashboards → Import
   - Upload `tests/k6/grafana-dashboard.json`
   - Select the `K6_INFLUX` datasource

---

## Test Scenarios

### 1. Read-Heavy (Cache & DB Read Performance)

```bash
# Mostly GET requests to search and user endpoints
K6_VUS=50 K6_DURATION=2m \
BASE_URL=http://localhost:3001 \
k6 run tests/k6/search-and-requests.js
```

### 2. Write-Heavy (DB Writes & Transactions)

```bash
# Focus on POST /api/resource-requests
# Use test database!
TEST_RUN_ID=write-test-001 \
K6_VUS=30 K6_DURATION=1m \
BASE_URL=http://localhost:3001 \
k6 run tests/k6/search-and-requests.js
```

### 3. Spike Test (Sudden Load Increase)

```bash
K6_STAGES='[{"duration":"10s","target":100},{"duration":"30s","target":100},{"duration":"10s","target":0}]' \
BASE_URL=http://localhost:3001 \
k6 run tests/k6/search-and-requests.js
```

### 4. Soak Test (Extended Duration)

```bash
K6_VUS=20 K6_DURATION=30m \
BASE_URL=http://localhost:3001 \
k6 run tests/k6/search-and-requests.js
```

---

## Metrics to Monitor

### From k6 Output

- **p50/p95/p99 latency**: Response time percentiles
- **Error rate**: 4xx/5xx responses
- **Throughput**: Requests per second
- **VU activity**: Virtual users active over time

### From Your Local System

- **CPU usage**: Watch for 100% utilization
- **Memory**: Check for memory leaks
- **Database**:
  - Connection pool usage
  - Query latencies
  - Lock contention
- **Node.js metrics**: Event loop lag, heap size

### Useful Tools for Local Monitoring

```bash
# Database connections
psql -U youruser -d modheshwari -c "SELECT count(*) FROM pg_stat_activity;"

# System resources
htop  # or top on macOS
```

---

## Safety Guidelines

1. **Use a test database** for write-heavy tests

   ```bash
   # Example: separate test DB
   DATABASE_URL=postgresql://user:pass@localhost:5432/modheshwari_test
   ```

2. **Backup your local database** before running destructive tests

   ```bash
   pg_dump modheshwari > backup_before_test.sql
   ```

3. **Disable external side effects**:
   - Mock email services
   - Disable push notifications
   - Stub third-party API calls

4. **Start small**: Begin with 5-10 VUs and gradually increase

5. **Clean up test data** after each run using the cleanup script

---

## Quick Reference

| Command                                    | Purpose            |
| ------------------------------------------ | ------------------ |
| `k6 run script.js`                         | Run basic k6 test  |
| `k6 run --vus 50 --duration 30s script.js` | Quick load test    |
| `k6 run --out influxdb=...`                | Export to InfluxDB |
| `jmeter -n -t plan.jmx -l results.jtl`     | Run JMeter in CLI  |
| `node cleanup-resource-requests.js`        | Clean test data    |

---

so we did stress testing,
8,991 total HTTP requests made
4,883 succeeded (54%)
4,108 failed (46%, mostly 429 rate limits)

Real Success Rate
Out of actual HTTP requests:

✅ 54% succeeded (4,883 requests)
❌ 46% failed (4,108 requests, mostly 429s)

Search endpoint specifically:

❌ 99.3% failed (30 succeeded, 4,108 failed)
This is because search is heavily rate limited

Other endpoints:

✅ Resource request list: passed
✅ Admin requests: passed
✅ Create resource request: passed

Your stress test worked, but:

Search is heavily rate limited (429s) ← Expected
Response times are decent (p95 = 1.2s) ← Acceptable
The crazy error count is just a metric bug (VUs with no token looping)
