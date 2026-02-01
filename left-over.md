# Modheshwari — Remaining Implementation Tasks

## Table of Contents

1. [Not Implemented (0% Complete)](#not-implemented-0-complete)
2. [Partially Implemented / Scaffolding (25-50% Complete)](#partially-implemented--scaffolding-25-50-complete)
3. [Quick Wins (Easy, High Impact)](#quick-wins-easy-high-impact)
4. [Medium Effort Tasks](#medium-effort-tasks)
5. [High Effort / v2 Features](#high-effort--v2-features)

---

## Not Implemented (0% Complete)

### 1. Hindu Calendar Integration

**Requirement:** FR6 in design doc  
**Expected:** Display Hindu calendar with important dates, festivals, observances

**What's Missing:**

- No calendar data model
- No API endpoints
- No frontend calendar component
- No integration with external calendar data

**Files Affected:**

- Need: `packages/db/schema.prisma` (add Calendar/CalendarEvent models)
- Need: `apps/be/routes/calendar.ts`
- Need: `apps/web/app/calendar/page.tsx`

**Requirements:**

- Calendar data source (API or local)
- Display system
- Festival reminders
- Integration with events

**Estimated Time:** 1 week  
**Impact:** High visibility, important for community

[link1](https://github.com/karthikraman/panchangam)
[link2](https://gist.github.com/hrishikeshrt/0090a0460608728f32381164ea54865c)

### 2. Event Pass Generation with QR Codes

**Requirement:** FR4 in design doc  
**Expected:** Generate unique QR codes for event registrations, send as PDF on mail upon confirmation

**What's Missing:**

- No QR code generation library
- No S3 integration for storing passes
- No pass template system
- No PDF generation for passes

**Code References:**

- Design doc mentions: "Unique QR code for each registration with encrypted data"
- Database: `EventRegistration` model has `passId` and `passQRCode` fields but never populated

**Files Needed:**

- `apps/be/routes/event-pass-generation.ts`
- QR code library (e.g., `qrcode.js`)
- PDF generation library (e.g., `pdfkit`)
- S3 client configuration

**Estimated Effort:** 3-4 days

---

## Partially Implemented / Scaffolding (25-50% Complete)

### 1. Event Management Features

**API Endpoints:**

- `POST /api/events` - Create event
- `GET /api/events` - List events (with status filter)
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/register` - Unregister from event
- `GET /api/events/:id/registrations` - List registrations (admin only)
- `POST /api/events/:id/approve` - Approve/reject event (admin only)

### 2. Payment Gateway Integration

**Status:** Model scaffolded, no actual processing

**What's Working:**

- ✅ Payment model in database
- ✅ Payment status tracking

**What's Missing:**

- ❌ Payment gateway integration (Stripe/Razorpay/etc.)
- ❌ Payment processing API
- ❌ Webhook handlers for payment notifications
- ❌ Payment UI/checkout form

**Code References:**

- `Payment` model in schema
- No integration code exists

**Files Needed:**

- `apps/be/routes/payments.ts`
- Payment gateway SDK configuration
- `apps/web/components/PaymentForm.tsx`

**Estimated Effort:** 3-4 days

### 5. Medical Information

**Status:** Route file exists but incomplete

**What's Working:**

- ✅ Route file created: `apps/be/routes/medical.ts`
- ✅ Status update for deceased workflow partially implemented

**What's Missing:**

- ❌ Medical history model
- ❌ Blood type tracking
- ❌ Allergies/conditions field
- ❌ Medical records management
- ❌ Complete API endpoints
- ❌ Frontend UI

**Database Models Needed:**

```prisma
model MedicalRecord {
  id String @id @default(uuid())
  user User @relation(fields: [userId], references: [id])
  userId String
  bloodType String?
  allergies String?
  conditions String?
  medications String?
  notes String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Files to Complete:**

- `apps/be/routes/medical.ts` (full implementation)
- `apps/web/app/medical/page.tsx` (UI)

**Estimated Effort:** 1-2 days

### 6. Notification System (Email + Push + Real-Time)

**Status:** 70% Complete - Kafka infrastructure done, workers + WebSocket integration needed

**What's Working:**

- ✅ Notification model in database with multi-channel support (IN_APP, EMAIL, PUSH, SMS)
- ✅ Kafka producer: `apps/be/kafka/notification-producer.ts`
- ✅ Kafka infrastructure with topic: `notification.events`
- ✅ WebSocket server: `apps/ws/index.ts` (separate process)
- ✅ In-app notifications functional
- ✅ Rate limiting on notification creation
- ✅ Role-based notification scoping
- ✅ Profile fields for preferences: `fcmToken`, `notificationPreferences` JSON

**Production Architecture (scales to 100k+ users):**

```
API Server (Bun)
    ↓ (Kafka produce, <5ms)
Kafka Topic: notification.events
    ↓ (Consumer)
Router Worker (Route to channels)
    ├→ Email Worker (SendGrid/SMTP) → Email Channel
    ├→ Push Worker (Firebase FCM) → Push Notifications
    ├→ In-App Worker → Redis Pub/Sub
                          ↓
WebSocket Servers (Redis clustered)
    ↓
Connected Clients (Real-time updates)
```

**Why This Scales (for 10-15k+ users):**

- API doesn't block on email/push (Kafka queues events)
- Multiple workers process in parallel (run 2-5 instances)
- Redis Pub/Sub connects WebSocket servers (no single point of failure)
- Kafka persists messages (no data loss on worker failure)
- Each component scales independently

**What's Missing (To Complete):**

### Priority 1: Email Worker (2-3 hours)

- Create: `apps/be/kafka/workers/email-worker.ts`
- Subscribe to `notification.email` topic
- Integrate SendGrid or Nodemailer
- Add email template system
- Handle retries with backoff

### Priority 2: Push Notification Worker (2-3 hours)

- Create: `apps/be/kafka/workers/push-worker.ts`
- Subscribe to `notification.push` topic
- Integrate Firebase Cloud Messaging (FCM)
- Handle invalid tokens (delete from DB)
- Add device token management

### Priority 3: In-App + WebSocket Integration (2-3 hours)

- Update: `apps/ws/index.ts` to use Redis Pub/Sub
- Create: `apps/be/kafka/workers/in-app-worker.ts`
- Connect WebSocket servers with Redis for clustering
- Broadcast in-app notifications to connected users
- Handle user presence tracking

### Priority 4: Notification Preferences UI (1-2 hours)

- Create: `apps/web/app/notifications/preferences/page.tsx`
- Allow users to choose: Email, Push, In-App, SMS
- Store preferences in `Profile.notificationPreferences`
- Add unsubscribe links in emails (GDPR compliant)

**Files to Create/Update:**

```
Backend:
- ✅ apps/be/kafka/notification-producer.ts (done)
- ❌ apps/be/kafka/workers/email-worker.ts (NEW)
- ❌ apps/be/kafka/workers/push-worker.ts (NEW)
- ❌ apps/be/kafka/workers/in-app-worker.ts (NEW)
- ❌ apps/be/kafka/workers/router-worker.ts (OPTIONAL - route to channels)
- 📝 apps/be/routes/notifications.ts (add email templates)
- 📝 apps/ws/index.ts (add Redis Pub/Sub)

Frontend:
- ❌ apps/web/app/notifications/preferences/page.tsx (NEW)
- 📝 apps/web/components/NotificationProvider.tsx (add WebSocket hook)

Config:
- 📝 .env.example (add SendGrid, FCM, Redis keys)
```

**Environment Variables Needed:**

```bash
# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SEND_FROM_EMAIL=notifications@modheshwari.com

# Push (FCM)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Redis
REDIS_URL=redis://localhost:6379

# WebSocket
WS_PORT=8080
WS_SECRET=your_jwt_secret
```

**Estimated Effort:** 2-3 days (for all 4 priorities)

**Implementation Order:**

1. Email Worker (highest impact, most used)
2. WebSocket + Redis (real-time delighter)
3. Push Notifications (mobile support)
4. Notification Preferences UI (user control)

---

### 7. Fan-Out Services

**Status:** Not started (depends on notification system above)

**Use Cases:**

- Broadcast to entire gotra (1 message → 100+ people)
- Community-wide announcements
- Family group messages
- Emergency alerts

**What's Needed:**

- Recipient resolution: Find all users in gotra/community/family
- Batch notification creation (performance)
- Targeting: Gotra, Community, Family scopes
- Role-based filtering (notify only Family Heads, etc.)

**Approach:**

```typescript
// Example: Fan-out to gotra
const users = await prisma.user.findMany({
  where: {
    profile: { gotra: "Sharma" },
    status: true,
  },
});

// Batch create notifications (don't create 100 individual rows)
await prisma.notification.createMany({
  data: users.map((u) => ({
    userId: u.id,
    type: "ANNOUNCEMENT",
    message: "New event in your gotra!",
    // ... rest of fields
  })),
});

// Then produce single Kafka event for fan-out
await producer.send({
  topic: "notification.events",
  messages: [
    {
      value: JSON.stringify({
        recipientIds: users.map((u) => u.id),
        type: "ANNOUNCEMENT",
        channels: ["IN_APP", "EMAIL"],
      }),
    },
  ],
});
```

**Estimated Effort:** 1-2 days (after email/push workers done)

---

## Quick Wins (Easy, High Impact)

### 2. User Relationships API

**Files to Create:**

- [ ] `apps/be/routes/user-relations.ts` — CRUD operations
- [ ] Endpoints:
  - `POST /api/user-relations` — Create relation
  - `GET /api/user-relations?userId=X` — List relations
  - `PATCH /api/user-relations/:id` — Update
  - `DELETE /api/user-relations/:id` — Delete

**Estimated Time:** 3-4 hours  
**Impact:** Enables family tree building

### 4. Pagination Support

**Add to All List Endpoints:**

- `/api/resource-requests?page=1&limit=20`
- `/api/events?page=1&limit=10`
- `/api/families/:id/members?page=1&limit=50`
- `/api/search?q=X&page=1&limit=20`

**Estimated Time:** 2-3 hours  
**Impact:** Handles large datasets

### 5. Medical Information Recording

**Files to Create:**

- [ ] Add `MedicalRecord` model to schema
- [ ] `apps/be/routes/medical-records.ts`
- [ ] `apps/web/app/medical/records/page.tsx`

**Estimated Time:** 4-5 hours  
**Impact:** Completes medical module

## Medium Effort Tasks

### 1. Event Management Complete UI

**Components Needed:**

- Event creation form with approvals
- Event listing/browsing
- Event details page
- Registration form
- Event calendar view

**Estimated Time:** 2-3 days  
**Impact:** Users can fully manage events

5. **Event Management**
   - View upcoming events.
   - Register for events and make payments online.
   - Download event passes with unique IDs.

---

### 2. Payment Gateway Integration

- Razorpay (good for India)
- BHIM UPI

**Implementation:**

1. Add SDK to backend
2. Create payment intent endpoint
3. Handle webhooks
4. Add payment form UI

**Estimated Time:** 3-4 days  
**Impact:** Enables paid events

---

### 3. Forum System

**Core Components:**

- Forum listing
- Thread creation
- Post commenting
- Moderation tools
- Search within forums

**Estimated Time:** 4-5 days  
**Impact:** Community engagement

---

## High Effort / v2 Features

### 3. QR Code Pass Generation

**Requirements:**

- QR code generation library
- PDF generation
- S3 storage
- Pass delivery system
- QR scanning at events

**Estimated Time:** 4-5 days  
**Impact:** Professional event management

---

### 4. Full-Text Search with Elasticsearch

**Requirements:**

- Elasticsearch setup
- Index management
- Full-text search API
- Advanced filtering
- Search analytics

**Estimated Time:** 1 week  
**Impact:** Production-grade search

---

## Quick Reference: File Status

| Component           | Model | API | Frontend | Status                |
| ------------------- | ----- | --- | -------- | --------------------- |
| User Management     | ✅    | ✅  | ✅       | Complete              |
| Family Management   | ✅    | ✅  | ✅       | Complete              |
| Resource Requests   | ✅    | ✅  | ✅       | Complete              |
| Event Management    | ✅    | ⚠️  | ❌       | Partial               |
| Payments            | ⚠️    | ❌  | ❌       | Scaffolding           |
| Events QR Codes     | ❌    | ❌  | ❌       | Not Started           |
| Forums              | ❌    | ❌  | ❌       | Not Started           |
| Polls               | ❌    | ❌  | ❌       | Not Started           |
| Calendar            | ❌    | ❌  | ❌       | Not Started           |
| Location Services   | ✅    | ✅  | ❌       | Complete (API only)   |
| Family Tree         | ✅    | ✅  | ⚠️       | Mostly Done           |
| User Relations      | ✅    | ❌  | ❌       | Schema Only           |
| Profiles            | ✅    | ✅  | ✅       | Complete (via search) |
| Medical Info        | ✅    | ✅  | ❌       | Partial               |
| Notifications       | ✅    | ⚠️  | ⚠️       | 70% - Needs Workers   |
| Advanced Search     | ✅    | ✅  | ❌       | Partial               |
| WebSocket/Real-Time | ✅    | ⚠️  | ❌       | Needs Redis           |

---

**Legend:**

- ✅ = Complete & Working
- ⚠️ = Partial / Scaffolding
- ❌ = Not Started

---

Modheshwari:
Hall wise resource should be visible,

Someone wanna Notify/Message to gotra or whole body/community, family
Notification to admins only

Admin change logic check it please
What if wanna change admins

---

7. **Storage**
   - Store things like user profile pic, etc on AWS S3

---

Add priority selector, channel chooser, preview before sending

WebSocket(new server in apps) to refresh notifications without page reload

---

blend [this](https://patterncraft.fun/) into ui

