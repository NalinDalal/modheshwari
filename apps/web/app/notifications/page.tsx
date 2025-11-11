"use client";

import React, { useEffect, useState } from "react";
import type { Family } from "@prisma/client";

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  families?: Family; // You can replace this later with Family[] if you have the type
}

/**
 * Retrieves stored JWT token from localStorage (client only).
 * @returns {string | null} JWT token string or null if unavailable.
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Notifications Page
 * - Fetches `/me` and `/notifications` from backend.
 * - Allows privileged roles to broadcast system-wide notifications.
 */
export default function NotificationsPage(): React.ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetchMe();
    void fetchNotifications();
  }, []);

  async function fetchMe(): Promise<void> {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const js = await res.json();
      setMe(js.data || null);
    } catch (err) {
      console.error("Failed to fetch user info", err);
    }
  }

  async function fetchNotifications(): Promise<void> {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const js = await res.json();
      setNotifications(js.data?.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }

  async function handleBroadcast(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const token = getToken();
    if (!token) return alert("Login as admin to broadcast");
    try {
      const body: Record<string, string> = { message };
      if (targetRole !== "ALL") body.targetRole = targetRole;

      const res = await fetch("http://localhost:3001/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage("");
        await fetchNotifications();
        alert("Broadcast sent");
      } else {
        const js = await res.json();
        alert(js.message || "Failed to broadcast");
      }
    } catch (err) {
      console.error("Network error", err);
      alert("Network error");
    }
  }

  const isAdmin =
    me?.role &&
    ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(me.role);

  return (
    <div style={{ padding: 24 }}>
      <h1>Notifications</h1>

      {isAdmin && (
        <section style={{ marginBottom: 24 }}>
          <h2>Broadcast notification</h2>
          <form onSubmit={handleBroadcast}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{ width: "60%" }}
            />
            <div style={{ marginTop: 8 }}>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="ALL">All users</option>
                <option value="COMMUNITY_HEAD">Community Heads</option>
                <option value="COMMUNITY_SUBHEAD">Community Subheads</option>
                <option value="GOTRA_HEAD">Gotra Heads</option>
                <option value="FAMILY_HEAD">Family Heads</option>
                <option value="MEMBER">Members</option>
              </select>
              <button style={{ marginLeft: 8 }} type="submit">
                Send
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <h2>Your notifications</h2>
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>
              <strong>{n.type}</strong>: {n.message}{" "}
              <em>— {new Date(n.createdAt).toLocaleString()}</em>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
