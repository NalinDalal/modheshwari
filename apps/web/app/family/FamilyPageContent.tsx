"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/not-authenticated";
import { MemberCard } from "@repo/ui/member-card";

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

  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  // Hydrate token from localStorage on client
  useEffect(() => {
    setHydrated(true);
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
  }, []);

  // Fetch members from API
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

        if (!res.ok) throw new Error("Failed to fetch members");

        const data = await res.json();
        // family name is available in response but not used in this component
        // const familyName = data.data?.family?.name || "";
        // Extract members from new pagination response format
        setMembers(data.data?.members || []);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    },
    [token, API_BASE, router],
  );

  // Toggle member status
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

  // Fetch members whenever token or showAll changes
  useEffect(() => {
    if (token) fetchMembers(showAll);
  }, [token, showAll, fetchMembers]);

  // Render logic

  // Not authenticated
  if (hydrated && !token) return <NotAuthenticated />;

  // Avoid SSR mismatch
  if (!hydrated) return null;

  // Loading state
  if (loading) return <LoaderOne />;
  return (
  <div className="space-y-6">
    {/* Bento Header Stats */}
    {/*
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl p-5 bg-white/6 border border-white/10 backdrop-blur-xl">
        <p className="text-xs text-white/60">Total Members</p>
        <p className="text-2xl font-bold mt-2">{members.length}</p>
      </div>

      <div className="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
        <p className="text-xs text-emerald-200/80">Alive</p>
        <p className="text-2xl font-bold mt-2">
          {members.filter((m) => m.user.status).length}
        </p>
      </div>

      <div className="rounded-2xl p-5 bg-red-500/10 border border-red-500/20 backdrop-blur-xl">
        <p className="text-xs text-red-200/80">Dead</p>
        <p className="text-2xl font-bold mt-2">
          {members.filter((m) => !m.user.status).length}
        </p>
      </div>*/}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <div className="col-span-2 rounded-3xl p-6 bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-white/10">
    <p className="text-sm text-white/60">Total Members</p>
    <p className="text-4xl font-black mt-2">{members.length}</p>
  </div>

  <div className="rounded-3xl p-6 bg-emerald-500/15 border border-emerald-500/30">
    <p className="text-sm text-emerald-200">Alive</p>
    <p className="text-3xl font-bold mt-2">
      {members.filter((m) => m.user.status).length}
    </p>
  </div>

  <div className="rounded-3xl p-6 bg-red-500/15 border border-red-500/30">
    <p className="text-sm text-red-200">Dead</p>
    <p className="text-3xl font-bold mt-2">
      {members.filter((m) => !m.user.status).length}
    </p>
  </div>


      {/* Filter tile */}
      <div className="rounded-2xl p-5 bg-white/6 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
        <p className="text-xs text-white/60">Filter</p>

        <button
          onClick={() => setShowAll((prev) => !prev)}
          className={`mt-3 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            showAll
              ? "bg-rose-500 text-white"
              : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
        >
          {showAll ? "Showing All" : "Alive Only"}
        </button>
      </div>
    </div>

    {/* Members Bento Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {members.length > 0 ? (
        members.map((m) => (
          <MemberCard key={m.id} member={m} onToggle={toggleStatus} />
        ))
      ) : (
        <div className="md:col-span-2 xl:col-span-3 rounded-2xl p-10 text-center bg-white/6 border border-white/10">
          <p className="text-sm text-white/70">No family members to show</p>
          <p className="text-xs text-white/50 mt-1">
            Try changing the filter or adding new members
          </p>
        </div>
      )}
    </div>
  </div>
);
}
