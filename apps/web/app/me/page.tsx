"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderFour } from "@repo/ui/loading";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: boolean;
  families?: {
    family: {
      id: string;
      name: string;
    };
  }[];
}

/**
 * Performs  me page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    async function fetchMe() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await res.json();
        if (data.status === "success") {
          setUser(data.data);
        } else {
          alert("Auth expired, please log in again");
          localStorage.removeItem("token");
          router.push("/signin");
        }
      } catch (err) {
        console.error("Failed to fetch /me", err);
        alert("Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [router]);

  if (loading)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-50 via-amber-50 to-rose-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900">
        <div className="relative flex flex-col items-center">
          <div className="mb-6 scale-110">
            <LoaderFour text="Loading your profile..." />
          </div>
          <div className="absolute -z-10 h-64 w-64 animate-pulse rounded-full bg-gradient-to-r from-amber-300/30 via-rose-300/30 to-purple-400/30 blur-3xl dark:from-amber-500/20 dark:via-rose-500/20 dark:to-purple-500/20" />
        </div>
      </div>
    );

  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const familyName = user.families?.[0]?.family?.name || "—";

  return (
    <main className="max-w-3xl mx-auto px-4 pb-12">
      {/* Profile Card */}
      <section className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/40 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center transition-shadow hover:shadow-lg">
        {/* Avatar */}
        <div className="flex-shrink-0 flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-semibold shadow">
          {initials || "U"}
        </div>

        {/* Info */}
        <div className="flex-1 w-full">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {user.name}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {user.email}
          </p>

          {/* Meta */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Role", value: user.role },
              { label: "Status", value: user.status ? "Active" : "Inactive" },
              { label: "Family", value: familyName },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/40 dark:border-neutral-700/40"
              >
                <div className="text-xs text-neutral-400">{item.label}</div>
                <div className="font-medium text-neutral-800 dark:text-neutral-200">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/me/edit")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              Edit profile
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/signin");
              }}
              className="px-5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mt-6">
        <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/40 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
            About
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            This page shows your personal and family-related information. You
            can update these details anytime from the edit profile section.
          </p>
        </div>
      </section>
    </main>
  );
}
