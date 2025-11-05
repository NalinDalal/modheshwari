"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Performs  signin page operation.
 * @returns {React.JSX.Element} Description of return value
 * should we call do like add radio buttons, that user has to select, now upon radio button different apis should be called, i will give you next the apis
 */

const roles = [
  { label: "Family Head", value: "familyhead" },
  { label: "Family Member", value: "member" },
  { label: "Gotra Head", value: "gotrahead" },
  { label: "Community Head", value: "communityhead" },
  { label: "Community Subhead", value: "communitysubhead" },
];

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("familyhead");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
      const res = await fetch(`${base}/login/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (data?.data?.token) {
        localStorage.setItem("token", data.data.token);
        router.push("/me");
      } else {
        alert("Login failed: " + (data.message || "Invalid credentials"));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 via-amber-50 to-rose-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 px-4">
      <main className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-neutral-900/80 shadow-xl backdrop-blur-sm rounded-2xl p-8 border border-amber-100/40 dark:border-neutral-700/40 transition-all duration-300 hover:shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white text-xl font-bold shadow-md mb-4">
              FH
            </div>
            <h1 className="text-3xl font-semibold text-amber-900 dark:text-white">
              Sign In
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Choose your role and sign in to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {roles.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border cursor-pointer transition ${
                    role === r.value
                      ? "bg-amber-100 border-amber-400 dark:bg-amber-900/40"
                      : "border-gray-300 dark:border-neutral-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    className="hidden"
                  />
                  <span
                    className={`text-sm font-medium ${
                      role === r.value
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {r.label}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Email Address
              </label>
              <input
                className="w-full p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                placeholder="your.email@example.com"
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
                placeholder="Your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-5 py-3 bg-gradient-to-r from-amber-600 to-rose-600 text-white rounded-full font-medium shadow-md hover:from-amber-700 hover:to-rose-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don’t have an account?{" "}
              <a
                href="/signup"
                className="text-amber-600 dark:text-amber-500 hover:text-rose-600 dark:hover:text-rose-500 font-medium transition-colors duration-200"
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
