# Incident Report: Nginx Upstream Resolution Failure in Docker Compose

## Summary

During deployment of the Modheshwari application, Nginx failed to communicate with the application services, producing upstream resolution errors. The issue initially appeared to be a Docker networking problem, but after systematic debugging it was determined that the Docker network was functioning correctly. The immediate error was resolved after restarting the Nginx container once all application containers had joined the Docker network.

This document records the investigation, debugging process, conclusions, and preventive measures.

---

# Environment

* Docker Compose
* Nginx (reverse proxy)
* Next.js frontend (`web`)
* Backend API (`be`)
* WebSocket service (`ws`)
* Redis
* Kafka
* PostgreSQL

All services communicate over the Docker Compose network:

```
modheshwari_default
```

---

# Initial Symptoms

The deployment initially showed errors similar to:

```
host not found in upstream "web"
```

or

```
host not found in upstream "be"
```

Although the containers themselves appeared to be running correctly, Nginx could not resolve the upstream hostnames.

This suggested one of the following:

* Docker DNS failure
* Containers not on the same network
* Incorrect upstream names
* Nginx starting before service discovery was available
* Incorrect Docker Compose configuration

---

# Initial Hypotheses

The following possibilities were investigated.

## 1. Containers not attached to the same network

This was the most likely explanation.

Verification:

```
docker inspect <container>
```

Result:

```
modheshwari_default
```

Every application container was attached to the same Docker network.

Conclusion:

❌ Not the problem.

---

## 2. Wrong upstream names

Nginx configuration:

```nginx
upstream web {
    server web:3000;
}

upstream be {
    server be:3001;
}

upstream ws {
    server ws:3002;
}
```

Docker Compose service names:

```
web
be
ws
```

Container aliases:

```
web
be
ws
```

Everything matched correctly.

Conclusion:

❌ Not the problem.

---

## 3. Docker DNS failure

From inside the Nginx container:

```
docker exec modheshwari-nginx getent hosts web
```

Output:

```
172.18.0.8 web
```

Similarly:

```
docker exec modheshwari-nginx getent hosts be
```

Output:

```
172.18.0.7 be
```

Docker DNS was working correctly.

Conclusion:

❌ Not the problem.

---

## 4. Incorrect Nginx configuration

Configuration test:

```
docker exec modheshwari-nginx nginx -T
```

Result:

```
configuration file syntax is ok
configuration file test is successful
```

Configuration review confirmed:

* correct upstreams
* correct proxy_pass directives
* valid syntax

Conclusion:

❌ Not the problem.

---

## 5. Backend unavailable

Health endpoint:

```
curl http://localhost/api/health
```

Result:

```json
{
  "status": "ok"
}
```

Backend was healthy.

Conclusion:

❌ Not the problem.

---

## 6. Frontend unavailable

```
curl http://localhost
```

returned the complete Next.js HTML page.

Frontend was healthy.

Conclusion:

❌ Not the problem.

---

# Debugging Timeline

The investigation proceeded in roughly this order:

1. Verified running containers (`docker ps`).
2. Checked Docker network attachments.
3. Verified container IP addresses.
4. Confirmed Docker Compose service names.
5. Verified Nginx configuration.
6. Tested Docker DNS using `getent hosts`.
7. Tested backend health endpoint.
8. Tested frontend through Nginx.
9. Restarted the Nginx container.
10. Re-tested all routes.

After restarting Nginx, all upstream resolution problems disappeared.

---

# Root Cause

The evidence suggests that Nginx attempted to resolve the upstream hosts before Docker DNS had registered all Compose service names.

Although Docker Compose uses `depends_on`, it only controls startup order—it does **not** guarantee that service name resolution or application readiness is complete.

When Nginx started, the upstream names were temporarily unavailable.

After the services finished joining the Docker network, restarting Nginx caused it to resolve the upstream names successfully.

No changes to networking or configuration were required.

---

# Final Verification

The following checks all passed.

### Docker DNS

```
getent hosts web
```

```
172.18.0.8 web
```

```
getent hosts be
```

```
172.18.0.7 be
```

---

### Frontend

```
curl http://localhost
```

Returned the expected Next.js application.

---

### Backend

```
curl http://localhost/api/health
```

Returned:

```json
{
  "status": "ok"
}
```

---

### Nginx Configuration

```
nginx -T
```

Configuration loaded successfully.

---

# Additional Observation

The frontend environment contained:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

For production deployments behind Nginx, this should generally be:

```
NEXT_PUBLIC_API_BASE_URL=/api
```

Reason:

* `localhost` inside a user's browser refers to the user's own computer.
* `/api` routes requests through the reverse proxy.
* This avoids environment-specific URLs.

After changing any `NEXT_PUBLIC_*` variable, the frontend image must be rebuilt because these variables are embedded during the Next.js build process.

---

# Lessons Learned

1. Always verify Docker DNS before assuming a networking issue.
2. Check service aliases with `docker inspect`.
3. Validate Nginx configuration using `nginx -T`.
4. Verify backend independently before debugging the proxy.
5. Test frontend independently before blaming Nginx.
6. Use `getent hosts` inside containers to confirm Docker DNS.
7. `depends_on` does not guarantee application readiness.
8. Restarting Nginx after all services become healthy can resolve transient DNS timing issues.
9. Prefer relative API URLs (`/api`) for browser-side applications behind a reverse proxy.

---

# Useful Commands

```bash
docker ps
```

```bash
docker inspect <container>
```

```bash
docker inspect <container> | jq '.[0].NetworkSettings.Networks'
```

```bash
docker exec modheshwari-nginx getent hosts web
```

```bash
docker exec modheshwari-nginx getent hosts be
```

```bash
docker exec modheshwari-nginx nginx -T
```

```bash
curl http://localhost
```

```bash
curl http://localhost/api/health
```

```bash
docker restart modheshwari-nginx
```

---

# Outcome

The infrastructure was confirmed to be healthy.

The Docker network, service discovery, backend, frontend, and reverse proxy were all functioning correctly after verification. The deployment issue was resolved without changes to the Docker network itself. The incident reinforced the importance of validating each infrastructure layer independently and avoiding assumptions about Docker DNS or service readiness during container startup.
