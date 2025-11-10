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

# 3) New member signup (creates pending invite) — use printf to inject family unique uuid
# Note: pass the family *UUID* (`$FAMILY_ID`) as `familyId` — the API expects the family ID.
set MSR (curl -s -X POST http://localhost:3001/api/signup/member \
  -H 'Content-Type: application/json' \
  -d (printf '{"name":"TM","email":"tm@example.test","password":"pw","familyId":"%s"}' $FAMILY_UNIQUEID))

echo "Member signup response:"; echo $MSR | jq
set INVITE_ID (echo $MSR | jq -r '.data.joinRequest.id')
echo "INVITE_ID=$INVITE_ID"

# 4) Family Head: list invites (the server currently expects PATCH for this action)
echo "Invites for family:";
curl -s -X PATCH "http://localhost:3001/api/families/$FAMILY_ID/invites" \
  -H "Authorization: Bearer $FH_TOKEN" \
  -H "Accept: application/json" \
    -d '{}'| jq

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

you need bearer token after Authorization:

```sh
set TOKEN (echo $MEM_RESP | jq -r '.data.token')
    echo $TOKEN

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZDZiNGExZi0wYmY3LTQ0ZTYtYWY1NC1kNmJjMTcwZjYzMGUiLCJyb2xlIjoiTUVNQkVSIiwiaWF0IjoxNzYxOTg4OTUxLCJleHAiOjE3NjI1OTM3NTF9.lEHbX2tqnZAoGpF2u3A4ddBbodfb5PUBVuS0qb19ujg
```

```sh
# 7) To get your own details
curl -s -X GET http://localhost:3001/api/me \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" | jq

{
  "status": "success",
  "message": "Fetched profile",
  "data": {
    "id": "2d6b4a1f-0bf7-44e6-af54-d6bc170f630e",
    "name": "Riya Mehta",
    "email": "riya@demo.com",
    "role": "MEMBER",
    "families": [
      {
        "id": "af61d58a-df83-44ea-8037-b95c4bc318e9",
        "name": "Mehta Family",
        "uniqueId": "FAM001",
        "role": "MEMBER"
      }
    ],
    "createdAt": "2025-11-01T07:46:23.005Z",
    "updatedAt": "2025-11-01T07:46:23.005Z"
  },
  "error": null,
  "timestamp": "2025-11-01T09:23:48.293Z"
}
```

```sh
# 8) to get your Family Details
curl -s -X GET http://localhost:3001/api/family/members \
                  -H "Authorization: Bearer $FH_TOKEN" | jq

{
  "status": "success",
  "message": "Family members fetched",
  "data": {
    "family": {
      "id": "1b3b483c-0ec9-483b-b52b-2882e4793c51",
      "name": "Mehta Family",
      "uniqueId": "FAM001",
      "headId": "824afc96-5524-4450-98a5-49027698a373",
      "createdAt": "2025-11-01T09:53:07.355Z"
    },
    "members": [
      {
        "id": "59c2e944-1613-4562-8202-f203ad24b678",
        "familyId": "1b3b483c-0ec9-483b-b52b-2882e4793c51",
        "userId": "824afc96-5524-4450-98a5-49027698a373",
        "role": "FAMILY_HEAD",
        "joinedAt": "2025-11-01T09:53:08.474Z",
        "user": {
          "id": "824afc96-5524-4450-98a5-49027698a373",
          "name": "Nalin Mehta",
          "email": "nalin@demo.com",
          "status": true,
          "profile": null
        }
      },
      {
        "id": "3eca33e9-8910-4678-84de-3776121d088b",
        "familyId": "1b3b483c-0ec9-483b-b52b-2882e4793c51",
        "userId": "d61a2e24-a9ee-47c7-970f-7163e3daefab",
        "role": "MEMBER",
        "joinedAt": "2025-11-01T09:53:08.474Z",
        "user": {
          "id": "d61a2e24-a9ee-47c7-970f-7163e3daefab",
          "name": "Riya Mehta",
          "email": "riya@demo.com",
          "status": true,
          "profile": null
        }
      },
      {
        "id": "5eb00d77-512d-423c-b9d1-bb3d84f86ce6",
        "familyId": "1b3b483c-0ec9-483b-b52b-2882e4793c51",
        "userId": "3440b45a-30a0-4fd2-9cb8-0056de19e28c",
        "role": "MEMBER",
        "joinedAt": "2025-11-01T09:53:08.474Z",
        "user": {
          "id": "3440b45a-30a0-4fd2-9cb8-0056de19e28c",
          "name": "Anya Mehta",
          "email": "anya@demo.com",
          "status": true,
          "profile": null
        }
      },
      {
        "id": "495c9a21-95be-4cd3-8201-a7e534a82ab6",
        "familyId": "1b3b483c-0ec9-483b-b52b-2882e4793c51",
        "userId": "72a1e6ea-1e7e-4073-9e15-8342a93f6a4b",
        "role": "MEMBER",
        "joinedAt": "2025-11-01T09:53:08.474Z",
        "user": {
          "id": "72a1e6ea-1e7e-4073-9e15-8342a93f6a4b",
          "name": "Ayaan Mehta",
          "email": "ayaan@demo.com",
          "status": true,
          "profile": null
        }
      },
      {
        "id": "ea1a1934-5f51-4f3c-afa9-8857d391695f",
        "familyId": "1b3b483c-0ec9-483b-b52b-2882e4793c51",
        "userId": "1325c175-eb36-4149-adc7-48f11cbdfe0c",
        "role": "MEMBER",
        "joinedAt": "2025-11-01T09:53:08.474Z",
        "user": {
          "id": "1325c175-eb36-4149-adc7-48f11cbdfe0c",
          "name": "Manish Mehta",
          "email": "manish@demo.com",
          "status": true,
          "profile": null
        }
      }
    ]
  },
  "error": null,
  "timestamp": "2025-11-01T10:05:59.218Z"
}
```

fetch all family members(including dead one):

```sh
curl -s -X GET "http://localhost:3001/api/family/members?all=true" \
  -H "Authorization: Bearer $FH_TOKEN" | jq
```
