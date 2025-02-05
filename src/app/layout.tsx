"use client"; // This makes the component a Client Component

import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";

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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
