yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs


# Community Management Platform

This project is a full-stack platform for managing local community operations, including families, events, resources, and member communications.

## Features
- Family and member management
- Event creation, registration, and payments
- Resource request workflows
- Community forums, polls, and notifications
- Role-based access and privacy controls

## Quick Start
1. **Install dependencies:**
	```bash
	bun install
	```
2. **Set up your database:**
	- Configure your `DATABASE_URL` in `.env`.
	- Run Prisma migrations:
	  ```bash
	  npx prisma migrate dev --schema=packages/db/schema.prisma
	  ```
3. **Seed the database (optional):**
	```bash
	npx ts-node packages/db/seed.ts
	```
4. **Run the app:**
	```bash
	bun run dev
	```

## Monorepo Structure
- `apps/web` – Next.js frontend
- `packages/ui` – Shared React UI components
- `packages/db` – Prisma schema and seed scripts

## CI/CD & Deployment
- Automated with GitHub Actions (`.github/workflows/ci.yml`)
- Builds, tests, and deploys Docker images to AWS (ECR + ECS)

## Documentation
- [Design Document](design.md)
- [Development Steps & Rationale](steps.md)
- [Database Schema](packages/db/schema.prisma)

## License

This project is licensed under the [MIT License](LICENSE).

yarn exec turbo dev
pnpm exec turbo dev
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web


### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
