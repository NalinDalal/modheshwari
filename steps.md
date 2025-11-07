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
