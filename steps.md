# Project Steps & Data Model Rationale

## 1. Requirements & Design Doc Review

- Analyzed the design document outlining the Community Management Platform.
- Identified core features: user management, family management, event management, resource requests, notifications, search, and more.
- Noted technical stack: Next.js, Node.js, PostgreSQL, Prisma ORM, AWS, etc.

## 2. Data Model Planning

- Broke down features into entities: User, Profile, Family, FamilyMember, Event, EventRegistration, Payment, ResourceRequest, Notification.
- Considered relationships, privacy, extensibility, and scalability.

## 3. Why This Specific Schema?

- **User & Profile:**
  - `User` holds authentication and core account info (email, password, role).
  - `Profile` holds extended, often optional, user details (phone, address, profession, gotra, etc.).
  - This separation allows for privacy, easier updates, and future extensibility.
    **done**

- **Family & FamilyMember:**
  - Families are distinct entities; members are linked via a join table (`FamilyMember`) to support roles and history.
    **done**

- **Event & Registration:**
  - Events are core to the platform; registrations and payments are tracked separately for flexibility.
    **done**

- **ResourceRequest:**
  - Supports hierarchical approval and tracking, as required by the design doc.
    **done**

- **Notification:**
  - Centralized notification model for email, in-app, and future push notifications.
    **done**

- **Enums & Statuses:**
  - Used enums for roles and statuses to ensure data integrity and clarity.
    **done**

- **Audit Fields:**
  - Timestamps and optional audit fields for tracking changes and compliance.

## 4. Steps for Application Development

1. **Initialize monorepo** with Bun, TurboRepo, and workspaces for apps and packages. - done
2. **Set up UI library** and add basic test cases. - done
3. **Configure CI/CD** with GitHub Actions for build, test, and deploy. - done
4. **Design and document database schema** using Prisma, based on design doc. - done
5. **Implement backend services** (APIs, authentication, business logic) using Node.js and Prisma.
   Authentication implemented for family, need to see for admin routes
6. **Develop frontend apps** (web, admin, etc.) using Next.js and shared UI components. - family one done
7. **Deploy to production** using CI/CD pipeline and cloud infrastructure.
8. **Monitor, document, and iterate** based on feedback and analytics.

---

This file will be updated as the project progresses, documenting all major architectural and development decisions.

30.10.2025
finally done with db

31.10.2025
family head signup done

to do next: signin for family head, then same thing for family members
once it is done, we take care of higher level auth

01.11.2025
[authentication for family-head, family-members done](./auth.md)
/me endpoint loaded

added endpoint to fetch all family members, now
their authentication and all bullshit done

logic to update status of any member also done

02.11.2025
ui init, cors errors resolved, fe connects to be
initiated tailwind, styling started
kepts each method to async-await to put on fe

03.11.2025
got thru tailwind

04.11.2025
search endpoint implemented on ui side
notifications added, routes added to request resources

move ahead to higher level authentications now
authentication for community head, sub community head, community subhead stc

05.11.2025
higher level auth and request approval/changes/rejected done

feat: ui init and works for family mem and family head, signin-signup done, me endpoint also done
feat: admin auth routes spined up

06.11.2025
had a ppt so didn't coded

07.11.2025
added contact pages, about pages

---

todo:
work on ui more

Check the ui resources in notion doc
Try to first create a great landing page from it

U have monorepo so make sure to create reusable ui like buttons text fields etc

Use the notion doc, try for buttons till u are not satisfied

Let's say there is a delete button
Now don't use ai, create your own custom button. Rectangular, small curved corners, put a sorta dustbin, then text
Upon hover dustbin must animate
Button color shift to white, and text to red
done for delete, sign-out etc

Do work on things like this

For dark mode black bg, White text
Normal mode white bg, dark text

Buttons can be blue bg, White text
Red bg White text

Upon hover transition to vice versa

---

Do caching for modheswari, don't do in memory

