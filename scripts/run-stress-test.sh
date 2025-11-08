#!/usr/bin/env bash
set -euo pipefail

# Orchestrator for stress tests. Usage examples:
#   # basic k6 run (uses local k6 if available, otherwise Docker)
#   TEST_RUN_ID=myrun BASE_URL=http://localhost:3001 bun run stress-test
#
#   # export metrics to InfluxDB
#   TEST_RUN_ID=myrun BASE_URL=http://localhost:3001 INFLUX_URL=http://localhost:8086/k6db bun run stress-test
#
# Optional env vars:
#   RUN_JMETER=true    -> run JMeter (Docker image) after k6
#   CLEANUP=true       -> run cleanup script to remove test-created ResourceRequests (requires DATABASE_URL)
#   K6_SCRIPT=...      -> path to k6 script (default tests/k6/search-and-requests.js)
#

BASE_URL=${BASE_URL:-http://localhost:3001}
TEST_RUN_ID=${TEST_RUN_ID:-k6-run-$(date +%s)}
K6_SCRIPT=${K6_SCRIPT:-tests/k6/search-and-requests.js}
USERS_CSV=${USERS_CSV:-users.csv}
INFLUX_URL=${INFLUX_URL:-}

echo "Starting stress test run: $TEST_RUN_ID"
export TEST_RUN_ID BASE_URL USERS_CSV

# Run k6
if command -v k6 >/dev/null 2>&1; then
  echo "Found local k6. Running k6 script: $K6_SCRIPT"
  if [ -n "$INFLUX_URL" ]; then
    echo "Exporting metrics to InfluxDB at $INFLUX_URL"
    k6 run --out influxdb=$INFLUX_URL "$K6_SCRIPT"
  else
    k6 run "$K6_SCRIPT"
  fi
else
  echo "Local k6 not found. Falling back to Docker image loadimpact/k6"
  # Ensure tests/k6 is mounted
  docker run --rm -i \
    -v "$(pwd)/tests/k6:/scripts" \
    -e BASE_URL="$BASE_URL" \
    -e TEST_RUN_ID="$TEST_RUN_ID" \
    loadimpact/k6 run "/scripts/$(basename "$K6_SCRIPT")"
fi

# Optional: run JMeter plan via Docker
if [ "${RUN_JMETER:-false}" = "true" ]; then
  echo "Running JMeter extended plan via Docker"
  docker run --rm -v "$(pwd)":/test -w /test justb4/jmeter:5.5 \
    jmeter -n -t tests/jmeter/starter-testplan-extended.jmx -l results.jtl -e -o ./jmeter-report
fi

# Optional cleanup of ResourceRequests created during the run
if [ "${CLEANUP:-false}" = "true" ]; then
  echo "Running cleanup for TEST_RUN_ID=$TEST_RUN_ID"
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL must be set to run cleanup script" >&2
    exit 1
  fi
  if command -v node >/dev/null 2>&1; then
    node tests/k6/cleanup-resource-requests.js
  elif command -v bun >/dev/null 2>&1; then
    bun tests/k6/cleanup-resource-requests.js
  else
    echo "Neither node nor bun found to run cleanup script" >&2
    exit 1
  fi
fi

echo "Stress test run $TEST_RUN_ID completed"

