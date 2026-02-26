import "dotenv/config";
import {
  PrismaClient,
  Role,
  bloodGroup,
  RelationType,
  EventStatus,
  ApprovalStatus,
  ResourceStatus,
  NotificationChannel,
  NotificationType,
  DeliveryStrategy,
  DeliveryStatus,
  NotificationPriority,
  FanoutStatus,
  InviteStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(" Seeding database...");

  // Clean in correct order (respecting relations)
  await prisma.notificationDelivery.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.fanoutAudit.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.statusUpdateApproval.deleteMany();
  await prisma.statusUpdateRequest.deleteMany();
  await prisma.memberInvite.deleteMany();
  await prisma.userRelation.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.family.deleteMany();
  await prisma.resourceRequestApproval.deleteMany();
  await prisma.resourceRequest.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.eventApproval.deleteMany();
  await prisma.event.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const demoPassword = "demo123";
  const demoPasswordHash = await bcrypt.hash(demoPassword, 10);

  // ---------------- USERS ----------------
  const communityHead = await prisma.user.create({
    data: {
      email: "head@demo.com",
      password: demoPasswordHash,
      name: "Community Head",
      role: Role.COMMUNITY_HEAD,
      status: true,
    },
  });

  const communitySubhead = await prisma.user.create({
    data: {
      email: "subhead@demo.com",
      password: demoPasswordHash,
      name: "Community Subhead",
      role: Role.COMMUNITY_SUBHEAD,
      status: true,
    },
  });

  const gotraHead = await prisma.user.create({
    data: {
      email: "gotra@demo.com",
      password: demoPasswordHash,
      name: "Gotra Head",
      role: Role.GOTRA_HEAD,
      status: true,
    },
  });

  const familyHead = await prisma.user.create({
    data: {
      email: "family@demo.com",
      password: demoPasswordHash,
      name: "Family Head",
      role: Role.FAMILY_HEAD,
      status: true,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: "member@demo.com",
      password: demoPasswordHash,
      name: "Regular Member",
      role: Role.MEMBER,
      status: true,
    },
  });

  const users = [
    communityHead,
    communitySubhead,
    gotraHead,
    familyHead,
    member,
  ];

  // ---------------- PROFILES ----------------
  for (const user of users) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        phone: "9999999999",
        address: "Demo Street",
        profession: "Engineer",
        gotra: "Kashyap",
        location: "Bhopal",
        status: true,
        bloodGroup: bloodGroup.O_POS,
      },
    });
  }

  // ---------------- MEDICAL RECORDS ----------------
  for (const user of users) {
    await prisma.medicalRecord.create({
      data: {
        userId: user.id,
        bloodType: "O+",
        conditions: "None",
        medications: "None",
        notes: "Healthy",
      },
    });
  }

  // ---------------- FAMILY ----------------
  const family = await prisma.family.create({
    data: {
      name: "Dalal Family",
      uniqueId: "FAM001",
      headId: familyHead.id,
    },
  });

  await prisma.familyMember.createMany({
    data: [
      {
        familyId: family.id,
        userId: familyHead.id,
        role: Role.FAMILY_HEAD,
      },
      {
        familyId: family.id,
        userId: member.id,
        role: Role.MEMBER,
      },
    ],
  });

  // ---------------- USER RELATIONS ----------------
  await prisma.userRelation.createMany({
    data: [
      {
        fromUserId: familyHead.id,
        toUserId: member.id,
        type: RelationType.PARENT,
      },
      {
        fromUserId: member.id,
        toUserId: familyHead.id,
        type: RelationType.CHILD,
      },
      {
        fromUserId: communityHead.id,
        toUserId: familyHead.id,
        type: RelationType.SIBLING,
      },
    ],
  });

  // ---------------- EVENT ----------------
  const event = await prisma.event.create({
    data: {
      name: "Annual Gathering",
      description: "Community meetup",
      date: new Date(),
      venue: "Community Hall",
      createdById: communityHead.id,
      status: EventStatus.PENDING,
    },
  });

  await prisma.eventApproval.createMany({
    data: [
      {
        eventId: event.id,
        approverId: familyHead.id,
        approverName: familyHead.name,
        role: familyHead.role,
        status: ApprovalStatus.APPROVED,
      },
      {
        eventId: event.id,
        approverId: gotraHead.id,
        approverName: gotraHead.name,
        role: gotraHead.role,
        status: ApprovalStatus.PENDING,
      },
    ],
  });

  await prisma.eventRegistration.createMany({
    data: users.map((u) => ({
      eventId: event.id,
      userId: u.id,
    })),
  });

  // ---------------- PAYMENT ----------------
  for (const user of users) {
    await prisma.payment.create({
      data: {
        eventId: event.id,
        userId: user.id,
        amount: 500,
        status: "SUCCESS",
      },
    });
  }

  // ---------------- RESOURCE ----------------
  const resource = await prisma.resource.create({
    data: {
      name: "Projector",
      type: "Electronics",
      description: "HD Projector",
      capacity: 1,
      status: ResourceStatus.AVAILABLE,
    },
  });

  const request = await prisma.resourceRequest.create({
    data: {
      userId: member.id,
      status: ApprovalStatus.PENDING,
      resourceId: resource.id,
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  await prisma.resourceRequestApproval.createMany({
    data: [
      {
        requestId: request.id,
        approverId: communityHead.id,
        approverName: communityHead.name,
        role: communityHead.role,
        status: ApprovalStatus.APPROVED,
      },
      {
        requestId: request.id,
        approverId: familyHead.id,
        approverName: familyHead.name,
        role: familyHead.role,
        status: ApprovalStatus.PENDING,
      },
    ],
  });

  // ---------------- CONVERSATION ----------------
  const conversation = await prisma.conversation.create({
    data: {
      participants: users.map((u) => u.id),
      lastMessage: "Welcome!",
      lastMessageAt: new Date(),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: users[0].id,
        senderName: users[0].name,
        content: "Welcome everyone!",
      },
      {
        conversationId: conversation.id,
        senderId: users[1].id,
        senderName: users[1].name,
        content: "Thanks!",
      },
      {
        conversationId: conversation.id,
        senderId: users[2].id,
        senderName: users[2].name,
        content: "Glad to be here!",
      },
    ],
  });

  // ---------------- STATUS UPDATE REQUEST ----------------
  const statusReq = await prisma.statusUpdateRequest.create({
    data: {
      targetUserId: member.id,
      requestedById: communityHead.id,
      reason: "Promote to FAMILY_HEAD",
      status: ApprovalStatus.PENDING,
    },
  });

  await prisma.statusUpdateApproval.createMany({
    data: [
      {
        requestId: statusReq.id,
        approverId: familyHead.id,
        approverName: familyHead.name,
        role: familyHead.role,
        status: ApprovalStatus.APPROVED,
      },
    ],
  });

  // ---------------- MEMBER INVITE ----------------
  await prisma.memberInvite.create({
    data: {
      familyId: family.id,
      inviteEmail: "newmember@demo.com",
      status: InviteStatus.PENDING,
      token: "invite-token",
    },
  });

  // ---------------- NOTIFICATIONS ----------------
  const notification = await prisma.notification.create({
    data: {
      userId: member.id,
      message: "Event Approved!",
      type: NotificationType.EVENT_APPROVAL,
      channel: NotificationChannel.IN_APP,
      deliveryStrategy: DeliveryStrategy.BROADCAST,
      priority: NotificationPriority.HIGH,
    },
  });

  await prisma.notificationDelivery.createMany({
    data: [
      {
        notificationId: notification.id,
        channel: NotificationChannel.IN_APP,
        status: DeliveryStatus.DELIVERED,
      },
      {
        notificationId: notification.id,
        channel: NotificationChannel.EMAIL,
        status: DeliveryStatus.SENT,
      },
    ],
  });

  await prisma.fanoutAudit.create({
    data: {
      fanoutId: "fanout-001",
      initiatedBy: communityHead.id,
      recipientCount: users.length,
      channels: ["IN_APP", "EMAIL"],
      status: FanoutStatus.COMPLETED,
    },
  });

  console.log("Seeding complete");
  console.log("Demo login credentials:");
  console.log("- community head: head@demo.com / demo123");
  console.log("- community subhead: subhead@demo.com / demo123");
  console.log("- gotra head: gotra@demo.com / demo123");
  console.log("- family head: family@demo.com / demo123");
  console.log("- member: member@demo.com / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
