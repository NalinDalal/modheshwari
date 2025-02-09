"use client"; // This makes the component a Client Component

import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
const inter = Inter({ subsets: ["latin"] });

const metadata = {
  title: "Community Management App",
  description: "Connect, Engage, and Thrive Together",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ClerkProvider>
            <nav className="p-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 rounded-lg shadow-lg">
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </nav>
            {children}
          </ClerkProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
