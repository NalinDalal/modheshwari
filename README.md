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

6. **Run the app:**
   ```bash
   bun run dev
   ```

7. To generate code documentation:
   ```bash
   bun run docs:gen
   ```

## Monorepo Structure

- `apps/web` – Next.js frontend
- `packages/ui` – Shared React UI components
- `packages/db` – Prisma schema and seed scripts
- `packages/utils` - to handle with stuff like auth, other similar things
- `packages/test` - well testcases

## CI/CD & Deployment

- Automated with GitHub Actions (`.github/workflows/ci.yml`)
- Builds, tests, and deploys Docker images to AWS (ECR + ECS)

## Documentation

- [Design Document](design.md)
- [Development Steps & Rationale](steps.md)
- [Database Schema](packages/db/schema.prisma)

## License

This project is licensed under the [MIT License](LICENSE).
