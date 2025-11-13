"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderFour } from "@repo/ui/loading";
import { DeleteButton } from "@repo/ui/delete-button";
import { Button } from "@repo/ui/button";

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
  familyName?: string;
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

          {/* subtle pulsing orb background */}
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

  const familyName = user.families?.[0]?.family?.name || user.familyName || "—";

  return (
    <main className="max-w-3xl mx-auto mt-16 px-4">
      <section className="bg-white/80 dark:bg-neutral-900/80 shadow-xl backdrop-blur-sm rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center border border-amber-100/40 dark:border-neutral-700/40 transition-all duration-300 hover:shadow-2xl">
        <div className="flex-shrink-0 flex items-center justify-center h-28 w-28 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white text-2xl font-bold shadow-md">
          {initials || "U"}
        </div>

        <div className="flex-1 w-full">
          <h1 className="text-3xl font-semibold text-amber-900 dark:text-white">
            {user.name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {user.email}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40">
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Role
              </div>
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {user.role}
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40">
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Status
              </div>
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {user.status ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-white to-amber-50/40 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-amber-100/40 dark:border-neutral-700/40">
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Family
              </div>
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {familyName}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={() => router.push("/me/edit")} variant="primary">
              Edit Profile
            </Button>

            <DeleteButton
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/signin");
              }}
            >
              Sign out
            </DeleteButton>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-md rounded-2xl p-6 border border-amber-100/40 dark:border-neutral-700/40">
          <h2 className="text-lg font-semibold mb-2 text-amber-900 dark:text-white">
            About
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Private profile information and family details are shown here. You
            can update these by editing your profile.
          </p>
        </div>
      </section>

      {/* --- Section to list shit from the user --- */}
      <section className="mt-10 flex flex-col items-center justify-center gap-y-4 md:flex-row md:gap-x-4"></section>
    </main>
  );
}
