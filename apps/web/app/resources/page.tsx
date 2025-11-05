"use client";

import React, { useEffect, useState } from "react";

type Req = {
  id: string;
  resource: string;
  status: string;
  createdAt: string;
  approvals?: any[];
  userId?: string;
};

/**
 * Performs get token operation.
 * @returns {string} Description of return value
 */
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Performs  resource requests page operation.
 * @returns {any} Description of return value
 */
export default function ResourceRequestsPage() {
  const [resource, setResource] = useState("");
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetchMe();
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMe() {
    try {
      const token = getToken();
      const res = await fetch("http://localhost:3001/api/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return;
      const json = await res.json();
      setMe(json.data || null);
    } catch (err) {
      // ignore
    }
  }

  async function fetchRequests() {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("http://localhost:3001/api/resource-requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        setRequests([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setRequests(json.data?.requests || []);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
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
        fetchRequests();
      } else {
        const js = await res.json();
        alert(js.message || "Failed to create");
      }
    } catch (err) {
      alert("Network error");
    }
  }

  async function handleReview(
    id: string,
    action: "approve" | "reject" | "changes",
  ) {
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
      if (res.ok) fetchRequests();
      else {
        const js = await res.json();
        alert(js.message || "Failed");
      }
    } catch (err) {
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
        <h2>Create request</h2>
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
          <div>Loading...</div>
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
                      <>
                        <button onClick={() => handleReview(r.id, "approve")}>
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(r.id, "reject")}
                          style={{ marginLeft: 8 }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReview(r.id, "changes")}
                          style={{ marginLeft: 8 }}
                        >
                          Request Changes
                        </button>
                      </>
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
