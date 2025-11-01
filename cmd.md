# Dev smoke-test (fish shell)

Below are fish-compatible commands you can copy/paste to bring up a local Postgres, generate the Prisma client, migrate/push the schema, seed the DB, start the backend, and run a full invite/approve smoke-test.

Run these from the repository root in a fish shell.

1. Install deps, generate Prisma client, migrate and seed

Use migrate (recommended) or `db push` (faster, no migration files):

```fish
# install
bun install

# generate prisma client
bun x prisma generate --schema=packages/db/schema.prisma

# apply migrations (interactive dev)
bun x prisma migrate dev --schema=packages/db/schema.prisma --name dev_sync

# seed
bun run db:seed
```

If you prefer to push the schema without migrations:

```fish
bun x prisma db push --schema=packages/db/schema.prisma
bun x prisma generate --schema=packages/db/schema.prisma
bun run db:seed
```

2. Start the backend (run in background; logs written to dev-be.log)

```fish
# start backend in background and capture PID
nohup bun --cwd apps/be run dev > dev-be.log 2>&1 &
set -x BE_PID $last_pid
echo "backend pid: $BE_PID"
```

Watch logs with: `tail -f dev-be.log`

3. Run the full invite / approve smoke-test

```fish
# 1) Login as seeded member Riya to get family ids
set MEM_RESP (curl -s -X POST http://localhost:3001/api/login/member \
  -H 'Content-Type: application/json' \
  -d '{"email":"riya@demo.com","password":"123"}')

set FAMILY_ID (echo $MEM_RESP | jq -r '.data.families[0].id')
set FAMILY_UNIQUEID (echo $MEM_RESP | jq -r '.data.families[0].uniqueId')
echo "FAMILY_ID=$FAMILY_ID FAMILY_UNIQUEID=$FAMILY_UNIQUEID"

# 2) Family Head login (seeded)
set FH_RESP (curl -s -X POST http://localhost:3001/api/login/familyhead \
  -H 'Content-Type: application/json' \
  -d '{"email":"nalin@demo.com","password":"123"}')

set FH_TOKEN (echo $FH_RESP | jq -r '.data.token')
echo "FH_TOKEN=$FH_TOKEN"

# 3) New member signup (creates pending invite) — use printf to inject family unique id
set MSR (curl -s -X POST http://localhost:3001/api/signup/member \
  -H 'Content-Type: application/json' \
  -d (printf '{"name":"TM","email":"tm@example.test","password":"pw","familyId":"%s"}' $FAMILY_UNIQUEID))

echo "Member signup response:"; echo $MSR | jq
set INVITE_ID (echo $MSR | jq -r '.data.invite.id')
echo "INVITE_ID=$INVITE_ID"

# 4) Family Head: list invites
echo "Invites for family:";
curl -s -X GET "http://localhost:3001/api/families/$FAMILY_ID/invites" \
  -H "Authorization: Bearer $FH_TOKEN" \
  -H "Accept: application/json" | jq

# 5) Family Head: approve invite
echo "Approving invite...";
curl -s -X PATCH "http://localhost:3001/api/families/$FAMILY_ID/invites/$INVITE_ID/approve" \
  -H "Authorization: Bearer $FH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"remarks":"ok"}' | jq

# 6) Member: login after approval (verify family present)
echo "Member login after approval:";
curl -s -X POST http://localhost:3001/api/login/member \
  -H 'Content-Type: application/json' \
  -d '{"email":"tm@example.test","password":"pw"}' | jq
```

Notes

- If any command returns an "Internal server error", check `dev-be.log` for the stacktrace (Prisma errors commonly indicate a schema/db mismatch). Run `bun x prisma generate` + migrate/db push and restart the backend.
- If you get 401 responses, ensure `JWT_SECRET` in `.env` / exported in the shell matches the server environment.
- These steps assume seed users/passwords are the ones in `packages/db/seed.ts` (passwords are "123" for seeded users).
