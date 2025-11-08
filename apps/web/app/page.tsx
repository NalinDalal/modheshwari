"use client";

import { Button } from "@repo/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Users, Globe, Bell, Search } from "lucide-react";

const FEATURES = [
  {
    title: "Family Hub",
    desc: "Manage families, members and statuses from one place.",
    href: "/family",
    icon: Users,
  },
  {
    title: "Resources",
    desc: "Request, share and discover community resources.",
    href: "/resources",
    icon: Globe,
  },
  {
    title: "Notifications",
    desc: "Keep up with approvals and important updates.",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Search & Discovery",
    desc: "Find people, resources, and posts across the network.",
    href: "/search",
    icon: Search,
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Animated Mandala Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/mandala.svg')] bg-center bg-no-repeat bg-contain opacity-5 scale-[2] animate-pulse-slow" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-400/20 via-transparent to-rose-400/20 blur-3xl animate-gradient-shift" />
      </div>

      {/* Navigation Bar – full width */}
      <nav className="relative z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-amber-200/50 dark:border-gray-700/50">
        <div className="px-4 sm:px-8 lg:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-rose-600 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Modheshwari
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/about"
              className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
            >
              About
            </Link>
            <Link
              href="/features"
              className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
            >
              Features
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
            >
              Contact
            </Link>
          </div>

          <Link
            href="/signin"
            className="text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium transition"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section – full width */}
      <main className="relative flex-1 flex flex-col justify-center items-center text-center px-4 py-20 sm:py-28 lg:py-32">
        {/* Floating decorative blobs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-rose-300/20 rounded-full blur-3xl animate-float-delayed" />

        <div className="relative z-10 w-full max-w-5xl">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50 dark:border-amber-700/50 backdrop-blur-sm">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              A sacred space for community and care
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 bg-clip-text text-transparent mb-6 leading-tight">
            Welcome to <br className="hidden sm:block" />
            <span className="inline-block animate-wave">Modheshwari</span>
          </h1>

          <p className="mx-auto text-lg sm:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-10 leading-relaxed max-w-4xl">
            A sacred community space for families, resources, and togetherness —
            rooted in warmth, privacy, and care. Connect deeply, share
            generously, and grow together in a trusted environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border-2 border-amber-400/70 dark:border-amber-600/70 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-gray-800 font-semibold py-4 px-8 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              Watch Demo
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>2,500+ families connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span>24/7 community support</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section – full width */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent via-white/40 to-transparent dark:via-gray-900/40 backdrop-blur-sm">
        <div className="w-full">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Built with love for families who value connection, privacy, and
              meaningful support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-screen-2xl mx-auto">
            {FEATURES.map((f, idx) => (
              <article
                key={f.title}
                className={`group relative bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-amber-100/50 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <Link href={f.href} className="block h-full relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-rose-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                      <f.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {f.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section – full width */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-rose-600/10 dark:from-amber-900/20 dark:to-rose-900/20" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent mb-6">
            Join Our Sacred Community
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Start your journey today. Create your family space, connect with
            others, and experience the warmth of Modheshwari.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-amber-500/50"
          >
            <Heart className="w-6 h-6" />
            Start Free Today
          </Link>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            No credit card required • 30-day free access to all features
          </p>
        </div>
      </section>

      {/* Footer – full width */}
      <footer className="relative bg-gradient-to-t from-amber-100/50 via-orange-50/50 to-rose-50/50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 border-t border-amber-200/40 dark:border-gray-800 py-12">
        <div className="px-4 sm:px-8 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-rose-600 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Modheshwari
            </span>
          </div>
          <p className="text-sm text-amber-900 dark:text-gray-400 mb-6">
            Made with <span className="inline-block animate-pulse">❤️</span> —
            © {new Date().getFullYear()} Modheshwari. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
