## **Auth Module — Family System (v1)**

### 1. Family Head

#### **Signup**

**Endpoint:**
`POST /api/signup/familyhead`

**Request Body:**

```json
{
  "name": "Test Head",
  "email": "head@example.com",
  "password": "supersecret",
  "familyName": "DalalFamily"
}
```

**Response (201 Created):**

```json
{
  "status": "success",
  "message": "Signup successful",
  "data": {
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
    "token": "eyJhbGciOi..."
  },
  "error": null,
  "timestamp": "2025-11-01T03:13:07.133Z"
}
```

**Error Cases:**

- `{"error": "Email already registered"}` — when trying duplicate signup.

---

#### **Login**

**Endpoint:**
`POST /api/login/familyhead`

**Request Body:**

```json
{
  "email": "head@example.com",
  "password": "supersecret"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "73ebfd8a-a73f-4ed9-882f-d2da8c321971",
      "name": "Test Head",
      "email": "head@example.com",
      "role": "FAMILY_HEAD"
    }
  },
  "error": null,
  "timestamp": "2025-11-01T03:13:07.133Z"
}
```

---

### 2. 👩‍👧 Family Member

#### **Login**

**Endpoint:**
`POST /api/login/member`

**Request Body:**

```json
{
  "email": "riya@demo.com",
  "password": "123"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "4de3fb3a-6ec0-450c-9eef-e5df21f8436e",
      "name": "Riya Mehta",
      "email": "riya@demo.com",
      "role": "MEMBER"
    },
    "families": [
      {
        "id": "5f32a43f-0aa2-4d9e-b5de-b253c4bfa3d9",
        "name": "Mehta Family",
        "uniqueId": "FAM001"
      }
    ],
    "token": "eyJhbGciOi..."
  },
  "error": null,
  "timestamp": "2025-11-01T03:26:31.987Z"
}
```

**Notes:**

- The member login only requires `email` and `password`. The API will return the list of families associated with the account in the response `data`.

**Error Example (invalid credentials):**

```json
{
  "status": "error",
  "message": "Invalid credentials",
  "error": "Authentication Error"
}
```

---

## Auth Behavior Summary

| Role                                          | Signup                                        | Login                                           | Notes                                              |
| --------------------------------------------- | --------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| **Family Head**                               | ✅ Creates new family with unique ID          | ✅ Login with email/password                    | Email should be unique; code expects unique emails |
| **Family Member**                             | ✅ Joins existing family via `familyUniqueId` | ✅ Login with email + familyUniqueId + password | Email can repeat across families                   |
| **Admin (Community Head/Subhead/Gotra Head)** | 🚧 (Next)                                     | 🚧 (Next)                                       | Will share same JWT logic                          |

---

## Implementation Notes

- Passwords stored securely via `bcrypt.hash`.
- Passwords verified via `bcrypt.compare`.
- JWT signed using `signJWT({ userId, role })`.
- `@modheshwari/utils/response` handles consistent `success()` / `failure()` formatting.
- Prisma relations ensure family linkage + role integrity.
- Supports multiple families with same user email (distinguished by `familyUniqueId`).