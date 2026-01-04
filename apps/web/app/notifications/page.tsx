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
  families?: Family;
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
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f17] to-black text-white px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Notifications</h1>
        <p className="text-sm text-gray-400">
          Stay updated with system and community alerts
        </p>
      </div>

      {/* Admin Broadcast */}
      {isAdmin && (
        <section className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-5 mb-10">
          <h2 className="text-lg font-semibold mb-4">Broadcast Notification</h2>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write a message to broadcast..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center gap-3">
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="ALL">All users</option>
                <option value="COMMUNITY_HEAD">Community Heads</option>
                <option value="COMMUNITY_SUBHEAD">Community Subheads</option>
                <option value="GOTRA_HEAD">Gotra Heads</option>
                <option value="FAMILY_HEAD">Family Heads</option>
                <option value="MEMBER">Members</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 transition"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Notifications List */}
      <section className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold">Your Notifications</h2>
        </div>

        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">
            No notifications yet
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {notifications.map((n) => (
              <li key={n.id} className="px-5 py-4 hover:bg-white/5 transition">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-sm font-medium">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.type}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
