// src/pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth";

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Phone Login",
      credentials: {
        phone: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { phone: credentials?.phone },
        });

        if (!user || !credentials?.otp || user.otp !== credentials.otp) {
          throw new Error("Invalid OTP");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { otp: null }, // Clear OTP after successful login
        });

        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.familyId = user.familyId;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              role: "USER", // Default role
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
