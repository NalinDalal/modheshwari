"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Handles the Admin Sign-In page functionality.
 *
 * This page allows administrators to log in to their control panel.
 * The API endpoint `/login/admin` is called with email and password.
 * On success, the JWT token is stored in localStorage and the user
 * is redirected to the admin dashboard (`/admin/dashboard`).
 *
 * @returns {React.JSX.Element} The rendered admin sign-in page.
 */
export default function AdminSigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Handles admin login form submission.
   * Calls `/login/admin` API and stores token if successful.
   */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/login/admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();
      console.log("Admin login response:", data);

      if (data?.data?.token) {
        // ✅ Save token to localStorage for authenticated requests
        localStorage.setItem("token", data.data.token);
        router.push("/admin/dashboard");
      } else {
        alert("Login failed: " + data.message);
      }
    } catch (err) {
      console.error("Admin login error:", err);
      alert("Something went wrong during login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 via-amber-50 to-rose-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 px-4">
      {/* Subtle animated background orb */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-amber-300/30 via-rose-300/30 to-purple-400/30 blur-3xl dark:from-amber-500/20 dark:via-rose-500/20 dark:to-purple-500/20" />

      <main className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-neutral-900/80 shadow-xl backdrop-blur-sm rounded-2xl p-8 border border-amber-100/40 dark:border-neutral-700/40 transition-all duration-300 hover:shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-rose-600 to-purple-600 text-white text-xl font-bold shadow-md mb-4">
              AD
            </div>
            <h1 className="text-3xl font-semibold text-amber-900 dark:text-white">
              Admin Sign In
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Log in to manage family accounts and system operations
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Email Address
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="admin@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Password
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="Your admin password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-5 py-3 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-full font-medium shadow-md hover:from-rose-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need an admin account?{" "}
              <a
                href="/admin/signup"
                className="text-amber-600 dark:text-amber-500 hover:text-rose-600 dark:hover:text-rose-500 font-medium transition-colors duration-200"
              >
                Request Access
              </a>
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-md rounded-2xl p-4 border border-amber-100/40 dark:border-neutral-700/40">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            This portal is restricted to system administrators only.
            Unauthorized access attempts are monitored.
          </p>
        </div>
      </main>
    </div>
  );
}
