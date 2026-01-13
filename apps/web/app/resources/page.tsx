"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { LoaderThree } from "@repo/ui/loading";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

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

/**
 * Retrieves the status and checks the type of status
 * @param {string} status - Description of status
 * @returns {string} Description of return value
 */
function getStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "REJECTED":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "CHANGES_REQUESTED":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }
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
  async function handleCreate(): Promise<void> {
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
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0e1a] to-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-40 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Resource Requests
            </h1>
          </div>
          <p className="text-gray-400 ml-15">
            Request, track, and review shared resources
          </p>
        </motion.div>

        {/* Create Request Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            Create New Request
          </h2>

          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="What resource do you need?"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && resource.trim()) {
                    e.preventDefault();
                    void handleCreate();
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!resource.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Create
            </button>
          </div>
        </motion.section>

        {/* Requests Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Your Requests
              {!loading && requests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                  {requests.length}
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <span className="text-sm text-gray-400">Loading requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
                <Package className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm mb-2">No requests found</p>
              <p className="text-gray-600 text-xs">
                Create your first request to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/40">
                  <tr className="text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 text-left font-medium">
                      Resource
                    </th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">
                      Approvals
                    </th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {requests.map((r, index) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-white/5 transition-all duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-white">
                            {r.resource}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(r.status)}`}
                        >
                          {getStatusColor(r.status)}
                          {r.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {r.approvals?.length ? (
                          <div className="space-y-2">
                            {r.approvals.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    a.status === "APPROVED"
                                      ? "bg-green-400"
                                      : a.status === "REJECTED"
                                        ? "bg-red-400"
                                        : "bg-yellow-400"
                                  }`}
                                />
                                <span className="text-gray-300">
                                  <span className="font-medium text-white">
                                    {a.approverName}
                                  </span>
                                  {" · "}
                                  <span className="text-gray-500">
                                    {a.status}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            No approvals yet
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(r.id, "approve")}
                              className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg border border-green-500/20 transition-all duration-200 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(r.id, "reject")}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-all duration-200 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleReview(r.id, "changes")}
                              className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-lg border border-yellow-500/20 transition-all duration-200 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Changes
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">
                            Awaiting review
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
