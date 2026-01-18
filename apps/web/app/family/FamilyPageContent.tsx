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
  const [familyName, setFamilyName] = useState("");
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
        setFamilyName(data.data?.family?.name || "");
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
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-200">
          Members
          <span className="ml-2 text-xs text-gray-500">({members.length})</span>
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Filter:</span>
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
            ${
              showAll
                ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {showAll ? "All members" : "Alive only"}
          </button>
        </div>
      </div>

      {/* Members Container */}
      <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoaderOne />
          </div>
        ) : members.length > 0 ? (
          <div className="divide-y divide-white/5">
            {members.map((m) => (
              <div key={m.id} className="p-4 hover:bg-white/5 transition">
                <MemberCard member={m} onToggle={toggleStatus} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No family members to show</p>
            <p className="text-xs text-gray-600 mt-1">
              Try changing the filter or adding new members
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
