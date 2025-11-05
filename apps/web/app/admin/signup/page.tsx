"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Handles the Admin Signup page functionality.
 *
 * This page allows a new administrator to register an account.
 * The API endpoint `/signup/admin` is called with admin details.
 * On success, the admin is redirected to `/admin/signin`.
 *
 * @returns {React.JSX.Element} The rendered admin signup page.
 */
export default function AdminSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });
  const [loading, setLoading] = useState(false);

  /**
   * Handles admin signup form submission.
   * Calls `/signup/admin` endpoint to register a new admin account.
   */
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/signup/admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();
      console.log("Admin signup response:", data);

      if (data.status === "success") {
        alert("Admin signup successful!");
        router.push("/admin/signin");
      } else {
        alert("Signup failed: " + data.message);
      }
    } catch (err) {
      console.error("Admin signup error:", err);
      alert("Something went wrong during signup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 via-amber-50 to-rose-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 px-4">
      {/* Subtle pulsing orb background */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-rose-300/30 via-purple-300/30 to-amber-400/30 blur-3xl dark:from-rose-500/20 dark:via-purple-500/20 dark:to-amber-500/20" />

      <main className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-neutral-900/80 shadow-xl backdrop-blur-sm rounded-2xl p-8 border border-amber-100/40 dark:border-neutral-700/40 transition-all duration-300 hover:shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-rose-600 to-purple-600 text-white text-xl font-bold shadow-md mb-4">
              AD
            </div>
            <h1 className="text-3xl font-semibold text-amber-900 dark:text-white">
              Admin Signup
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Create an administrator account for the management system
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
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

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Email Address
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="admin@example.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-5 py-3 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-full font-medium shadow-md hover:from-rose-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Admin..." : "Sign Up"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <a
                href="/admin/signin"
                className="text-amber-600 dark:text-amber-500 hover:text-rose-600 dark:hover:text-rose-500 font-medium transition-colors duration-200"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-md rounded-2xl p-4 border border-amber-100/40 dark:border-neutral-700/40">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            Admin accounts are restricted to authorized community and system
            managers. Verification may be required post-signup.
          </p>
        </div>
      </main>
    </div>
  );
}
