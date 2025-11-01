import { config } from "dotenv";
import { join } from "path";

// ✅ Load root .env (2 levels up from /packages/db)
config({ path: join(process.cwd(), "../../.env") });

import { PrismaClient, Role, RelationType, EventStatus } from "@prisma/client";
import { hashPassword } from "../utils/hash.ts";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL not found in environment variables!");
  }

  // ----- Core Admin Roles -----
  const [communityHead, communitySubHead, gotraHead] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Aarav Mehta",
        email: "community@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_HEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Diya Shah",
        email: "subhead@demo.com",
        password: await hashPassword("123"),
        role: Role.COMMUNITY_SUBHEAD,
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Kabir Patel",
        email: "gotra@demo.com",
        password: await hashPassword("123"),
        role: Role.GOTRA_HEAD,
        status: true,
      },
    }),
  ]);

  console.log("✅ Created core admin users");

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

  console.log("✅ Created base families");

  // ----- Helper to build family with members -----
  async function makeFamily(fam: any, names: Record<string, string>) {
    const head = await prisma.user.create({
      data: {
        name: names.head,
        email: `${names.head.split(" ")[0].toLowerCase()}@demo.com`,
        password: await hashPassword("123"),
        role: Role.FAMILY_HEAD,
        status: true,
      },
    });

    await prisma.user.createMany({
      data: [
        {
          name: names.spouse,
          email: `${names.spouse.split(" ")[0].toLowerCase()}@demo.com`,
          password: await hashPassword("123"),
          role: Role.MEMBER,
          status: true,
        },
        {
          name: names.child1,
          email: `${names.child1.split(" ")[0].toLowerCase()}@demo.com`,
          password: await hashPassword("123"),
          role: Role.MEMBER,
          status: true,
        },
        {
          name: names.child2,
          email: `${names.child2.split(" ")[0].toLowerCase()}@demo.com`,
          password: await hashPassword("123"),
          role: Role.MEMBER,
          status: true,
        },
        {
          name: names.grandparent,
          email: `${names.grandparent.split(" ")[0].toLowerCase()}@demo.com`,
          password: await hashPassword("123"),
          role: Role.MEMBER,
          status: true,
        },
      ],
    });

    // Fetch members created
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            `${names.spouse.split(" ")[0].toLowerCase()}@demo.com`,
            `${names.child1.split(" ")[0].toLowerCase()}@demo.com`,
            `${names.child2.split(" ")[0].toLowerCase()}@demo.com`,
            `${names.grandparent.split(" ")[0].toLowerCase()}@demo.com`,
          ],
        },
      },
    });

    // Link to family
    await prisma.familyMember.createMany({
      data: [
        { familyId: fam.id, userId: head.id, role: Role.FAMILY_HEAD },
        ...users.map((u) => ({
          familyId: fam.id,
          userId: u.id,
          role: Role.MEMBER,
        })),
      ],
    });

    // Update head
    await prisma.family.update({
      where: { id: fam.id },
      data: { headId: head.id },
    });

    // Relations
    const spouse = users.find((u) => u.name === names.spouse);
    const grandparent = users.find((u) => u.name === names.grandparent);

    if (spouse && grandparent) {
      await prisma.userRelation.createMany({
        data: [
          {
            fromUserId: head.id,
            toUserId: spouse.id,
            type: RelationType.SPOUSE,
          },
          {
            fromUserId: head.id,
            toUserId: grandparent.id,
            type: RelationType.CHILD,
          },
        ],
      });
    }

    console.log(`👨‍👩‍👧‍👦 Created ${fam.name}`);
    return { head, users };
  }

  await makeFamily(families[0], {
    head: "Nalin Mehta",
    spouse: "Riya Mehta",
    child1: "Anya Mehta",
    child2: "Ayaan Mehta",
    grandparent: "Manish Mehta",
  });

  await makeFamily(families[1], {
    head: "Vikram Shah",
    spouse: "Kavya Shah",
    child1: "Ira Shah",
    child2: "Rohit Shah",
    grandparent: "Suresh Shah",
  });

  await makeFamily(families[2], {
    head: "Arjun Patel",
    spouse: "Mira Patel",
    child1: "Rey Patel",
    child2: "Nina Patel",
    grandparent: "Kiran Patel",
  });

  // Example event
  const head = await prisma.user.findFirst({
    where: { role: Role.FAMILY_HEAD },
  });

  if (head) {
    await prisma.event.create({
      data: {
        name: "Diwali Celebration 2025",
        description: "Community-wide celebration.",
        date: new Date("2025-11-10T18:00:00Z"),
        venue: "Community Hall A",
        createdById: head.id,
        status: EventStatus.PENDING,
      },
    });
    console.log("🎉 Created example event");
  }

  console.log("✅ Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
