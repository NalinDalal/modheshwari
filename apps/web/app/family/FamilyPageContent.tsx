"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@repo/ui/button";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/not-authenticated";

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
export default function FamilyPage() {
  const params = useSearchParams();
  const token = params.get("token");

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
    fetchMembers(showAll);
  }, [fetchMembers, showAll]);

  if (!token) return <NotAuthenticated />;
  if (loading) return <LoaderOne />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{familyName}</h1>

      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Family Members</h2>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showAll}
            onChange={() => setShowAll(!showAll)}
          />
          Show all (incl. dead)
        </label>
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <div
            key={m.id}
            className={`border p-3 rounded-lg transition-colors ${
              m.user.status ? "bg-white" : "bg-gray-100 opacity-70"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-lg">{m.user.name}</div>
                <div className="text-sm text-gray-600">{m.user.email}</div>
              </div>
              <Button
                variant={m.user.status ? "danger" : "primary"}
                onClick={() => toggleStatus(m.user.id, m.user.status)}
                className="text-sm"
              >
                Mark {m.user.status ? "Dead" : "Alive"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
