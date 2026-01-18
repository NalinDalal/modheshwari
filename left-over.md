# Modheshwari — Remaining Implementation Tasks

**Last Updated:** January 10, 2026  
**Status:** Comprehensive backlog of features to be implemented

---

## Table of Contents

1. [Not Implemented (0% Complete)](#not-implemented-0-complete)
2. [Partially Implemented / Scaffolding (25-50% Complete)](#partially-implemented--scaffolding-2550-complete)
3. [Quick Wins (Easy, High Impact)](#quick-wins-easy-high-impact)
4. [Medium Effort Tasks](#medium-effort-tasks)
5. [High Effort / v2 Features](#high-effort--v2-features)
6. [Documentation Issues to Fix](#documentation-issues-to-fix)

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

**Estimated Effort:** 3-4 days

### 2. Event Pass Generation with QR Codes

**Requirement:** FR4 in design doc  
**Expected:** Generate unique QR codes for event registrations, send as PDF

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

### 3. Forum & Discussion Features

**Requirement:** FR6 in design doc  
**Expected:** Discussion forums for community members to discuss topics

**What's Missing:**

- No forum/discussion database models
- No thread/post/comment models
- No API endpoints for CRUD operations
- No frontend forum UI

**Database Models Needed:**

```prisma
model Forum {
  id String @id @default(uuid())
  name String
  description String?
  createdBy User @relation(fields: [createdById], references: [id])
  createdById String
  threads Thread[]
  createdAt DateTime @default(now())
}

model Thread {
  id String @id @default(uuid())
  forum Forum @relation(fields: [forumId], references: [id], onDelete: Cascade)
  forumId String
  title String
  createdBy User @relation(fields: [createdById], references: [id])
  createdById String
  posts Post[]
  createdAt DateTime @default(now())
}

model Post {
  id String @id @default(uuid())
  thread Thread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  threadId String
  author User @relation(fields: [authorId], references: [id])
  authorId String
  content String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Files Needed:**

- `packages/db/schema.prisma` updates
- `apps/be/routes/forums.ts`
- `apps/web/app/forums/page.tsx`
- `apps/web/components/ForumThread.tsx`

**Estimated Effort:** 4-5 days

### 5. Location-Based Services

**Requirement:** Design doc key capability  
**Expected:** Search and discover families nearby

**What's Missing:**

- No geolocation fields in User/Profile schema
- No geospatial queries
- No location-based filtering API
- No map UI component

**Database Changes Needed:**

```prisma
model Profile {
  // ... existing fields
  latitude Float?
  longitude Float?
  @@index([latitude, longitude])  // For spatial queries
}
```

**Files Needed:**

- Geospatial indexing in PostgreSQL
- PostGIS extension for distance calculations
- `apps/be/routes/nearby.ts`
- `apps/web/components/MapView.tsx`

**Estimated Effort:** 3-4 days

---

### 6. Family Tree Visualization

**Requirement:** FR2 in design doc  
**Expected:** Visualize family relationships (spouse, parent, child, sibling)

**What's Missing:**

- No family tree building logic
- No graph visualization library
- No frontend component to display tree
- API endpoints exist but no tree-building endpoint

**Code References:**

- `UserRelation` model exists with SPOUSE, PARENT, CHILD, SIBLING types
- No endpoints to fetch/build tree structure

**Files Needed:**

- `apps/be/routes/family-tree.ts` (build tree from UserRelation)
- Graph visualization library (e.g., `react-d3-library`, `vis-network`)
- `apps/web/app/family/tree/page.tsx`

**Estimated Effort:** 3-4 days

### 7. Fan-Out services

**Expected:** What if want to fan out message to group of people

Message to gotra or whole body/community, family

**What's Missing:**

- No way to broadcast messages

### 8. Admin(Community Head, Community Sub Head, Gotra Head) Auth

**Expected:** SignUp endpoints for admins

Community head i think should be left with dev as it is only one

**What's Missing:**

- SignUp Page for admins

### 9. Admin Change

**Expected:** Change a profile i.e. edit the admin powers from a profile
admin can edit sub admin and sub-comm admin
3/more sub-comm admin can edit admin, sub admin
i.e. a profile having status as admin/sub-admin/sub-comm admin can be trasnferred or changed

### 10. OpenAPI Spec

**Expected:** OpenAPI Spec of all routes

---

## Partially Implemented / Scaffolding (25-50% Complete)

### 1. Event Management Features

**Status:** Scaffolded but not fully connected

**What's Working:**

- ✅ Event creation API exists
- ✅ Event approval workflow implemented
- ✅ Multi-role review system
- ✅ Event status tracking

**What's Missing:**

- ❌ Frontend event creation form
- ❌ Event listing/browsing UI
- ❌ Event registration UI
- ❌ Event details page

**Files to Complete:**

- `apps/web/app/events/page.tsx` (list events)
- `apps/web/app/events/create/page.tsx` (create event)
- `apps/web/app/events/[id]/page.tsx` (event details)
- `apps/web/app/events/[id]/register/page.tsx` (registration form)

**Estimated Effort:** 2-3 days

---

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

---

### 3. User Relationships (Family Tree)

**Status:** Schema ready, no API or UI

**What's Working:**

- ✅ `UserRelation` model with types (SPOUSE, PARENT, CHILD, SIBLING)
- ✅ Unique constraints to prevent duplicates

**What's Missing:**

- ❌ API endpoints to create/update/delete relations
- ❌ Family tree building logic
- ❌ UI for managing relationships
- ❌ Reciprocal relationship logic

**Files Needed:**

- `apps/be/routes/user-relations.ts`
- Reciprocal relationship creation logic
- `apps/web/app/family/relationships/page.tsx`

**Estimated Effort:** 2-3 days

---

### 4. User Profile Management

**Status:** Model exists, no endpoints

**What's Working:**

- ✅ Profile model with all fields (phone, address, profession, gotra)
- ✅ One-to-one relation with User

**What's Missing:**

- ❌ Profile update endpoints
- ❌ Profile viewing UI
- ❌ Gotra selection interface
- ❌ Profession/skill listing

**Files Needed:**

- `apps/be/routes/profile.ts` (PATCH endpoint)
- `apps/web/app/profile/page.tsx` (edit profile)
- `apps/web/app/profile/[userId]/page.tsx` (view profile)

**Estimated Effort:** 1-2 days

### 1. Complete Profile Management

**Files to Create:**

- [x] `apps/be/routes/profile.ts` — PATCH `/api/profile`
- [ ] `apps/web/app/profile/page.tsx` — Profile edit form
- [ ] `apps/web/app/profile/[userId]/page.tsx` — Profile view

**Estimated Time:** 4-6 hours  
**Impact:** Critical for user experience

need to visualise complete profile at `/me` endpoint mind-you

---

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

---

### 6. Email Notifications

**Status:** Model exists, not sending actual emails

**What's Working:**

- ✅ Notification model in database
- ✅ Notification creation on events
- ✅ In-app notifications functional

**What's Missing:**

- ❌ Email service integration (SendGrid/SMTP)
- ❌ Email template system
- ❌ Email sending on notification creation
- ❌ Email preference management

**Files Needed:**

- Email service integration in `apps/be/routes/notifications.ts`
- Email templates
- Notification preference model/API

**Estimated Effort:** 1-2 days

what do you suggest for notifications??
system design, it's a lot of people, single server handling it , it will be destroyed

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

---

### 3. Email Notification Sending

**Setup Steps:**

1. Add SendGrid API key to `.env`
2. Create email template helper
3. Update `handleCreateNotification` to send emails
4. Add notification preference model/API

**Estimated Time:** 4-6 hours  
**Impact:** Users get actual email updates

---

### 4. Pagination Support

**Add to All List Endpoints:**

- `/api/resource-requests?page=1&limit=20`
- `/api/events?page=1&limit=10`
- `/api/families/:id/members?page=1&limit=50`
- `/api/search?q=X&page=1&limit=20`

**Estimated Time:** 2-3 hours  
**Impact:** Handles large datasets

---

### 5. Medical Information Recording

**Files to Create:**

- [ ] Add `MedicalRecord` model to schema
- [ ] `apps/be/routes/medical-records.ts`
- [ ] `apps/web/app/medical/records/page.tsx`

**Estimated Time:** 4-5 hours  
**Impact:** Completes medical module

---

### 6. Advanced Search Filters

**Extend Search Endpoint:**

- Add gotra filter
- Add profession filter
- Add location filter (when geolocation added)
- Update UI with filter dropdowns

**Estimated Time:** 3-4 hours  
**Impact:** Better user discovery

---

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

---

### 2. Payment Gateway Integration

**Options:**

- Stripe (recommended for international)
- Razorpay (good for India)
- PayPal

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

### 4. Polls & Voting System

**Components:**

- Poll creation
- Vote UI
- Results visualization
- Poll history

**Estimated Time:** 2-3 days  
**Impact:** Community decision-making

---

### 5. Family Tree Visualization

**Implementation:**

- API endpoint to build tree from relations
- Graph visualization (D3.js or vis-network)
- Interactive tree view
- Relationship editing from tree

**Estimated Time:** 3-4 days  
**Impact:** Visual family overview

---

## High Effort / v2 Features

### 1. Hindu Calendar Integration

**Requirements:**

- Calendar data source (API or local)
- Display system
- Festival reminders
- Integration with events

**Estimated Time:** 1 week  
**Impact:** High visibility, important for community

[link1](https://github.com/karthikraman/panchangam)
[link2](https://gist.github.com/hrishikeshrt/0090a0460608728f32381164ea54865c)

---

### 2. Location-Based Services

**Requirements:**

- Geolocation data in profiles
- PostGIS for spatial queries
- Nearby search API
- Map UI component

**Estimated Time:** 1 week  
**Impact:** Location discovery and services

---

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

### 5. Real-Time Features

**Options:**

- WebSocket for notifications
- Live member updates
- Real-time event updates
- Chat system (optional)

**Estimated Time:** 1 week+  
**Impact:** Better UX, higher engagement

---

## Documentation Issues to Fix

### 2. **Design.md**

- [ ] Mark FR4 (Event Management) as "Partially Complete"
- [ ] Mark FR6 (Community Features) as "Future"
- [ ] Add Hindu calendar to "Future Enhancements"
- [ ] Remove/clarify location-based services

---

## Implementation Priority Matrix

### Phase 1: Foundation (Weeks 1-2)

1. ✅ Profile management (quick win)
2. ✅ User relationships API (quick win)
3. ✅ Email notifications (quick win)
4. ✅ Advanced search filters (quick win)
5. ✅ Medical records completion (quick win)

**Effort:** 2-3 weeks  
**Blockers:** None

---

### Phase 2: Events & Engagement (Weeks 3-4)

1. Event management UI
2. Payment gateway integration
3. Polls & voting system
4. Event pass generation with QR

**Effort:** 3-4 weeks  
**Blockers:** Payment gateway API keys

---

### Phase 3: Community Features (Weeks 5-6)

1. Forum system
2. Family tree visualization
3. Email templates & preferences

**Effort:** 3-4 weeks  
**Blockers:** None

---

### Phase 4: Advanced Features (Weeks 7+)

1. Hindu calendar
2. Location-based services
3. Full-text search (Elasticsearch)
4. Real-time features

**Effort:** 2-3 weeks each  
**Blockers:** Architecture decisions needed

---

## Quick Reference: File Status

| Component           | Model | API | Frontend | Status      |
| ------------------- | ----- | --- | -------- | ----------- |
| User Management     | ✅    | ✅  | ✅       | Complete    |
| Family Management   | ✅    | ✅  | ✅       | Complete    |
| Resource Requests   | ✅    | ✅  | ✅       | Complete    |
| Event Management    | ✅    | ⚠️  | ❌       | Partial     |
| Payments            | ⚠️    | ❌  | ❌       | Scaffolding |
| Events QR Codes     | ❌    | ❌  | ❌       | Not Started |
| Forums              | ❌    | ❌  | ❌       | Not Started |
| Polls               | ❌    | ❌  | ❌       | Not Started |
| Calendar            | ❌    | ❌  | ❌       | Not Started |
| Location Services   | ❌    | ❌  | ❌       | Not Started |
| Family Tree         | ⚠️    | ⚠️  | ❌       | Partial     |
| User Relations      | ✅    | ❌  | ❌       | Schema Only |
| Profiles            | ✅    | ❌  | ❌       | Schema Only |
| Medical Info        | ⚠️    | ⚠️  | ❌       | Partial     |
| Email Notifications | ✅    | ⚠️  | ✅       | Partial     |
| Advanced Search     | ⚠️    | ⚠️  | ❌       | Partial     |

---

**Legend:**

- ✅ = Complete & Working
- ⚠️ = Partial / Scaffolding
- ❌ = Not Started

---

Modheshwari:
Hall wise resource should be visible,

Someone wanna notify everyone/or particular gotra

Booking

Message to gotra or whole body/community, family
Notification to admins only

Admin change logic check it please
What is wanna change admins

Need to reach out people not in state/country

Need to put logic for

Uhh, once do like complete db drop, then seed as per schema, so that everything exists all at once, so can actually see in db upon visualise

——

To do as developer:

Admin signup logic to see,

---

4. **Location-Based Rendering**
   - Filter and display families based on location (city, state).

5. **Event Management**
   - View upcoming events.
   - Register for events and make payments online.
   - Download event passes with unique IDs.

6. **Notification System**
   - Push notifications for important updates and reminders.
   - Email notifications for event registrations and other alerts.
   - Use Kafka Service

7. **Search Functionality**
   - Search for families and members based on various criteria.
   - Use Elasticsearch for fast and efficient searches.

8. **Storage**
   - Store things like user profile pic, etc on AWS S3
