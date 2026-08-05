# Contributing to Modheshwari

Thanks for taking the time to improve the project. Keep changes focused, consistent with the existing code style, and backed by validation where practical.

## Before you start

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start the local stack if you need database-backed flows:

   ```bash
   docker compose up -d db redis zookeeper kafka
   ```

## Working guidelines

- Make the smallest change that solves the problem.
- Preserve existing naming, formatting, and public APIs unless a change requires otherwise.
- Do not commit real secrets or local `.env` files.
- Update documentation when behavior, setup, or commands change.

## Useful checks

Run the narrowest relevant check before opening a pull request.

```bash
bun run lint
bun run check-types
bun run openapi:gen
```

## Pull request checklist

- Describe what changed and why.
- Include screenshots or recordings for UI changes when relevant.
- Mention any migration, seed, or environment steps reviewers need.
- Confirm linting and type checks pass for touched areas.

## Demo data

The repository includes seeded demo users for local development. If you change seed data, keep the README in sync so the documented demo credentials stay accurate.