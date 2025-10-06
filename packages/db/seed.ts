import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: 'testuser@example.com',
      password: 'hashedpassword', // Use a real hash in production
      name: 'Test User',
      role: Role.MEMBER,
      status: true,
      profile: {
        create: {
          phone: '1234567890',
          address: '123 Main St',
          profession: 'Engineer',
          gotra: 'Bharadwaj',
          location: 'Cityville',
          status: 'alive',
        },
      },
    },
    include: { profile: true },
  });

  // Create a sample family and add the user as head
  const family = await prisma.family.create({
    data: {
      name: 'Test Family',
      uniqueId: 'FAM001',
      head: { connect: { id: user.id } },
      members: {
        create: {
          user: { connect: { id: user.id } },
          role: Role.FAMILY_HEAD,
        },
      },
    },
    include: { members: true, head: true },
  });

  console.log({ user, family });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
