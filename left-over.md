# Modheshwari — Remaining Tasks
### 1. Prod Hardening

Implement a drain/persistence worker to flush Redis-cached notifications to the DB reliably.

Production hardening: Kafka/Redis monitoring, DLQ handling, and end-to-end verification.

### 2. Event Management Features

**API Endpoints:**

- `POST /api/events` - Create event
- `GET /api/events` - List events (with status filter)
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/register` - Unregister from event
- `GET /api/events/:id/registrations` - List registrations (admin only)
- `POST /api/events/:id/approve` - Approve/reject event (admin only)


### 3. Event Pass Generation with QR Codes

**Requirement:** 
- QR code generation library
- PDF generation
- S3 storage
- Pass delivery system
- QR scanning at events

**Expected:** Generate unique QR codes for event registrations, send as PDF on mail upon confirmation, when events are for community or subcommunity

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

**Estimated Effort:** 4-5 days

### 4. Payment Gateway Integration

**Status:** Model scaffolded, no actual processing

**What's Working:**

- ✅ Payment model in database
- ✅ Payment status tracking

- [Razorpay](https://razorpay.com/docs/#home-payments)

**What's Missing:**

- ❌ Payment gateway integration (Razorpay)
- ❌ Payment processing API
- ❌ Webhook handlers for payment notifications
- ❌ Payment UI/checkout form

**Implementation:**

1. Add SDK to backend
2. Create payment intent endpoint
3. Handle webhooks
4. Add payment form UI
   **Code References:**

- `Payment` model in schema
- No integration code exists

**Files Needed:**

- `apps/be/routes/payments.ts`
- Payment gateway SDK configuration
- `apps/web/components/PaymentForm.tsx`

**Estimated Time:** 3-4 days  
**Impact:** Enables paid events

### 5. Full-Text Search with Elasticsearch

**Requirements:**

- Elasticsearch setup
- Index management
- Full-text search API
- Advanced filtering
- Search analytics

**Estimated Time:** 1 week  
**Impact:** Production-grade search






### 6. UI Refactor

- Refactor ui to [this](https://patterncraft.fun/)

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
| Calendar            | ✅    | ✅  | ✅       | Complete              |
| Location Services   | ✅    | ✅  | ✅       | Complete              |
| Family Tree         | ✅    | ✅  | ✅       | Complete           |
| User Relations      | ✅    | ✅  | ✅       | Complete           |
| Profiles            | ✅    | ✅  | ✅       | Complete (via search) |
| Medical Info        | ✅    | ✅  | ✅       | Complete               |
| Notifications       | ✅    | ✅  | ✅       | Complete   |
| Advanced Search     | ✅    | ✅  | ❌       | Partial               |
| WebSocket/Real-Time | ✅    | ✅  | ✅       | Complete           |

**Legend:**

- ✅ = Complete & Working
- ⚠️ = Partial / Scaffolding
- ❌ = Not Started