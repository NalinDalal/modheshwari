"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Users,
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";

/**
 * Signup Page Component — Handles registration flow for the Family Head role.
 *
 * This page:
 * - Collects form data for new Family Head signup (name, email, password, family name)
 * - Submits the data to the backend `/api/signup/familyhead` endpoint
 * - On success, redirects the user to `/me` for profile retrieval
 * - Uses a visually rich, gradient-based UI consistent with the Signin page
 *
 * API Endpoint Used:
 * POST /api/signup/familyhead
 * Body:
 * {
 *   name: string,
 *   email: string,
 *   password: string,
 *   familyName: string
 * }
 *
 * Expected Response:
 * {
 *   status: "success" | "error",
 *   message: string,
 *   data?: { token?: string }
 * }
 *
 * @returns {React.JSX.Element} The Family Head Signup Page
 */

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    familyName: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:3001/api"}/signup/familyhead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();
      console.log("Signup response:", data);

      if (data.status === "success") {
        alert("Signup successful!");
        router.push("/me");
      } else {
        alert("Signup failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("An error occurred during signup");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid =
    form.name && form.email && form.password && form.familyName;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-[#0a0e1a] to-black px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-60 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold shadow-lg shadow-blue-500/25 mb-4"
            >
              <Users className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              Become a Family Head
            </h1>
            <p className="text-sm text-gray-400">
              Create your family account and start managing
            </p>
          </div>

          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="Create a secure password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Family Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Family Name
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="Your family name"
                  type="text"
                  value={form.familyName}
                  onChange={(e) =>
                    setForm({ ...form, familyName: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isFormValid) {
                      void handleSubmit();
                    }
                  }}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="group relative w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative flex items-center justify-center gap-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </motion.div>
              ) : (
                <span className="relative flex items-center justify-center gap-2">
                  Create Family Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <a
                href="/signin"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              As a Family Head, you&apos;ll be responsible for managing your
              family members, handling invitations, and maintaining family
              records securely.
            </p>
          </div>
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 space-y-2"
        >
          {[
            "Full control over family member management",
            "Secure access with role-based permissions",
            "Track family events and medical records",
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-gray-500"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
              <span>{feature}</span>
            </div>
          ))}
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            🔒 Secure signup powered by Modheshwari
          </p>
        </motion.div>
      </motion.main>
    </div>
  );
}
