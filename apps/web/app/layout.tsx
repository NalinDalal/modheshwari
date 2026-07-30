import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

import "./globals.css";
import ThemeInitializer from "./themeInitializer";
import NavBar from "../components/NavBar";
import { Providers } from "./providers";

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

/**
 * Performs  root layout operation.
 * @param {{ children: React.ReactNode; }} {
 *   children,
 * } - Description of {
 *   children,
 * }
 * @returns {React.JSX.Element} Description of return value
 */
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
        <Providers>
          <ThemeInitializer />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[10001] focus:rounded-xl focus:bg-jewel-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-jewel-deep focus:outline-none focus:ring-2 focus:ring-jewel-600"
          >
            Skip to content
          </a>
          <NavBar />
          <main id="main-content" className="pt-16 relative z-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
