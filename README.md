# Community Management Platform

This project is a full-stack platform for managing local community operations, including families, events, resources, and member communications.

## Features

- Family and member management
- Event creation, registration, and payments
- Resource request workflows
- Community forums, polls, and notifications
- Role-based access and privacy controls

## Quick Start

1. **Copy over environement variables:**

   ```bash
   cp .env.example .env
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```
3. **Set up your database:**
   - Configure your `DATABASE_URL` in `.env`.
   - Run Prisma migrations:
     ```bash
     npx prisma migrate dev --schema=packages/db/schema.prisma
     ```
4. **Seed the database (optional):**
   ```bash
   npx ts-node packages/db/seed.ts
   ```
5. **Generate JWT Secret:**

   ```bash
   bunx node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   put it into `.env`

6. **Run the Dependencies:**

   ```bash
   docker compose -f docker-compose.kafka.yml up -d zookeeper kafka  #start kafka & zookeeper
   docker exec -it kafka kafka-topics --create --topic notification.events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 # verify topics exists
   ```

6. **Run the app:**

   ```bash
   bun run dev
   ```

7. To generate code documentation:
   ```bash
   bun run docs:gen
   ```

## CI/CD & Deployment

- Automated with GitHub Actions (`.github/workflows/ci.yml`)
- Builds, tests, and deploys Docker images to AWS (ECR + ECS)

## [Documentation](design.md)

## License

This project is licensed under the [MIT License](LICENSE).

## [Stress Testing](./stress-testing.md)

## [Case Study](./case.md)

---

users/head count 10-15k