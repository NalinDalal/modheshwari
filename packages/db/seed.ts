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

  // ---------------- USERS ----------------
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "head@demo.com",
        password: "hashed",
        name: "Community Head",
        role: Role.COMMUNITY_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "family@demo.com",
        password: "hashed",
        name: "Family Head",
        role: Role.FAMILY_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "member@demo.com",
        password: "hashed",
        name: "Regular Member",
        role: Role.MEMBER,
        status: true,
      },
    }),
  ]);

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
      headId: users[1].id,
    },
  });

  await prisma.familyMember.createMany({
    data: users.map((u) => ({
      familyId: family.id,
      userId: u.id,
      role: u.role,
    })),
  });

  // ---------------- USER RELATIONS ----------------
  await prisma.userRelation.createMany({
    data: [
      {
        fromUserId: users[1].id,
        toUserId: users[2].id,
        type: RelationType.PARENT,
      },
      {
        fromUserId: users[2].id,
        toUserId: users[1].id,
        type: RelationType.CHILD,
      },
      {
        fromUserId: users[0].id,
        toUserId: users[1].id,
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
      createdById: users[0].id,
      status: EventStatus.PENDING,
    },
  });

  await prisma.eventApproval.createMany({
    data: [
      {
        eventId: event.id,
        approverId: users[1].id,
        approverName: users[1].name,
        role: users[1].role,
        status: ApprovalStatus.APPROVED,
      },
      {
        eventId: event.id,
        approverId: users[2].id,
        approverName: users[2].name,
        role: users[2].role,
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
      userId: users[2].id,
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
        approverId: users[0].id,
        approverName: users[0].name,
        role: users[0].role,
        status: ApprovalStatus.APPROVED,
      },
      {
        requestId: request.id,
        approverId: users[1].id,
        approverName: users[1].name,
        role: users[1].role,
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
      targetUserId: users[2].id,
      requestedById: users[0].id,
      reason: "Promote to FAMILY_HEAD",
      status: ApprovalStatus.PENDING,
    },
  });

  await prisma.statusUpdateApproval.createMany({
    data: [
      {
        requestId: statusReq.id,
        approverId: users[1].id,
        approverName: users[1].name,
        role: users[1].role,
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
      userId: users[2].id,
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
      initiatedBy: users[0].id,
      recipientCount: 3,
      channels: ["IN_APP", "EMAIL"],
      status: FanoutStatus.COMPLETED,
    },
  });

  console.log("Seeding complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
