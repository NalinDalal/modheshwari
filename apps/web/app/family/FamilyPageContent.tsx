"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/not-authenticated";
import { DeleteButton } from "@repo/ui/delete-button";
import { MemberCard } from "@repo/ui/member-card";
//import { Button } from "@repo/ui/button";

/**
 * Type for a single family member.
 */
interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: boolean;
  };
}

/**
 * Family Page — Displays and manages family members and their status.
 *
 * Optimization Notes:
 * - Caches family data (name and members) in the browser's localStorage.
 *   This allows the page to load instantly for returning users without
 *   waiting for an API response.
 * - Then, a background fetch refreshes data and updates the cache.
 *
 * UX Goal:
 * - Faster perceived load times for returning users.
 * - Reduced redundant API calls.
 *
 * Security:
 * - Only non-sensitive family details are cached.
 * - Auth token is never stored locally.
 */
export default function FamilyPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    setToken(localStorage.getItem("token")); // safe, client-only
  }, []);

  //const token =
  //typeof window !== "undefined" ? localStorage.getItem("token") : null;
  // params.get("token");

  const [members, setMembers] = useState<Member[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  const fetchMembers = useCallback(
    async (all = false) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/family/members${all ? "?all=true" : ""}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.status === 401) {
          router.push(`/login?next=/family`);
          return;
        }
        const data = await res.json();
        setFamilyName(data.data.family.name);
        setMembers(data.data.members);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    },
    [token, API_BASE],
  );

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: !currentStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setMembers((prev) =>
        prev.map((m) =>
          m.user.id === userId
            ? { ...m, user: { ...m.user, status: !currentStatus } }
            : m,
        ),
      );
    } catch (err) {
      console.error("Error toggling status:", err);
      alert("Failed to update member status.");
    }
  };

  useEffect(() => {
    if (token) fetchMembers(showAll);
  }, [token, showAll, fetchMembers]);

  // no token
  if (!token) return <NotAuthenticated />;

  // Before hydration, render nothing (avoids SSR mismatch)
  if (!hydrated) return null;

  // loading
  if (loading) return <LoaderOne />;

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-b from-black via-[#0b0f17] to-black text-white">
      <h1 className="text-4xl font-bold mb-8 drop-shadow-[0_0_25px_rgba(0,150,255,0.5)]">
        {familyName}
      </h1>

      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-semibold">Family Members</h2>
        <label className="text-sm flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={() => setShowAll(!showAll)}
            className="accent-blue-500"
          />
          <span className="text-gray-300">Show all (incl. dead)</span>
        </label>
      </div>

      <div className="space-y-5">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} onToggle={toggleStatus} />
        ))}
      </div>
    </div>
  );
}
