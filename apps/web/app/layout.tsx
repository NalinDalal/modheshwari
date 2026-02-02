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
          bg-white
          text-gray-900
          transition-colors duration-300
          font-sans
        "
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #ec4899 100%)
          `,
          backgroundSize: "100% 100%",
          backgroundAttachment: "fixed",
        }}
      >
        <ThemeInitializer />
        <NavBar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
