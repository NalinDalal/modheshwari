import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Prisma } from "@/lib/prisma"; // Ensure you're using a singleton Prisma instance
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: PrismaAdapter(Prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Find user in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("No user found or invalid credentials");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        return user; // Returning user logs them in
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub; // Ensure the session has the user ID
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // Store the user ID in the JWT token
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin", // Custom sign-in page
  },
  session: {
    strategy: "jwt", // Use JWT instead of database sessions for scalability
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
