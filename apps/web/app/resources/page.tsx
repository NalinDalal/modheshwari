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
      const res = await fetch("http://localhost:3001/api/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return;
      const json = await res.json();
      setMe(json.data || null);
    } catch {
      // ignore network errors silently
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
   * @param {React.FormEvent} e - The form submission event.
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
        alert(js.message || "Failed to create");
      }
    } catch {
      alert("Network error");
    }
  }

  /**
   * Allows an approver to review a resource request.
   * @param id The request ID.
   * @param action The review action.
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
        alert(js.message || "Failed");
      }
    } catch {
      alert("Network error");
    }
  }

  const isAdmin =
    me?.role &&
    ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(me.role);

  return (
    <div style={{ padding: 24 }}>
      <h1>Resource Requests</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Create Request</h2>
        <form onSubmit={handleCreate}>
          <input
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="What resource do you need?"
            style={{ width: "60%", padding: 8, marginRight: 8 }}
          />
          <button type="submit">Create</button>
        </form>
      </section>

      <section>
        <h2>Requests</h2>
        {loading ? (
          <div className="flex items-center gap-2">
            <LoaderThree /> <span>Loading...</span>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Resource
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Status
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Approvals
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                    {r.resource}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                    {r.status}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                    {r.approvals?.map((a) => (
                      <div key={a.id}>
                        {a.approverName}: {a.status}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => void handleReview(r.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => void handleReview(r.id, "reject")}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => void handleReview(r.id, "changes")}
                        >
                          Request Changes
                        </Button>
                      </div>
                    ) : (
                      <em>—</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
