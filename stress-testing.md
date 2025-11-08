## **1. Decide what to test**

For Modheshwari, you likely have endpoints like:

- `POST /api/contact` → submitting messages
- `GET /api/family` → fetching family data
- `POST /api/resources` → submitting a resource request

Stress testing usually focuses on **write-heavy endpoints** and endpoints that **hit databases** or other services.

---

## **2. Choose a tool**

Some popular stress testing tools:

| Tool          | Type               | Notes                                      |
| ------------- | ------------------ | ------------------------------------------ |
| **Artillery** | Node.js CLI        | Simple YAML/JS config, good for APIs       |
| **k6**        | CLI / JS scripting | Modern, easy to run distributed load tests |
| **Hey**       | CLI                | Very lightweight, simple requests          |
| **JMeter**    | GUI / CLI          | Classic, more complex                      |
| **Locust**    | Python             | Good if you want Python scripts for load   |

For a **Next.js API**, I’d recommend **Artillery** or **k6** because they integrate easily with JSON APIs.

---

## **3. Example: Artillery Stress Test**

### Step 1: Install

```bash
npm install -g artillery
```

### Step 2: Create `contact-test.yml`

```yaml
config:
  target: "https://your-modheshwari-domain.com"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 requests per second
scenarios:
  - flow:
      - post:
          url: "/api/contact"
          json:
            name: "Test User"
            email: "test@example.com"
            subject: "Stress Test"
            message: "This is a load test message"
            type: "question"
```

### Step 3: Run the test

```bash
artillery run contact-test.yml
```

You’ll get a report with:

- **Requests per second (RPS)**
- **Response times** (min/median/max)
- **Error rate**

---

## **4. Benchmark individual endpoints**

If you want more detailed **benchmarking**:

- Measure **latency** and **throughput**.
- Check **database query times** using logging/profiling.
- Use **Autocannon** (Node.js):

```bash
npm install -g autocannon
autocannon -c 50 -d 30 -p 10 https://your-modheshwari-domain.com/api/contact
```

- `-c 50` → 50 concurrent connections
- `-d 30` → 30 seconds duration
- `-p 10` → 10 pipelined requests per connection

---

## **5. Tips for Modheshwari**

1. **Run against staging**, not production.
2. **Simulate realistic users**: mix `GET`, `POST`, and `PATCH` requests like actual app usage.
3. **Monitor server** while testing:
   - CPU, RAM, Node.js event loop delays.
   - Database queries per second.

4. **Gradually increase load**:
   - Start with 10 RPS, then 50, then 100+, depending on expected traffic.

5. **Analyze failures**:
   - Timeouts → maybe increase API timeout.
   - 500 errors → check backend exceptions.
   - Slow responses → check DB queries, caching, and API optimizations.
