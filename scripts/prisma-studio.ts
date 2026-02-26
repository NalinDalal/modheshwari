import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Add it to .env at the repo root.");
  process.exit(1);
}

const studio = Bun.spawn(["bunx", "prisma", "studio", "--url", databaseUrl], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await studio.exited;
process.exit(exitCode);
