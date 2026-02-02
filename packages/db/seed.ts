import { config } from "dotenv";
import { join } from "path";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });
config();
import {
  PrismaClient,
  Role,
  RelationType,
  EventStatus,
  ApprovalStatus,
  InviteStatus,
  NotificationType,
  NotificationChannel,
} from "@prisma/client";
import { hashPassword } from "../utils/hash.ts";

const prisma = new PrismaClient();

/**
 * Performs main operation.
 * @returns {Promise<void>} Description of return value
 */
async function main() {
  console.log("Starting database seed...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not found in environment variables");
  }

  // Create admin users
  const communityHeads = await Promise.all([
    prisma.user.create({
      data: {
        name: "Aarav Mehta",
        email: "community1@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Sharma",
        email: "community2@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Rohan Gupta",
        email: "community3@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Ananya Reddy",
        email: "community4@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_HEAD,
        status: true,
      },
    }),
  ]);

  const communitySubheads = await Promise.all([
    prisma.user.create({
      data: {
        name: "Diya Shah",
        email: "subhead1@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_SUBHEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Aryan Kumar",
        email: "subhead2@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_SUBHEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Ishaan Singh",
        email: "subhead3@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_SUBHEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Meera Joshi",
        email: "subhead4@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_SUBHEAD,
        status: true,
      },
    }),
  ]);

  const gotraHeads = await Promise.all([
    prisma.user.create({
      data: {
        name: "Kabir Patel",
        email: "gotra1@demo.com",
        password: await hashPassword("123"),
        role: Role.GOTRA_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sanya Verma",
        email: "gotra2@demo.com",
        password: await hashPassword("123"),
        role: Role.GOTRA_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Vihaan Kapoor",
        email: "gotra3@demo.com",
        password: await hashPassword("123"),
        role: Role.GOTRA_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Aisha Nair",
        email: "gotra4@demo.com",
        password: await hashPassword("123"),
        role: Role.GOTRA_HEAD,
        status: true,
      },
    }),
  ]);

  console.log("Created admin users");

  // Create families
  const families = await Promise.all([
    prisma.family.create({
      data: { name: "Mehta Family", uniqueId: "FAM001" },
    }),
    prisma.family.create({
      data: { name: "Shah Family", uniqueId: "FAM002" },
    }),
    prisma.family.create({
      data: { name: "Patel Family", uniqueId: "FAM003" },
    }),
    prisma.family.create({
      data: { name: "Kumar Family", uniqueId: "FAM004" },
    }),
  ]);

  console.log("Created families");

  // Helper function to create complete family with members and profiles
  async function createFamilyWithMembers(
    family: { id: string; name?: string },
    memberNames: Record<string, string>,
    gotraName: string,
  ) {
    const head = await prisma.user.create({
      data: {
        name: memberNames.head,
        email: `${memberNames.head.split(" ")[0].toLowerCase()}@demo.com`,
        password: await hashPassword("123"),
        role: Role.FAMILY_HEAD,
        status: true,
      },
    });

    await prisma.profile.create({
      data: {
        userId: head.id,
        phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 999) + 1} Main Street, Mumbai`,
        profession: ["Engineer", "Doctor", "Teacher", "Business Owner"][
          Math.floor(Math.random() * 4)
        ],
        gotra: gotraName,
        location: "Mumbai, Maharashtra",
        status: true,
        bloodGroup: ["A_POS", "B_POS", "O_POS", "AB_POS"][Math.floor(Math.random() * 4)],
      },
    });

    const memberData = [
      { name: memberNames.spouse, role: Role.MEMBER },
      { name: memberNames.child1, role: Role.MEMBER },
      { name: memberNames.child2, role: Role.MEMBER },
      { name: memberNames.grandparent, role: Role.MEMBER },
    ];

    const createdMembers = [];
    for (const member of memberData) {
      const user = await prisma.user.create({
        data: {
          name: member.name,
          email: `${member.name.split(" ")[0].toLowerCase()}${Math.floor(Math.random() * 100)}@demo.com`,
          password: await hashPassword("123"),
          role: member.role,
          status: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: user.id,
          phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          address: `${Math.floor(Math.random() * 999) + 1} Main Street, Mumbai`,
          profession: ["Student", "Engineer", "Doctor", "Retired"][
            Math.floor(Math.random() * 4)
          ],
          gotra: gotraName,
          location: "Mumbai, Maharashtra",
          status: true,
          bloodGroup: ["A_POS", "B_POS", "O_POS", "AB_POS", "A_NEG", "B_NEG"][
            Math.floor(Math.random() * 6)
          ],
        },
      });

      createdMembers.push(user);
    }

    await prisma.familyMember.create({
      data: { familyId: family.id, userId: head.id, role: Role.FAMILY_HEAD },
    });

    for (const member of createdMembers) {
      await prisma.familyMember.create({
        data: { familyId: family.id, userId: member.id, role: Role.MEMBER },
      });
    }

    await prisma.family.update({
      where: { id: family.id },
      data: { headId: head.id },
    });

    const spouse = createdMembers[0];
    const child1 = createdMembers[1];
    const child2 = createdMembers[2];
    const grandparent = createdMembers[3];

    await prisma.userRelation.createMany({
      data: [
        { fromUserId: head.id, toUserId: spouse.id, type: RelationType.SPOUSE },
        { fromUserId: head.id, toUserId: child1.id, type: RelationType.PARENT },
        { fromUserId: head.id, toUserId: child2.id, type: RelationType.PARENT },
        {
          fromUserId: head.id,
          toUserId: grandparent.id,
          type: RelationType.CHILD,
        },
        {
          fromUserId: child1.id,
          toUserId: child2.id,
          type: RelationType.SIBLING,
        },
      ],
    });

    console.log(`Created ${family.name} with members`);
    return { head, members: createdMembers };
  }

  const family1 = await createFamilyWithMembers(
    families[0],
    {
      head: "Nalin Mehta",
      spouse: "Riya Mehta",
      child1: "Anya Mehta",
      child2: "Ayaan Mehta",
      grandparent: "Manish Mehta",
    },
    "Kashyap",
  );

  const family2 = await createFamilyWithMembers(
    families[1],
    {
      head: "Vikram Shah",
      spouse: "Kavya Shah",
      child1: "Ira Shah",
      child2: "Rohit Shah",
      grandparent: "Suresh Shah",
    },
    "Bharadwaj",
  );

  const family3 = await createFamilyWithMembers(
    families[2],
    {
      head: "Arjun Patel",
      spouse: "Mira Patel",
      child1: "Rey Patel",
      child2: "Nina Patel",
      grandparent: "Kiran Patel",
    },
    "Vasishtha",
  );

  const family4 = await createFamilyWithMembers(
    families[3],
    {
      head: "Rahul Kumar",
      spouse: "Sneha Kumar",
      child1: "Dev Kumar",
      child2: "Tara Kumar",
      grandparent: "Ramesh Kumar",
    },
    "Atri",
  );

  // Create events (at least 3 for visibility)
  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: "Diwali Celebration 2025",
        description:
          "Community-wide Diwali celebration with lights and sweets.",
        date: new Date("2025-11-10T18:00:00Z"),
        venue: "Community Hall A",
        createdById: family1.head.id,
        status: EventStatus.PENDING,
      },
    }),
    prisma.event.create({
      data: {
        name: "Holi Festival 2025",
        description: "Colorful Holi celebration with music and dance.",
        date: new Date("2025-03-14T10:00:00Z"),
        venue: "Community Garden",
        createdById: family2.head.id,
        status: EventStatus.APPROVED,
      },
    }),
    prisma.event.create({
      data: {
        name: "Annual Sports Day",
        description: "Community sports competition for all ages.",
        date: new Date("2025-02-20T09:00:00Z"),
        venue: "Sports Complex",
        createdById: family3.head.id,
        status: EventStatus.APPROVED,
      },
    }),
    prisma.event.create({
      data: {
        name: "Cultural Night",
        description: "Evening of music, dance, and traditional performances.",
        date: new Date("2025-04-05T19:00:00Z"),
        venue: "Community Hall B",
        createdById: family4.head.id,
        status: EventStatus.REJECTED,
      },
    }),
    prisma.event.create({
      data: {
        name: "New Year Celebration 2025",
        description: "Welcoming the new year with family and community.",
        date: new Date("2025-01-01T19:00:00Z"),
        venue: "Community Open Ground",
        createdById: family1.head.id,
        status: EventStatus.APPROVED,
      },
    }),
    prisma.event.create({
      data: {
        name: "Summer Camp 2025",
        description: "Educational and recreational camp for kids.",
        date: new Date("2025-06-15T09:00:00Z"),
        venue: "Community Center",
        createdById: family2.head.id,
        status: EventStatus.PENDING,
      },
    }),
  ]);

  console.log("Created events");

  // Create event approvals
  await Promise.all([
    prisma.eventApproval.create({
      data: {
        eventId: events[0].id,
        approverId: gotraHeads[0].id,
        approverName: gotraHeads[0].name,
        role: Role.GOTRA_HEAD,
        status: ApprovalStatus.PENDING,
      },
    }),
    prisma.eventApproval.create({
      data: {
        eventId: events[1].id,
        approverId: gotraHeads[1].id,
        approverName: gotraHeads[1].name,
        role: Role.GOTRA_HEAD,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      },
    }),
    prisma.eventApproval.create({
      data: {
        eventId: events[1].id,
        approverId: communitySubheads[0].id,
        approverName: communitySubheads[0].name,
        role: Role.COMMUNITY_SUBHEAD,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      },
    }),
    prisma.eventApproval.create({
      data: {
        eventId: events[3].id,
        approverId: gotraHeads[2].id,
        approverName: gotraHeads[2].name,
        role: Role.GOTRA_HEAD,
        status: ApprovalStatus.REJECTED,
        remarks: "Venue not available on selected date",
        reviewedAt: new Date(),
      },
    }),
  ]);

  console.log("Created event approvals");

  // Create event registrations
  await Promise.all([
    prisma.eventRegistration.create({
      data: {
        eventId: events[1].id,
        userId: family1.members[0].id,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        eventId: events[1].id,
        userId: family2.members[1].id,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        eventId: events[2].id,
        userId: family3.members[0].id,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        eventId: events[2].id,
        userId: family4.head.id,
      },
    }),
  ]);

  console.log("Created event registrations");

  // Create payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        eventId: events[1].id,
        userId: family1.members[0].id,
        amount: 500,
        status: "completed",
      },
    }),
    prisma.payment.create({
      data: {
        eventId: events[1].id,
        userId: family2.members[1].id,
        amount: 500,
        status: "completed",
      },
    }),
    prisma.payment.create({
      data: {
        eventId: events[2].id,
        userId: family3.members[0].id,
        amount: 300,
        status: "pending",
      },
    }),
    prisma.payment.create({
      data: {
        eventId: events[2].id,
        userId: family4.head.id,
        amount: 300,
        status: "failed",
      },
    }),
  ]);

  console.log("Created payments");

  // Create resources first
  const resourcesData = [
    {
      name: "Hall 1",
      type: "marriage_hall",
      description: "Main banquet hall - capacity 200",
      capacity: 200,
    },
    {
      name: "Hall 2",
      type: "marriage_hall",
      description: "Secondary banquet hall - capacity 150",
      capacity: 150,
    },
    {
      name: "Hall 3",
      type: "marriage_hall",
      description: "Community hall - capacity 100",
      capacity: 100,
    },
  ];

  const resources = [];
  for (const resourceData of resourcesData) {
    try {
      const existing = await prisma.resource.findFirst({
        where: { name: resourceData.name },
      });

      if (!existing) {
        const created = await prisma.resource.create({
          data: {
            ...resourceData,
            status: "AVAILABLE",
          },
        });
        resources.push(created);
        console.log(`✓ Created resource: ${resourceData.name}`);
      } else {
        resources.push(existing);
        console.log(`• Resource already exists: ${resourceData.name}`);
      }
    } catch (err) {
      console.error(`✗ Error creating resource ${resourceData.name}:`, err);
    }
  }

  console.log("Created resources");

  // Create resource requests (at least 6 for visibility)
  const resourceRequests = await Promise.all([
    prisma.resourceRequest.create({
      data: {
        userId: family1.head.id,
        resourceId: resources[0].id,
        startDate: new Date("2025-03-20T18:00:00Z"),
        endDate: new Date("2025-03-20T23:00:00Z"),
        status: ApprovalStatus.PENDING,
      },
    }),
    prisma.resourceRequest.create({
      data: {
        userId: family2.head.id,
        resourceId: resources[1].id,
        startDate: new Date("2025-04-10T10:00:00Z"),
        endDate: new Date("2025-04-10T18:00:00Z"),
        status: ApprovalStatus.APPROVED,
        approverId: communityHeads[0].id,
        approverName: communityHeads[0].name,
      },
    }),
    prisma.resourceRequest.create({
      data: {
        userId: family3.head.id,
        resourceId: resources[0].id,
        startDate: new Date("2025-05-15T18:00:00Z"),
        endDate: new Date("2025-05-15T22:00:00Z"),
        status: ApprovalStatus.CHANGES_REQUESTED,
      },
    }),
    prisma.resourceRequest.create({
      data: {
        userId: family4.head.id,
        resourceId: resources[2].id,
        startDate: new Date("2025-02-28T14:00:00Z"),
        endDate: new Date("2025-02-28T20:00:00Z"),
        status: ApprovalStatus.REJECTED,
        approverId: gotraHeads[0].id,
        approverName: gotraHeads[0].name,
      },
    }),
    prisma.resourceRequest.create({
      data: {
        userId: family1.members[0].id,
        resourceId: resources[1].id,
        startDate: new Date("2025-06-20T10:00:00Z"),
        endDate: new Date("2025-06-20T16:00:00Z"),
        status: ApprovalStatus.PENDING,
      },
    }),
    prisma.resourceRequest.create({
      data: {
        userId: family2.members[1].id,
        resourceId: resources[2].id,
        startDate: new Date("2025-07-10T18:00:00Z"),
        endDate: new Date("2025-07-10T23:00:00Z"),
        status: ApprovalStatus.APPROVED,
        approverId: communityHeads[1].id,
        approverName: communityHeads[1].name,
      },
    }),
  ]);

  console.log("Created resource requests");

  // Create resource request approvals
  await Promise.all([
    prisma.resourceRequestApproval.create({
      data: {
        requestId: resourceRequests[0].id,
        approverId: gotraHeads[0].id,
        approverName: gotraHeads[0].name,
        role: Role.GOTRA_HEAD,
        status: ApprovalStatus.PENDING,
      },
    }),
    prisma.resourceRequestApproval.create({
      data: {
        requestId: resourceRequests[1].id,
        approverId: gotraHeads[1].id,
        approverName: gotraHeads[1].name,
        role: Role.GOTRA_HEAD,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      },
    }),
    prisma.resourceRequestApproval.create({
      data: {
        requestId: resourceRequests[1].id,
        approverId: communityHeads[0].id,
        approverName: communityHeads[0].name,
        role: Role.COMMUNITY_HEAD,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      },
    }),
    prisma.resourceRequestApproval.create({
      data: {
        requestId: resourceRequests[2].id,
        approverId: communitySubheads[1].id,
        approverName: communitySubheads[1].name,
        role: Role.COMMUNITY_SUBHEAD,
        status: ApprovalStatus.CHANGES_REQUESTED,
        remarks: "Please provide more details about the event",
        reviewedAt: new Date(),
      },
    }),
  ]);

  console.log("Created resource request approvals");

  // Create member invites
  await Promise.all([
    prisma.memberInvite.create({
      data: {
        familyId: families[0].id,
        inviteEmail: "newmember1@demo.com",
        status: InviteStatus.PENDING,
        token: "invite-token-001",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.memberInvite.create({
      data: {
        familyId: families[1].id,
        invitedUserId: family1.members[0].id,
        status: InviteStatus.APPROVED,
        reviewedById: family2.head.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.memberInvite.create({
      data: {
        familyId: families[2].id,
        inviteEmail: "newmember2@demo.com",
        status: InviteStatus.REJECTED,
        reviewedById: family3.head.id,
        reviewedAt: new Date(),
        remarks: "Not related to our family",
      },
    }),
    prisma.memberInvite.create({
      data: {
        familyId: families[3].id,
        inviteEmail: "newmember3@demo.com",
        status: InviteStatus.PENDING,
        token: "invite-token-002",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log("Created member invites");

  // Create status update requests
  const statusUpdateRequests = await Promise.all([
    prisma.statusUpdateRequest.create({
      data: {
        targetUserId: family1.members[3].id,
        requestedById: family1.head.id,
        reason: "Passed away peacefully",
        finalStatus: "deceased",
        status: ApprovalStatus.PENDING,
      },
    }),
    prisma.statusUpdateRequest.create({
      data: {
        targetUserId: family2.members[3].id,
        requestedById: family2.head.id,
        reason: "Natural causes",
        finalStatus: "deceased",
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      },
    }),
    prisma.statusUpdateRequest.create({
      data: {
        targetUserId: family3.members[2].id,
        requestedById: family3.head.id,
        reason: "Moved abroad permanently",
        finalStatus: "inactive",
        status: ApprovalStatus.CHANGES_REQUESTED,
      },
    }),
    prisma.statusUpdateRequest.create({
      data: {
        targetUserId: family4.members[3].id,
        requestedById: family4.members[0].id,
        reason: "Incorrect information submitted",
        finalStatus: "deceased",
        status: ApprovalStatus.REJECTED,
        reviewedAt: new Date(),
      },
    }),
  ]);

  console.log("Created status update requests");

  // Create status update approvals
  await Promise.all([
    prisma.statusUpdateApproval.create({
      data: {
        requestId: statusUpdateRequests[0].id,
        approverId: gotraHeads[0].id,
        approverName: gotraHeads[0].name,
        role: Role.GOTRA_HEAD,
        status: ApprovalStatus.PENDING,
      },
    }),
    prisma.statusUpdateApproval.create({
      data: {
        requestId: statusUpdateRequests[1].id,
        approverId: gotraHeads[1].id,
        approverName: gotraHeads[1].name,
        role: Role.GOTRA_HEAD,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      },
    }),
    prisma.statusUpdateApproval.create({
      data: {
        requestId: statusUpdateRequests[1].id,
        approverId: communitySubheads[0].id,
        approverName: communitySubheads[0].name,
        role: Role.COMMUNITY_SUBHEAD,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      },
    }),
    prisma.statusUpdateApproval.create({
      data: {
        requestId: statusUpdateRequests[2].id,
        approverId: communitySubheads[1].id,
        approverName: communitySubheads[1].name,
        role: Role.COMMUNITY_SUBHEAD,
        status: ApprovalStatus.CHANGES_REQUESTED,
        remarks: "Need verification documents",
        reviewedAt: new Date(),
      },
    }),
  ]);

  console.log("Created status update approvals");

  // Create notifications (at least 10 for visibility)
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: family1.head.id,
        type: NotificationType.EVENT_APPROVAL,
        channel: NotificationChannel.IN_APP,
        message: "Your event 'Diwali Celebration 2025' is pending approval",
        eventId: events[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family2.head.id,
        type: NotificationType.EVENT_APPROVAL,
        channel: NotificationChannel.EMAIL,
        message: "Your event 'Holi Festival 2025' has been approved",
        read: true,
        eventId: events[1].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family3.head.id,
        type: NotificationType.EVENT_APPROVAL,
        channel: NotificationChannel.IN_APP,
        message: "Event 'Annual Sports Day' requires your review",
        eventId: events[2].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family1.members[0].id,
        type: NotificationType.EVENT_REGISTRATION,
        channel: NotificationChannel.IN_APP,
        message: "You have successfully registered for Holi Festival 2025",
        eventId: events[1].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family2.members[1].id,
        type: NotificationType.EVENT_REGISTRATION,
        channel: NotificationChannel.PUSH,
        message: "You have successfully registered for Annual Sports Day",
        eventId: events[2].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family1.members[0].id,
        type: NotificationType.PAYMENT_RECEIPT,
        channel: NotificationChannel.EMAIL,
        message: "Payment of Rs. 500 received for Holi Festival 2025",
        read: true,
        paymentId: payments[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family3.members[0].id,
        type: NotificationType.PAYMENT_RECEIPT,
        channel: NotificationChannel.EMAIL,
        message: "Payment of Rs. 300 received for Annual Sports Day",
        paymentId: payments[2].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family1.head.id,
        type: NotificationType.RESOURCE_REQUEST,
        channel: NotificationChannel.IN_APP,
        message: "Your resource request for Hall 1 is pending approval",
        resourceRequestId: resourceRequests[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family2.head.id,
        type: NotificationType.RESOURCE_REQUEST,
        channel: NotificationChannel.PUSH,
        message: "Your resource request for Hall 2 has been approved",
        read: true,
        resourceRequestId: resourceRequests[1].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family3.head.id,
        type: NotificationType.RESOURCE_REQUEST,
        channel: NotificationChannel.IN_APP,
        message: "Changes requested for your Hall 1 booking",
        resourceRequestId: resourceRequests[2].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: family1.head.id,
        type: NotificationType.STATUS_UPDATE_REQUEST,
        channel: NotificationChannel.IN_APP,
        message: "Your status update request is under review",
        statusUpdateRequestId: statusUpdateRequests[0].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: gotraHeads[0].id,
        type: NotificationType.GENERIC,
        channel: NotificationChannel.IN_APP,
        message: "New event approval request requires your attention",
      },
    }),
    prisma.notification.create({
      data: {
        userId: communityHeads[0].id,
        type: NotificationType.GENERIC,
        channel: NotificationChannel.IN_APP,
        message: "New resource request for Summer Camp submitted",
        read: true,
      },
    }),
  ]);

  console.log("Created notifications");

  console.log("Database seeding completed");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
