# be

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

well to check auth for family head, sign up endpoint hit this speicific:

```sh
curl -X POST http://localhost:3001/api/signup/familyhead \
          -H "Content-Type: application/json" \
          -d '{
        "name": "Test Head",
        "email": "head@example.com",
        "password": "supersecret",
        "familyName": "DalalFamily"
      }'
```

you will get a json response:

```json
{
  "message": "Signup successful",
  "user": {
    "id": "73ebfd8a-a73f-4ed9-882f-d2da8c321971",
    "name": "Test Head",
    "email": "head@example.com",
    "role": "FAMILY_HEAD"
  },
  "family": {
    "id": "28b429fe-0b06-43d7-ade5-ad788d881026",
    "name": "DalalFamily",
    "uniqueId": "FAM-PYJWB1"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3M2ViZmQ4YS1hNzNmLTRlZDktODgyZi1kMmRhOGMzMjE5NzEiLCJyb2xlIjoiRkFNSUxZX0hFQUQiLCJpYXQiOjE3NjE5MzY1NzYsImV4cCI6MTc2MjU0MTM3Nn0.MkVI2yqjGu8z1_MRVeihqI5_-ccJle4RsYzqVoR4A8s"
}
```
