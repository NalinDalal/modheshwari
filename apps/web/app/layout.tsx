import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeInitializer from "./theme-initializer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Modheshwari",
  description: "next app to take everything online",
};

/**
 * Auto-generated documentation for RootLayout
 * @function RootLayout
 * @param TODO: describe parameters
 * @returns TODO: describe return value
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
        {/* this runs client-side */}
        <ThemeInitializer />
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
