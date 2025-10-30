import { PrismaClient, Role, RelationType, EventStatus } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  // ----- Core Admin Roles -----
  const [communityHead, communitySubHead, gotraHead] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Aarav Mehta",
        email: "community@demo.com",
        password: "123",
        role: Role.COMMUNITY_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Diya Shah",
        email: "subhead@demo.com",
        password: "123",
        role: Role.COMMUNITY_SUBHEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Kabir Patel",
        email: "gotra@demo.com",
        password: "123",
        role: Role.GOTRA_HEAD,
        status: true,
      },
    }),
  ]);

  // ----- Families -----
  const families = await Promise.all([
    prisma.family.create({
      data: { name: "Mehta Family", uniqueId: "FAM001" },
    }),
    prisma.family.create({ data: { name: "Shah Family", uniqueId: "FAM002" } }),
    prisma.family.create({
      data: { name: "Patel Family", uniqueId: "FAM003" },
    }),
  ]);

  // Helper to build a family with head + spouse + child
  async function makeFamily(
    fam: any,
    headName: string,
    spouseName: string,
    childName: string,
  ) {
    const head = await prisma.user.create({
      data: {
        name: headName,
        email: `${headName.toLowerCase().split(" ")[0]}@demo.com`,
        password: "123",
        role: Role.FAMILY_HEAD,
        status: true,
      },
    });
    const spouse = await prisma.user.create({
      data: {
        name: spouseName,
        email: `${spouseName.toLowerCase().split(" ")[0]}@demo.com`,
        password: "123",
        role: Role.MEMBER,
        status: true,
      },
    });
    const child = await prisma.user.create({
      data: {
        name: childName,
        email: `${childName.toLowerCase().split(" ")[0]}@demo.com`,
        password: "123",
        role: Role.MEMBER,
        status: true,
      },
    });

    // link members to family
    await prisma.familyMember.createMany({
      data: [
        { familyId: fam.id, userId: head.id, role: Role.FAMILY_HEAD },
        { familyId: fam.id, userId: spouse.id, role: Role.MEMBER },
        { familyId: fam.id, userId: child.id, role: Role.MEMBER },
      ],
    });

    // mark head of family
    await prisma.family.update({
      where: { id: fam.id },
      data: { headId: head.id },
    });

    // create relation (spouse)
    await prisma.userRelation.create({
      data: {
        fromUserId: head.id,
        toUserId: spouse.id,
        type: RelationType.SPOUSE,
      },
    });

    return { head, spouse, child };
  }

  const fam1 = await makeFamily(
    families[0],
    "Nalin Mehta",
    "Riya Mehta",
    "Anya Mehta",
  );
  const fam2 = await makeFamily(
    families[1],
    "Vikram Shah",
    "Kavya Shah",
    "Ira Shah",
  );
  const fam3 = await makeFamily(
    families[2],
    "Arjun Patel",
    "Mira Patel",
    "Rey Patel",
  );

  // ----- Events -----
  const pendingEvent = await prisma.event.create({
    data: {
      name: "Diwali Celebration 2025",
      description: "Community-wide festival gathering with dinner and games.",
      date: new Date("2025-11-10T18:00:00Z"),
      venue: "Community Hall A",
      createdById: fam1.head.id,
      status: EventStatus.PENDING,
    },
  });

  const doneEvent = await prisma.event.create({
    data: {
      name: "Navratri Night 2025",
      description: "Dance and Garba event for all families.",
      date: new Date("2025-10-05T18:00:00Z"),
      venue: "Main Ground",
      createdById: fam2.head.id,
      status: EventStatus.APPROVED,
    },
  });

  // ----- Event Approvals (Pending Event) -----
  const approvers = [communityHead, communitySubHead, gotraHead];
  await Promise.all(
    approvers.map((approver) =>
      prisma.eventApproval.create({
        data: {
          eventId: pendingEvent.id,
          approverId: approver.id,
          approverName: approver.name,
          role: approver.role,
          status: "pending",
        },
      }),
    ),
  );

  // ----- Registrations -----
  await prisma.eventRegistration.createMany({
    data: [
      { eventId: doneEvent.id, userId: fam2.head.id },
      { eventId: doneEvent.id, userId: fam2.spouse.id },
      { eventId: doneEvent.id, userId: fam2.child.id },
    ],
  });

  // ----- Notifications -----
  await prisma.notification.createMany({
    data: [
      {
        userId: fam1.head.id,
        type: "event_submission",
        message: "Your event 'Diwali Celebration 2025' is pending approval.",
      },
      ...approvers.map((a) => ({
        userId: a.id,
        type: "event_review",
        message: `New event 'Diwali Celebration 2025' requires your approval.`,
      })),
      {
        userId: fam2.head.id,
        type: "event_status",
        message: "Your event 'Navratri Night 2025' has been approved.",
      },
    ],
  });

  console.log("✅  Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
