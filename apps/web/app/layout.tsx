import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeInitializer from "./theme-initializer";
import NavBar from "../components/NavBar";

const geistSans = localFont({
  src: "./fonts/geistvf.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/geistmonovf.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Modheshwari",
  description: "Next app to take everything online",
};

/**
 * auto-generated documentation for rootlayout
 * @function rootlayout
 * @param todo: describe parameters
 * @returns todo: describe return value
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className="
          min-h-screen 
          bg-gradient-to-br 
          from-neutral-50 to-neutral-100 
          dark:from-neutral-950 dark:to-neutral-900 
          text-neutral-900 dark:text-neutral-50 
          transition-colors duration-300
        "
      >
        <ThemeInitializer />

        {/* Global Navbar */}
        <NavBar />

        <main className="max-w-5xl mx-auto px-6 py-8 pt-20">{children}</main>
      </body>
    </html>
  );
}