13.11.2025
say if someone died, then family members can sendout request to set the profile as deceased, then community head and subcommunity head have to collectively approve to make it go through
hence do the database update

then put up with a endpoint basically to do this deeds, admins can approve the request,
normal user can only asks

feat: finally cleared all logic for authentications, Implemented and fixed:

### **1. JWT Authentication Utilities**

**File:** `packages/utils/jwt.ts`
Implemented and fixed:

- **`signJWT(payload)`** → Signs JWT with `JWT_SECRET`, valid for 7 days.
- **`verifyJWT(token)`** → Verifies token, returns decoded user or `null` on error.
- **`verifyAuth(req)`** → Extracts Bearer token from request headers, verifies, and returns user identity or `null`.

Fixed type errors:

- Switched to `import type { JwtPayload }` because of `"verbatimModuleSyntax": true` in tsconfig.

### **2. Response Helpers**

**File:** `packages/utils/response.ts`
Created a consistent response layer:

- `createResponse()` — unified builder for API responses (with timestamp + status).
- `success()` / `failure()` — shortcuts for 200/400 style responses.
- (Discussed deprecating `jsonResponse` since `success()` covers that use case).

### **3. Status Update Request Module**

**File:** `apps/be/routes/status-update-request.ts`
This is your new **“Report Deceased / Update Status”** workflow.

#### ** Endpoints implemented:**

1. **`handleCreateStatusUpdateRequest(req)`**
   - Authenticates user (via `verifyAuth`).
   - Reads `targetUserId`, `reason` from body.
   - Creates a new record in `statusUpdateRequest` table.
   - Auto-creates **approval records** for:
     - `COMMUNITY_SUBHEAD`
     - `GOTRA_HEAD`

   - Uses `findApprover(role)` helper to locate active approvers.

2. **`handleListStatusUpdateRequests(req)`**
   - Lists requests visible to current user:
     - Either they _requested_ it, or they’re an _approver_.

   - Includes full related data (`targetUser`, `approvals`).

3. **`handleReviewStatusUpdateRequest(req, id)`**
   - Allows an approver to **approve/reject** a request.
   - If _all approvers approve_, automatically:
     - Marks the request as `APPROVED`
     - Updates target user’s `profile.status` to `"deceased"`.

Fixed issues:

- Declared `body` types properly to remove TS errors (`unknown` → defined interface).
- Imported `type { Role }` from `@prisma/client` for stricter Prisma typings.

### **4. Monorepo Config Fixes**

**File:** `tsconfig.json`
Added correct path mapping:

```json
"paths": {
  "@modheshwari/db": ["packages/db/index.ts"],
  "@modheshwari/utils/*": ["packages/utils/*"]
}
```

This made cross-package imports work cleanly.

## **Frontend (apps/web)**

### **5. Medical Page Auth Check**

**File:** `app/medical/page.tsx`
Implemented:

- Automatic redirect to `/signin` if no token.
- Calls `/me` API to validate token and fetch user.
- Handles expired token gracefully.
- Sets `user` state + renders dashboard if authenticated.

Fixed:

- Missing `useRouter` import.
- Missing component closing brace (`Expected '}', got <eof>` build error).
- Added basic `loading` and `no-user` UI.

---

14.11.2025

status report, like routing for alive-deceased and family transfers taken care

1. Alive / Deceased Status Updates

- **GET** `/api/status-update-requests` → list all requests (user-created or assigned as approver)
- **POST** `/api/status-update-requests` → create a new request
- **POST** `/api/status-update-requests/:id/review` → approve/reject a request

2. Family Transfers / Marriages

- **POST** `/api/family/transfer` → transfer user to new family
- Previous memberships are **not ended**; new `FamilyMember` row created

3. routes to handle with medical status updates

---

15.11.2025
feat(search): add keyboard shortcut, caching, and rate limiting; refactor endpoint and UI

---

Do stress testing of your APIs - done
[Benchmark them](./stress-testing.md)
