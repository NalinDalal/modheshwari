import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import ThemeInitializer from "./theme-initializer";
import NavBar from "../components/NavBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Modheshwari",
  description: "Next app to take everything online",
};

/**
 * Root layout component
 * @function RootLayout
 * @param children - React child components
 * @returns Root layout with theme and navbar
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="
          min-h-screen 
          bg-gradient-to-br 
          from-neutral-50 to-neutral-100 
          dark:from-neutral-950 dark:to-neutral-900 
          text-neutral-900 dark:text-neutral-50 
          transition-colors duration-300
          font-sans
        "
      >
        <ThemeInitializer />
        <NavBar />
        {/* Remove max-w-5xl and padding - let pages control their own layout */}
        <main>{children}</main>
      </body>
    </html>
  );
}
