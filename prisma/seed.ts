//import { PrismaClient } from "@prisma/client";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Seed Gotras
  const gotra1 = await prisma.gotra.create({
    data: {
      name: "Maithiya",
      description: "A prominent Gotra",
    },
  });

  const gotra2 = await prisma.gotra.create({
    data: {
      name: "Bagaiyaa",
      description: "A respected Gotra",
    },
  });

  // Seed Users
  const user1 = await prisma.user.create({
    data: {
      name: "Nalin",
      surname: "Dalal",
      email: "nalindalal2004@gmail.com",
      gender: "MALE",
      bloodGroup: "O_POSITIVE",
      dateOfBirth: new Date("2004-08-24"),
      phone: "7440620675",
      address: "03, WardNo. 28",
      city: "Burhanpur",
      state: "Madhya Pradesh",
      pincode: 123456,
      avatar: "http://example.com/avatar.jpg",
      status: "ACTIVE",
      verified: true,
      isAlive: true,
      gotraId: gotra1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "HEAD_OF_COMMUNITY",
      sub: "google-sub-nalin",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Ajay",
      surname: "Shah",
      email: "ajayshah@gmail.com",
      gender: "MALE",
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
      role: "SUBCOMMUNITY_HEAD",
      sub: "google-sub-ajay",
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
