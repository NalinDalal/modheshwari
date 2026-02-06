# Modheshwari — Remaining Implementation Tasks

## Table of Contents

1. [Not Implemented (0% Complete)](#not-implemented-0-complete)
2. [Partially Implemented / Scaffolding (25-50% Complete)](#partially-implemented--scaffolding-25-50-complete)
3. [Quick Wins (Easy, High Impact)](#quick-wins-easy-high-impact)
4. [Medium Effort Tasks](#medium-effort-tasks)
5. [High Effort / v2 Features](#high-effort--v2-features)

---

## Not Implemented (0% Complete)


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

### 5. Phone No

    Take input from the user.
    Identify the country of the user. (You can either use the IP address of the user to identify this or ask
 for country-input )
    Check the formatting of the phone number and compare with that country’s format
    If Invalid, prompt the user to re-enter
    If Valid, convert the format into E.164 in string and store in your DB.
    Hence, you need to employ various processes before you store them. You can either build these processes 
by yourself or use various APIs available. BigDataCloud has a FREE API which you can use to solve all your phone verification challenges.

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

7. **Storage**
   - Store things like user profile pic, etc on AWS S3

---

Add priority selector, channel chooser, preview before sending

WebSocket(new server in apps) to refresh notifications without page reload

---

blend [this](https://patterncraft.fun/) into ui