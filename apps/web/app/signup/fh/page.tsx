"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";

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

  // --- Local state for form fields ---
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    familyName: "",
  });

  // --- Loading state for async submission ---
  const [loading, setLoading] = useState(false);

  /**
   * Handles the signup submission.
   * 1. Prevents default form reload
   * 2. Sends POST request to /api/signup/familyhead
   * 3. Handles success/failure and redirects appropriately
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Construct API base URL — fallback to localhost if missing
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

      // ✅ If signup succeeds, redirect user to /me
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 via-amber-50 to-rose-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 px-4">
      {/* --- Background visual gradient orb --- */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-amber-300/30 via-rose-300/30 to-purple-400/30 blur-3xl dark:from-amber-500/20 dark:via-rose-500/20 dark:to-purple-500/20" />

      <main className="max-w-md w-full">
        {/* --- Main signup card container --- */}
        <div className="bg-white/80 dark:bg-neutral-900/80 shadow-xl backdrop-blur-sm rounded-2xl p-8 border border-amber-100/40 dark:border-neutral-700/40 transition-all duration-300 hover:shadow-2xl">
          {/* --- Header section (icon + title) --- */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white text-xl font-bold shadow-md mb-4">
              FH
            </div>
            <h1 className="text-3xl font-semibold text-amber-900 dark:text-white">
              Family Head Signup
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Create your family account
            </p>
          </div>

          {/* --- Signup Form --- */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Full Name
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Email Address
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="your.email@example.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Password
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="Create a secure password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* Family Name Field */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Family Name
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="Your family name"
                value={form.familyName}
                onChange={(e) =>
                  setForm({ ...form, familyName: e.target.value })
                }
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full mt-6"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          {/* --- Footer section --- */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <a
                href="/signin"
                className="text-amber-600 dark:text-amber-500 hover:text-rose-600 dark:hover:text-rose-500 font-medium transition-colors duration-200"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>

        {/* --- Informational card below form --- */}
        <div className="mt-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-md rounded-2xl p-4 border border-amber-100/40 dark:border-neutral-700/40">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            By signing up, you agree to create a family account and become the
            family head responsible for managing your members.
          </p>
        </div>
      </main>
    </div>
  );
}
