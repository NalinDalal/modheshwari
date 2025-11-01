# Modheshwari — System Design & SRS (Implementation-Ready)

**Document Version:** 1.1
**Last Updated:** October 31, 2025
**Audience:** Developers, Architects, Product Owners

---

## Table of contents

1. [Executive summary](#executive-summary)
2. [Goals & scope](#goals--scope)
3. [Roles & permissions (RBAC)](#roles--permissions-rbac)
4. [High-level workflows](#high-level-workflows)
5. [Technical architecture (brief)](#technical-architecture-brief)
6. [Data model — canonical (Prisma-aligned)](#data-model---canonical-prisma-aligned)
   - Model-by-model documentation (fields, meaning, constraints)
   - Relationship notes & cascade logic

7. [Seed data scenario (exact example used for dev/demo)](#seed-data-scenario-exact-example-used-for-devdemo)
8. [API surface (high level)](#api-surface-high-level)
9. [Operational notes & best practices](#operational-notes--best-practices)
10. [Future extensions & migration notes](#future-extensions--migration-notes)
11. [Appendix — enums & glossary](#appendix---enums--glossary)

---

## Executive summary

Modheshwari is a community management platform for hierarchical family / gotra communities. It models families, members, gotras, events, resource requests and a multi-role approval workflow (community head → subhead → gotra head → family head). The data model below is _exactly_ aligned to your Prisma schema (Option B — `UserRelation`), and is optimized for auditable approvals and family membership changes while keeping lineage relations (spouse/parent/child) explicit and queryable.

This SRS focuses on being developer-first: accurate data model, clear API primitives, seed data, and operational/cascade behavior.

---

## Goals & scope

**Primary goals**

- Model families and membership history (members can move families via `FamilyMember` entries).
- Model interpersonal relations (spouse/parent/child/sibling) via `UserRelation`.
- Support event lifecycle with multi-role approvals and full audit trail.
- Support resource request workflows with approvals and notifications.
- Provide an implementation-ready schema and seed dataset for local development.

**Out of scope (v1)**

- Complex payments/refunds workflows (scaffolded but not implemented in seed).
- Real-time chat/streaming (future feature).
- Federated multi-tenant isolation (future).

---

## Roles & permissions (RBAC)

Roles (from schema):

- `COMMUNITY_HEAD` — top-level approver, full visibility.
- `COMMUNITY_SUBHEAD` — secondary top-level approver.
- `GOTRA_HEAD` — gotra-level approver / oversight.
- `FAMILY_HEAD` — leads a single family, can submit requests, invite members.
- `MEMBER` — regular user.

**General rule**: approvals flow upward (Family Head → Gotra Head → Subhead → Community Head) as defined by workflows. Authorization checks should be enforced in middleware (API layer), not in DB.

---

## High-level workflows

### Family lifecycle

- Create family: `Family` created with `uniqueId`, optional `headId` points to `User`.
- Join family: `FamilyMember` record created. `User.families` contains history; current family determined by the latest or an `active` indicator (we track `joinedAt` — can add `leftAt/active` if needed).
- Move (marriage/relocation): insert new `FamilyMember` for new family; optionally mark previous membership by adding `leftAt` (schema currently doesn't include `leftAt` — consider adding if you want explicit historical left date).

### Relationship lifecycle

- `UserRelation` records represent directed relationships with `type` (SPOUSE, PARENT, CHILD, SIBLING). Use unique constraint to prevent duplicates. Application logic should create reciprocal relations where appropriate (e.g., SPOUSE mutual entry or an agreed convention).

### Event workflow (approval)

1. Creator (`Event.createdById`) creates `Event` with `status = PENDING`.
2. System creates `EventApproval` rows for approvers (community head, subhead, gotra head — based on roles or configured approvers).
3. Each approver updates their `EventApproval.status` to `"approved"|"rejected"|"changes_requested"`. They also may add `remarks`.
4. Business logic:
   - If any `rejected` → overall `Event.status = REJECTED`.
   - If any `changes_requested` → `Event.status = PENDING`/`NEEDS_ACTION` (implementation choice); we use `PENDING` and reflect reviewer remarks; the creator updates the event and approvals can be reset.
   - If all required approvers `approved` → `Event.status = APPROVED`.

5. Notifications generated for approvers/creator at each relevant action.

### Resource request workflow

- Similar to Event approval; `ResourceRequest` holds `status` and optionally `approverId` + `approverName` when approved.

---

## Technical architecture (brief)

Recommended stack (as in original SRS):

- Frontend: Next.js + Tailwind
- Backend API: Node.js (Serverless or containerized), Prisma ORM
- DB: PostgreSQL
- Cache: Redis for sessions / hot queries
- Search: Elasticsearch (async indexing)
- Storage: S3 for files
- CI/CD: GitHub Actions
- Monitoring: Prometheus / Grafana; Sentry for errors

---

## Data model — canonical (Prisma-aligned)

> The following models are verbatim from your final Prisma schema (with explanatory notes). Field types, relations and cascade logic are as implemented.

---

### `User`

Represents an individual in the community.

**Prisma model (reference)**:

```prisma
model User {
  id        String         @id @default(uuid())
  email     String         @unique
  password  String
  name      String
  role      Role
  profile   Profile?
  families  FamilyMember[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  status    Boolean

  // Relations
  headedFamilies            Family[]            @relation("FamilyHead")
  createdEvents             Event[]             @relation("EventCreatedBy")
  eventRegistrations        EventRegistration[]
  payments                  Payment[]
  requestedResourceRequests ResourceRequest[]   @relation("RequestedBy")
  approvedResourceRequests  ResourceRequest[]   @relation("ApprovedBy")
  notifications             Notification[]

  // New reverse relation for EventApproval
  eventApprovalsReviewed EventApproval[] @relation("UserEventApprovals")

  // User relations
  relationsFrom UserRelation[] @relation("FromUser")
  relationsTo   UserRelation[] @relation("ToUser")
}
```

**Notes**

- `status` boolean: implement meaning in app (true=active).
- Consider storing `emailVerified`, `lastLoginAt`.
- Passwords must be hashed & salted.

---

### `Role` (enum)

```prisma
enum Role {
  COMMUNITY_HEAD
  COMMUNITY_SUBHEAD
  GOTRA_HEAD
  FAMILY_HEAD
  MEMBER
}
```

**Notes**: used for RBAC checks. Keep roles synchronized with authorization layer.

---

### `Profile`

```prisma
model Profile {
  id         String  @id @default(uuid())
  user       User    @relation(fields: [userId], references: [id])
  userId     String  @unique
  phone      String?
  address    String?
  profession String?
  gotra      String?
  location   String?
  status     String? // e.g. "alive", "deceased"
}
```

**Notes**: `userId` unique — one-to-one. Good place for additional metadata.

---

### `Family`

```prisma
model Family {
  id        String         @id @default(uuid())
  name      String
  uniqueId  String         @unique
  members   FamilyMember[]
  headId    String?
  head      User?          @relation("FamilyHead", fields: [headId], references: [id])
  createdAt DateTime       @default(now())
}
```

**Notes**

- `uniqueId` is a readable family code (e.g., DALAL001).
- `headId` optional, set when family head assigned.

---

### `FamilyMember`

```prisma
model FamilyMember {
  id       String   @id @default(uuid())
  family   Family   @relation(fields: [familyId], references: [id])
  familyId String
  user     User     @relation(fields: [userId], references: [id])
  userId   String
  role     Role
  joinedAt DateTime @default(now())
}
```

**Notes**

- Acts as junction table; historical records are preserved (use `joinedAt` and optionally `leftAt` if you want explicit leave data).
- You may want to add `active Boolean` and `leftAt DateTime?` to easily fetch current family.

---

### `UserRelation`

```prisma
model UserRelation {
  id         String       @id @default(uuid())
  fromUser   User         @relation("FromUser", fields: [fromUserId], references: [id])
  fromUserId String
  toUser     User         @relation("ToUser", fields: [toUserId], references: [id])
  toUserId   String
  type       RelationType
  createdAt  DateTime     @default(now())

  @@unique([fromUserId, toUserId, type])
}
```

**Notes**

- `type` is `RelationType` enum. App should manage reciprocal entries where appropriate (e.g., create both SPOUSE directions OR define convention that one direction sufficient with queries aware).
- Keep logic to prevent duplicates (unique constraint ensures uniqueness for same type).

---

### `RelationType` (enum)

```prisma
enum RelationType {
  SPOUSE
  PARENT
  CHILD
  SIBLING
}
```

---

### `Event`

```prisma
model Event {
  id            String              @id @default(uuid())
  name          String
  description   String?
  date          DateTime
  venue         String?
  createdBy     User                @relation("EventCreatedBy", fields: [createdById], references: [id])
  createdById   String
  status        EventStatus         @default(PENDING)
  approvals     EventApproval[] // handled cascade from EventApproval side
  registrations EventRegistration[]
  payments      Payment[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
}
```

**Notes**

- `status` tracks lifecycle (PENDING/APPROVED/REJECTED/CANCELLED).
- `approvals` are owned by `EventApproval` which declares `onDelete: Cascade` on its FK to `Event` (so deleting `Event` cascades deletion to approvals, registrations, payments).

---

### `EventStatus` (enum)

```prisma
enum EventStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

---

### `EventApproval`

```prisma
model EventApproval {
  id           String    @id @default(uuid())
  event        Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId      String
  approver     User      @relation("UserEventApprovals", fields: [approverId], references: [id])
  approverId   String
  approverName String
  role         Role
  status       String
  remarks      String?
  reviewedAt   DateTime?
  createdAt    DateTime  @default(now())

  @@unique([eventId, approverId])
}
```

**Notes**

- `approverName` is a cached snapshot for quick displays (prevents another join).
- `status` should be an enum at application level (APPROVED/REJECTED/PENDING/CHANGES_REQUESTED).
- `@@unique([eventId, approverId])` ensures a single approval entry per approver per event.

---

### `EventRegistration`

```prisma
model EventRegistration {
  id           String   @id @default(uuid())
  event        Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId      String
  user         User     @relation(fields: [userId], references: [id])
  userId       String
  registeredAt DateTime @default(now())
}
```

**Notes**

- Consider adding unique `(eventId, userId)` to avoid duplicate registrations.

---

### `Payment`

```prisma
model Payment {
  id        String   @id @default(uuid())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId   String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  amount    Float
  status    String
  createdAt DateTime @default(now())
}
```

**Notes**

- Payment scaffolding present; integrate with gateway (store gateway transaction id & webhook metadata on separate fields if needed).

---

### `ResourceRequest`

```prisma
model ResourceRequest {
  id           String   @id @default(uuid())
  user         User     @relation("RequestedBy", fields: [userId], references: [id])
  userId       String
  resource     String
  status       String
  approver     User?    @relation("ApprovedBy", fields: [approverId], references: [id])
  approverId   String?
  approverName String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Notes**

- `approverName` cached for quick display post-approval.
- Application logic should append `approval history` elsewhere (or add an `Approval` table if granular history needed).

---

### `Notification`

```prisma
model Notification {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  type      String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### `MemberInvite` (new)

Tracks pending requests or invites to join a `Family`. This model separates pending invites from accepted memberships and is used to implement the approval workflow described in the SRS.

Prisma reference:

```prisma
model MemberInvite {
  id             String   @id @default(uuid())
  family         Family   @relation(fields: [familyId], references: [id])
  familyId       String
  invitedUser    User?    @relation("InvitedUser", fields: [invitedUserId], references: [id])
  invitedUserId  String?
  inviteEmail    String?
  status         InviteStatus @default(PENDING)
  token          String?
  createdAt      DateTime @default(now())
  expiresAt      DateTime?
  reviewedBy     User?    @relation("InviteReviewedBy", fields: [reviewedById], references: [id])
  reviewedById   String?
  reviewedAt     DateTime?
  remarks        String?
}

enum InviteStatus { PENDING APPROVED REJECTED }
```

Notes:
- `invitedUserId` may be null when the invite targets an email that has not yet registered. When that email later registers, application logic can link the user to the pending invite (claim flow).
- `token` supports email-based claim links where the recipient can accept without immediate login, or for verifying ownership of the invited email.
- Keep `inviteEmail` indexed and prevent duplicate pending invites per (family, email).
```

**Notes**

- Keep `type` as well-known values (`event_approval`, `event_created`, `resource_status` etc.). Consider storing a `payload JSON` in future to allow structured notification actions.

---

## Relationship & cascade rules (implementation notes)

- All cascade deletes are defined on the _foreign key side_ (e.g., `EventApproval.event` has `onDelete: Cascade`). This is Prisma-compatible.
- Deleting `Event` will cascade delete associated `EventApproval`, `EventRegistration`, and `Payment` because those relations declare `onDelete: Cascade`.
- `User` deletions: no cascade specified. Prefer soft-delete pattern for users to avoid historical data loss (add `deletedAt`/`isDeleted` if needed).
- `Family` deletion currently has no cascade configured — handle carefully (soft-delete recommended).

---

## Seed data scenario (exact example used for dev/demo)

This is the seed setup used for development and QA. It maps directly to your earlier seed.ts behavior (but now aligned to the current schema).

### Entities created (summary)

- 3 admin users:
  - `communityHead` — Role: `COMMUNITY_HEAD`
  - `communitySubHead` — Role: `COMMUNITY_SUBHEAD`
  - `gotraHead` — Role: `GOTRA_HEAD`

- 3 families: **Mehta**, **Shah**, **Patel** (uniqueId: FAM001..FAM003)
  - Each family: Head (FAMILY_HEAD) + Spouse (MEMBER) + Child/Member (MEMBER)

- `UserRelation` entries for each spouse pair (type = `SPOUSE`)
- Events:
  - `Diwali Celebration 2025` — status = `PENDING` (created by Mehta head)
  - `Navratri Night 2025` — status = `APPROVED` (created by Shah head)

- For the pending event, `EventApproval` created for three approvers: Community Head, Community Subhead, Gotra Head with `status = "pending"`.
- Notifications:
  - Creator gets "event_submission" notification.
  - Approvers get "event_review" notifications.
  - Approved event creator gets "event_status" notification.

### Example seed logic (pseudo summary)

- Create admin users first.
- Create families.
- Create family members and `FamilyMember` records.
- Create `UserRelation` SPOUSE entries for spouse pairs.
- Create events and approvals.
- Create notifications.

(Full `seed.ts` code is available in your earlier script — use it as-is with the updated schema.)

---

## API surface (high level)

> The document includes the full API endpoints in your original SRS. Below are the key endpoints that interact directly with the models above:

- `POST /api/users` — create user (creates `Profile` optionally)
- `POST /api/families` — create `Family` and `FamilyMember` rows
- `POST /api/families/:id/members` — create `FamilyMember`
- `POST /api/user-relations` — create `UserRelation` (use to add SPOUSE/PARENT relations)
- `POST /api/events` — create `Event` and create `EventApproval` rows for approvers
- `PATCH /api/events/:id/approvals/:approvalId` — approver action (update `EventApproval.status`, `remarks`, `reviewedAt`); update `Event.status` according to business rules
- `POST /api/resource-requests` — create `ResourceRequest`
- `PATCH /api/resource-requests/:id/approve` — approve and set `approverId`, `approverName`, `status`

New invite endpoints (family-join flow):

- `POST /api/signup/member` — create `User` and `MemberInvite` (status = `PENDING`) when `familyId` is supplied. Respond with invite id and status.
- `GET /api/families/:id/invites` — (Family Head only) list pending invites.
- `PATCH /api/families/:id/invites/:inviteId/approve` — approve invite: create `FamilyMember`, set invite status to `APPROVED`, record reviewer.
- `PATCH /api/families/:id/invites/:inviteId/reject` — reject invite: set invite status to `REJECTED` and optionally include remarks.

**Design notes**

- All list endpoints must support pagination (`page`, `limit`) and consistent `error` payloads.
- Ensure idempotency for registration/payment endpoints (use idempotency keys).

---

## Operational notes & best practices

- **Soft deletes**: prefer `deletedAt` field for `User`, `Family`, `Event` to preserve audit history.
- **Timestamps**: `createdAt`, `updatedAt` present in schema; ensure DB timezone standard (UTC).
- **Audit logging**: capture user actions (approvals, edits) in an Audit log table or use event sourcing pattern for critical flows.
- **Indexing**: index `User.email`, `Family.uniqueId`, `Event.date`, `Event.status`, `EventApproval.eventId`, `UserRelation` composite fields.
- **Backups**: daily DB backups and point-in-time recovery should be configured for production.
- **Notifications**: use a background worker for email/push (enqueue `Notification` and worker sends email/push, updates `Notification` record on success).

---

## Future extensions & migration notes

- Add `leftAt` + `active` on `FamilyMember` for explicit membership lifecycle if you need to query historical/current easily.
- Convert `EventApproval.status` and `ResourceRequest.status` to enums for DB-level strictness.
- Add `ApprovalHistory` or `Audit` model to keep every approval action as an immutable record (if detailed history required).
- If modeling pedigree extensively, add automated derivation functions (siblings inferred from shared parents).
- If needing multi-tenancy (multiple independent communities), add `organizationId` on top-level models.

---

## Appendix — enums & glossary

**Enums**

- `Role`: COMMUNITY_HEAD, COMMUNITY_SUBHEAD, GOTRA_HEAD, FAMILY_HEAD, MEMBER
- `RelationType`: SPOUSE, PARENT, CHILD, SIBLING
- `EventStatus`: PENDING, APPROVED, REJECTED, CANCELLED

**Glossary**

- **Family**: group/unit identified by `uniqueId`.
- **FamilyMember**: membership record linking `User` to `Family`.
- **UserRelation**: directed relationship between users (spouse/parent/child).
- **EventApproval**: per-approver record used to decide final event state.
