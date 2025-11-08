import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter } from "k6/metrics";

// Configuration via environment variables
const BASE = __ENV.BASE_URL || "http://localhost:3001";
const USERS_CSV = __ENV.USERS_CSV || "tests/k6/users.csv";

// Custom metrics
export let errorRate = new Rate("errors");
export let failedLogins = new Counter("failed_logins");

// Read and parse CSV in init stage
const rawCsv = open(USERS_CSV);
const csvLines = rawCsv
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("email"));
const parsedUsers = csvLines.map((line) => {
  const parts = line.split(",").map((p) => p.trim());
  return { email: parts[0], password: parts[1], role: parts[2] || "MEMBER" };
});

// Stages: ramping users up and down; override with env K6_STAGES
const defaultStages = [
  { duration: "30s", target: 10 },
  { duration: "1m", target: 50 },
  { duration: "30s", target: 100 },
  { duration: "1m", target: 50 },
  { duration: "30s", target: 0 },
];

export let options = {
  stages: __ENV.K6_STAGES ? JSON.parse(__ENV.K6_STAGES) : defaultStages,
  thresholds: {
    errors: ["rate<0.02"], // Less than 2% of iterations should error
    http_req_duration: ["p(95)<1000"], // 95% of requests under 1s
    http_req_failed: ["rate<0.1"], // Less than 10% HTTP failures
  },
};

function roleLoginPath(role) {
  const r = (role || "").toUpperCase();
  if (r === "FAMILY_HEAD") return "/api/login/familyhead";
  if (r === "COMMUNITY_HEAD") return "/api/login/communityhead";
  if (r === "COMMUNITY_SUBHEAD") return "/api/login/communitysubhead";
  if (r === "GOTRA_HEAD") return "/api/login/gotrahead";
  return "/api/login/member";
}

export function setup() {
  console.log(
    `Setting up test with ${parsedUsers.length} users from ${USERS_CSV}`,
  );

  // Pre-warm tokens for all users defined in USERS_CSV
  const tokens = [];
  let successfulLogins = 0;

  for (const u of parsedUsers) {
    const path = roleLoginPath(u.role);
    try {
      const res = http.post(
        `${BASE}${path}`,
        JSON.stringify({ email: u.email, password: u.password }),
        { headers: { "Content-Type": "application/json" } },
      );

      if (res.status === 200) {
        const body = res.json();
        const token = body?.data?.token || body?.token || null;
        if (token) {
          tokens.push({ email: u.email, role: u.role, token });
          successfulLogins++;
        } else {
          console.warn(`Login succeeded but no token for ${u.email}`);
          tokens.push({ email: u.email, role: u.role, token: null });
        }
      } else {
        console.warn(`Login failed for ${u.email}: ${res.status} ${res.body}`);
        tokens.push({ email: u.email, role: u.role, token: null });
      }
    } catch (e) {
      console.error(`Exception logging in ${u.email}: ${e.message}`);
      tokens.push({ email: u.email, role: u.role, token: null });
    }
  }

  const runId = __ENV.TEST_RUN_ID || `k6-run-${Date.now()}`;
  console.log(
    `Setup complete: ${successfulLogins}/${parsedUsers.length} users logged in successfully`,
  );
  console.log(`Test run ID: ${runId}`);

  return { tokens, runId };
}

export default function (data) {
  const tokens = data.tokens || [];
  const runId = data.runId || `k6-run-${Date.now()}`;
  let iterationHasError = false;

  // Early exit if no tokens available
  if (!tokens.length) {
    console.error("No tokens available - setup might have failed");
    errorRate.add(1);
    return;
  }

  // Map VU to a token deterministically (round-robin)
  const idx = (__VU - 1) % tokens.length;
  const user = tokens[idx];

  if (!user || !user.token) {
    // Don't spam logs, but track the error
    if (__ITER === 0) {
      console.warn(`VU ${__VU}: No valid token for index ${idx}`);
    }
    errorRate.add(1);
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  };

  // Choose a flow per iteration based on probability
  const rnd = Math.random();

  if (rnd < 0.7) {
    // 70% Read-heavy flow: search + list resource requests
    const queries = ["An", "Meh", "Pat", "Shah", "Rey"];
    const q = queries[Math.floor(Math.random() * queries.length)];

    const searchRes = http.get(
      `${BASE}/api/search?q=${encodeURIComponent(q)}`,
      { headers },
    );

    if (!check(searchRes, { "search:200": (r) => r.status === 200 })) {
      iterationHasError = true;
      if (__ITER === 0) {
        console.warn(`VU ${__VU}: Search failed with ${searchRes.status}`);
      }
    }

    const rrRes = http.get(`${BASE}/api/resource-requests`, { headers });
    if (!check(rrRes, { "rr-list:200": (r) => r.status === 200 })) {
      iterationHasError = true;
    }
  } else if (rnd < 0.9) {
    // 20% Write flow: create resource request (test DB only)
    const resources = ["Food", "Shelter", "Medical", "Education", "Financial"];
    const resource = resources[Math.floor(Math.random() * resources.length)];

    const payload = {
      resource: resource,
      details: `Load test ${runId} by ${user.email}`,
    };

    const postRes = http.post(
      `${BASE}/api/resource-requests`,
      JSON.stringify(payload),
      { headers },
    );

    if (
      !check(postRes, {
        "rr-create:201": (r) => r.status === 201 || r.status === 200,
      })
    ) {
      iterationHasError = true;
      if (__ITER === 0) {
        console.warn(
          `VU ${__VU}: Create request failed with ${postRes.status}`,
        );
      }
    }
  } else {
    // 10% Admin-ish flow
    const isAdmin = [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
    ].includes((user.role || "").toUpperCase());

    if (isAdmin) {
      const adminRes = http.get(`${BASE}/api/admin/requests`, { headers });
      if (!check(adminRes, { "admin-requests:200": (r) => r.status === 200 })) {
        iterationHasError = true;
      }
    } else {
      // Regular users do another search instead
      const searchRes = http.get(`${BASE}/api/search?q=Test`, { headers });
      if (!check(searchRes, { "search:200": (r) => r.status === 200 })) {
        iterationHasError = true;
      }
    }
  }

  // Record one error per iteration (not per failed check)
  errorRate.add(iterationHasError ? 1 : 0);

  // Think time: random sleep between 0.2s and 1.7s
  sleep(Math.random() * 1.5 + 0.2);
}

export function teardown(data) {
  console.log("Test completed");
  const validTokens = data.tokens.filter((t) => t.token !== null).length;
  console.log(`Used ${validTokens}/${data.tokens.length} valid tokens`);
}
