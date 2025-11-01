# Project Steps & Data Model Rationale

## 1. Requirements & Design Doc Review

- Analyzed the design document outlining the Community Management Platform.
- Identified core features: user management, family management, event management, resource requests, notifications, search, and more.
- Noted technical stack: Next.js, Node.js, PostgreSQL, Prisma ORM, AWS, etc.

## 2. Data Model Planning

- Broke down features into entities: User, Profile, Family, FamilyMember, Event, EventRegistration, Payment, ResourceRequest, Notification.
- Considered relationships, privacy, extensibility, and scalability.

## 3. Why This Specific Schema?

- **User vs Profile:**
  - `User` holds authentication and core account info (email, password, role).
  - `Profile` holds extended, often optional, user details (phone, address, profession, gotra, etc.).
  - This separation allows for privacy, easier updates, and future extensibility.
- **Family & FamilyMember:**
  - Families are distinct entities; members are linked via a join table (`FamilyMember`) to support roles and history.
- **Event & Registration:**
  - Events are core to the platform; registrations and payments are tracked separately for flexibility.
- **ResourceRequest:**
  - Supports hierarchical approval and tracking, as required by the design doc.
- **Notification:**
  - Centralized notification model for email, in-app, and future push notifications.
- **Enums & Statuses:**
  - Used enums for roles and statuses to ensure data integrity and clarity.
- **Audit Fields:**
  - Timestamps and optional audit fields for tracking changes and compliance.

## 4. Steps for Application Development

1. **Initialize monorepo** with Bun, TurboRepo, and workspaces for apps and packages. - done
2. **Set up UI library** and add basic test cases. - done
3. **Configure CI/CD** with GitHub Actions for build, test, and deploy. - done
4. **Design and document database schema** using Prisma, based on design doc. - done
5. **Implement backend services** (APIs, authentication, business logic) using Node.js and Prisma.
   Authentication implemented for family, need to see for admin routes
6. **Develop frontend apps** (web, admin, etc.) using Next.js and shared UI components.
7. **Write comprehensive tests** for all features (unit, integration, e2e).
8. **Deploy to production** using CI/CD pipeline and cloud infrastructure.
9. **Monitor, document, and iterate** based on feedback and analytics.

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

move ahead to higher level authentications now
