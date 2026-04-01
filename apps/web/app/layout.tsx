import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

import "./globals.css";
import ThemeInitializer from "./themeInitializer";
import NavBar from "../components/NavBar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Modheshwari",
  description: "Next app to take everything online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body
        className="
          min-h-screen 
          bg-jewel-50
          text-stone-900
          font-sans
          relative
        "
      >
        <ThemeInitializer />
        <NavBar />
        <main className="pt-16 relative z-10">{children}</main>
      </body>
    </html>
  );
}
