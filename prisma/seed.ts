import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed Gotras
  const gotra1 = await prisma.gotra.create({
    data: {
      name: "Sharma",
      description: "A prominent Brahmin Gotra",
    },
  });

  const gotra2 = await prisma.gotra.create({
    data: {
      name: "Verma",
      description: "A respected Kayastha Gotra",
    },
  });

  // Seed Users
  const user1 = await prisma.user.create({
    data: {
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      password: "hashedpassword1", // Replace with actual hashed password
      gender: "MALE",
      bloodGroup: "O_POSITIVE",
      dateOfBirth: new Date("1990-01-01"),
      phone: "1234567890",
      address: "123 Main St",
      city: "CityName",
      state: "StateName",
      pincode: 123456,
      avatar: "http://example.com/avatar.jpg",
      status: "ACTIVE",
      verified: true,
      isAlive: true,
      gotraId: gotra1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane",
      surname: "Smith",
      email: "jane.smith@example.com",
      password: "hashedpassword2", // Replace with actual hashed password
      gender: "FEMALE",
      bloodGroup: "A_NEGATIVE",
      dateOfBirth: new Date("1995-05-15"),
      phone: "9876543210",
      address: "456 Another St",
      city: "AnotherCity",
      state: "AnotherState",
      pincode: 654321,
      avatar: "http://example.com/avatar2.jpg",
      status: "ACTIVE",
      verified: true,
      isAlive: true,
      gotraId: gotra2.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create Families
  const family1 = await prisma.family.create({
    data: {
      name: "Doe Family",
      headId: user1.id,
      gotraId: gotra1.id,
      address: "123 Main St, CityName",
    },
  });

  const family2 = await prisma.family.create({
    data: {
      name: "Smith Family",
      headId: user2.id,
      gotraId: gotra2.id,
      address: "456 Another St, AnotherCity",
    },
  });

  // Seed Marriage Records
  const marriage = await prisma.marriage.create({
    data: {
      spouse1Id: user1.id,
      spouse2Id: user2.id,
      marriageDate: new Date("2020-12-25"),
      marriagePlace: "City Hall",
    },
  });

  // Seed Events
  const event1 = await prisma.event.create({
    data: {
      name: "Community Meetup",
      description: "A fun meetup for the community",
      startDate: new Date("2025-05-10"),
      endDate: new Date("2025-05-10"),
      venue: "Community Center",
      createdBy: user1.id,
    },
  });

  // Add users to event attendees
  await prisma.eventAttendee.create({
    data: {
      eventId: event1.id,
      userId: user1.id,
      status: "ATTENDING",
    },
  });

  await prisma.eventAttendee.create({
    data: {
      eventId: event1.id,
      userId: user2.id,
      status: "ATTENDING",
    },
  });

  // Seed Education
  const education1 = await prisma.education.create({
    data: {
      userId: user1.id,
      institution: "University A",
      degree: "BSc Computer Science",
      fieldOfStudy: "Computer Science",
      startYear: 2010,
      endYear: 2014,
    },
  });

  const education2 = await prisma.education.create({
    data: {
      userId: user2.id,
      institution: "University B",
      degree: "BA Economics",
      fieldOfStudy: "Economics",
      startYear: 2012,
      endYear: 2016,
    },
  });

  // Seed Occupation
  const occupation1 = await prisma.occupation.create({
    data: {
      userId: user1.id,
      company: "TechCorp",
      title: "Software Engineer",
      startDate: new Date("2015-01-01"),
      current: true,
    },
  });

  const occupation2 = await prisma.occupation.create({
    data: {
      userId: user2.id,
      company: "FinCorp",
      title: "Financial Analyst",
      startDate: new Date("2016-01-01"),
      current: true,
    },
  });

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

