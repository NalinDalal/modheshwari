"use client";

import { ArrowRight, Heart, Users, Globe, Bell, Search } from "lucide-react";
import Link from "next/link";

const ABOUT_SECTIONS = [
  {
    title: "Our Mission",
    desc: "We believe technology should empower people, not complicate their lives. Our goal is to create tools, platforms, and solutions that are simple, intuitive, and meaningful. Every project we take on is aimed at solving real problems and making a measurable impact.",
    icon: Heart,
  },
  {
    title: "What We Do",
    desc: "From open-source contributions to full-scale applications, we focus on building products that combine creativity with functionality. We tackle challenges ranging from web development, automation, and community-driven projects to complex software workflows. Each initiative is a step toward a better, smarter, and more accessible tech ecosystem.",
    icon: Users,
  },
  {
    title: "Why We Do It",
    desc: "Because we care about impact. Every bug fixed, every feature implemented, every workflow optimized is a chance to help someone, somewhere. We thrive on solving problems, learning continuously, and pushing the boundaries of what’s possible with code and design. Our 'why' is simple: technology should serve humanity, not the other way around.",
    icon: Globe,
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Animated Mandala Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/mandala.svg')] bg-center bg-no-repeat bg-contain opacity-5 scale-[2] animate-pulse-slow" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-400/20 via-transparent to-rose-400/20 blur-3xl animate-gradient-shift" />
      </div>

      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col justify-center items-center text-center px-4 py-20 sm:py-28 lg:py-32">
        <div className="relative z-10 w-full max-w-5xl">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50 dark:border-amber-700/50 backdrop-blur-sm">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Our Story & Vision
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 bg-clip-text text-transparent mb-6 leading-tight">
            About <br className="hidden sm:block" />
            <span className="inline-block animate-wave">Modheshwari</span>
          </h1>

          <p className="mx-auto text-lg sm:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-16 leading-relaxed max-w-4xl">
            A sacred community space where families connect, share, and grow
            together. Learn more about our mission, what we do, and why we do
            it.
          </p>

          {/* Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {ABOUT_SECTIONS.map((section, idx) => (
              <div
                key={section.title}
                className="group relative bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-amber-100/50 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-rose-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  {section.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {section.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              Join Us
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-amber-400/70 dark:border-amber-600/70 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-gray-800 font-semibold py-4 px-8 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
