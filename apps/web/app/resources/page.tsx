"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { LoaderThree } from "@repo/ui/loading";

/**
 * Represents a single resource request.
 */
interface ResourceRequest {
  id: string;
  resource: string;
  status: string;
  createdAt: string;
  approvals?: Approval[];
  userId?: string;
}

/**
 * Represents a single approval entry for a resource request.
 */
interface Approval {
  id: string;
  approverId: string;
  approverName: string;
  status: string;
  remarks?: string;
  reviewedAt?: string;
}

/**
 * Represents the currently authenticated user.
 */
interface Me {
  id: string;
  name: string;
  role:
    | "MEMBER"
    | "COMMUNITY_HEAD"
    | "COMMUNITY_SUBHEAD"
    | "GOTRA_HEAD"
    | string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Retrieves the stored auth token from localStorage.
 * @returns {string | null} The token if found, otherwise null.
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Resource Requests page component.
 * - Displays a form for creating resource requests.
 * - Lists existing requests.
 * - Allows privileged roles to review (approve/reject/change) requests.
 *
 * @returns {JSX.Element} The rendered component.
 */
export default function ResourceRequestsPage(): React.JSX.Element {
  const [resource, setResource] = useState("");
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetchMe();
    void fetchRequests();
  }, []);

  /**
   * Fetches current user info from /api/me.
   */
  async function fetchMe(): Promise<void> {
    try {
      const token = getToken();
      const url = API_BASE
        ? `${API_BASE}/api/me`
        : "http://localhost:3001/api/me";

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return;
      const json = await res.json();
      setMe(json.data || null);
    } catch {
      console.error("Failed to fetch user details");
    }
  }

  /**
   * Fetches all resource requests.
   */
  async function fetchRequests(): Promise<void> {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("http://localhost:3001/api/resource-requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        setRequests([]);
        return;
      }
      const json = await res.json();
      setRequests(json.data?.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles creation of a new resource request.
   */
  async function handleCreate(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    const token = getToken();

    try {
      const res = await fetch("http://localhost:3001/api/resource-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resource }),
      });

      if (res.ok) {
        setResource("");
        void fetchRequests();
      } else {
        const js = await res.json();
        alert(js.message || "Failed to create request");
      }
    } catch {
      alert("Network error");
    }
  }

  /**
   * Allows an approver to review a resource request.
   */
  async function handleReview(
    id: string,
    action: "approve" | "reject" | "changes",
  ): Promise<void> {
    const token = getToken();
    try {
      const res = await fetch(
        `http://localhost:3001/api/resource-requests/${id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action }),
        },
      );
      if (res.ok) void fetchRequests();
      else {
        const js = await res.json();
        alert(js.message || "Failed to review");
      }
    } catch {
      alert("Network error");
    }
  }

  const isAdmin =
    me?.role &&
    ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(me.role);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f17] to-black text-white px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Resource Requests</h1>
        <p className="text-sm text-gray-400">
          Request, track, and review shared resources
        </p>
      </div>

      {/* Create Request */}
      <section className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-5 mb-10">
        <h2 className="text-lg font-semibold mb-4">Create Request</h2>

        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="What resource do you need?"
            className="flex-grow bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit">Create</Button>
        </form>
      </section>

      {/* Requests Table */}
      <section className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold">Requests</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
            <LoaderThree />
            <span className="text-sm">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">
            No requests found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/40 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Resource</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Approvals</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">{r.resource}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      {r.approvals?.length ? (
                        r.approvals.map((a) => (
                          <div key={a.id} className="text-xs text-gray-300">
                            <strong>{a.approverName}</strong>: {a.status}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => void handleReview(r.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void handleReview(r.id, "reject")}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void handleReview(r.id, "changes")}
                          >
                            Changes
                          </Button>
                        </div>
                      ) : (
                        <em className="text-gray-500">—</em>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
