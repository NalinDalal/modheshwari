import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const _geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const _geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Modheshwari",
  description: "next app to test all apis",
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
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
