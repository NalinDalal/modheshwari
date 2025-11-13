"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/button";

const roles = [
  { label: "Family Head", value: "familyhead" },
  { label: "Family Member", value: "member" },
  { label: "Gotra Head", value: "gotrahead" },
  { label: "Community Head", value: "communityhead" },
  { label: "Community Subhead", value: "communitysubhead" },
];

/**
 * Performs  signin page operation.
 * @returns {React.JSX.Element} Description of return value
 */
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300 px-4">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-neutral-900 shadow-xl rounded-lg p-8 border border-neutral-200 dark:border-neutral-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-2xl font-semibold shadow-md mb-4">
              M
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Sign In
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Choose your role and sign in to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* role selector */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {roles.map((r) => (
                <label
                  key={r.value}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition-all duration-200 ${
                    role === r.value
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
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
                  {r.label}
                </label>
              ))}
            </div>

            {/* email */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Email Address
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* password */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                Password
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* submit */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full mt-4 relative overflow-hidden"
            >
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center gap-2"
                >
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"
                    ></path>
                  </svg>
                  <span>Signing In...</span>
                </motion.div>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don’t have an account?{" "}
              <a
                href="/signup"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
