"use client";

import { Button } from "@repo/ui/button";
import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    title: "Family Hub",
    desc: "Manage families, members and statuses from one place.",
    href: "/family",
    icon: "/window.svg",
  },
  {
    title: "Resources",
    desc: "Request, share and discover community resources.",
    href: "/resources",
    icon: "/globe.svg",
  },
  {
    title: "Notifications",
    desc: "Keep up with approvals and important updates.",
    href: "/notifications",
    icon: "/vercel.svg",
  },
  {
    title: "Search & Discovery",
    desc: "Find people, resources, and posts across the network.",
    href: "/search",
    icon: "/search.svg",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-amber-100 via-orange-50 to-rose-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Mandala / Glow Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/mandala.svg')] bg-center bg-no-repeat bg-contain opacity-[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-300/20 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Hero Section */}
      <main className="flex flex-col justify-center items-center flex-grow text-center px-4 py-16 sm:py-24">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 bg-clip-text text-transparent mb-6 drop-shadow-sm">
          Welcome to Modheshwari
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 leading-relaxed">
          A sacred community space for families, resources and togetherness —
          rooted in warmth, privacy and care.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Get started
          </Link>
          <Link
            href="/signin"
            className="border-2 border-amber-300 dark:border-gray-600 text-amber-800 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-800 font-semibold py-3 px-8 rounded-full transition-all duration-300"
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section
        className="relative z-10 py-16 px-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-amber-200/40 dark:border-gray-700/40"
        aria-label="Features"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="bg-white/90 dark:bg-gray-800/80 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-amber-100 dark:border-gray-700"
            >
              <Link href={f.href} className="block h-full">
                <div className="flex items-center mb-4">
                  {f.icon && (
                    <Image
                      src={f.icon}
                      alt=""
                      width={32}
                      height={32}
                      className="mr-3"
                      aria-hidden
                    />
                  )}
                  <h3 className="text-xl font-semibold text-amber-900 dark:text-white">
                    {f.title}
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {f.desc}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-100/70 via-orange-100/70 to-rose-100/70 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 border-t border-amber-200/40 dark:border-gray-700 mt-auto py-6 text-center">
        <small className="block text-amber-900 dark:text-gray-400 mb-2">
          Made with ❤️ — © {new Date().getFullYear()} Modheshwari
        </small>
        <div className="flex justify-center gap-6 text-sm">
          <Link
            href="/privacy"
            className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-gray-200 transition"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-gray-200 transition"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-gray-200 transition"
          >
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
