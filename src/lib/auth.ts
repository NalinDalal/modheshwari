// src/lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientText: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          surname: profile.family_name,
          email: profile.email,
          avatar: profile.picture,
          gender: Gender.OTHER, // Default value
          status: UserStatus.ACTIVE,
          verified: false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Only allow users with verified emails
      return !!user.email;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            family: true,
            gotra: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.familyId = dbUser.familyId;
          token.gotraId = dbUser.gotraId;
          token.role = determineUserRole(dbUser);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.familyId = token.familyId as number | null;
        session.user.gotraId = token.gotraId as number | null;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
};
