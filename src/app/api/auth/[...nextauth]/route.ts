import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
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
          data: { otp: null }, // clear OTP
        });

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On sign-in with Google
      if (account?.provider === "google" && profile?.email) {
        const sub = account.providerAccountId;
        const email = profile.email;

        let user = await prisma.user.findFirst({
          where: { email, sub },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.name ?? "Unnamed",
              sub,
              role: "USER", // default role
              avatar: profile.picture ?? undefined,
            },
          });
        }

        token.sub = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
        });

        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.familyId = user.familyId;
          session.user.sub = user.sub;
        }
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const sub = account.providerAccountId;
        const email = user.email!;

        const existingUser = await prisma.user.findFirst({
          where: { email, sub },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email,
              name: user.name ?? profile?.name ?? "Unnamed",
              sub,
              role: "USER",
              avatar: profile?.picture ?? null,
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
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
