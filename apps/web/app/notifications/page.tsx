"use client";

import React, { useEffect, useState } from "react";

/**
 * Single notification item returned from backend.
 */
interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

/**
 * Minimal authenticated user shape used on this page.
 * Keep this lean to avoid schema drift.
 */
interface Me {
  id: string;
  name: string;
  email: string;
  role:
    | "COMMUNITY_HEAD"
    | "COMMUNITY_SUBHEAD"
    | "GOTRA_HEAD"
    | "FAMILY_HEAD"
    | "MEMBER";
}

/**
 * Retrieves stored JWT token from localStorage (client-only).
 * @returns JWT token string or null if unavailable
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Notifications Page
 *
 * Responsibilities:
 * - Fetch current user (`/me`)
 * - Fetch user's notifications (`/notifications`)
 * - Allow privileged roles to broadcast notifications
 *
 * Permission rules are ENFORCED by backend,
 * but UI mirrors them for correct UX.
 */
export default function NotificationsPage(): React.ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [me, setMe] = useState<Me | null>(null);
  const [filterRead, setFilterRead] = useState<"all" | "read" | "unread">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "unread-first">(
    "newest",
  );
  const [selectedType, setSelectedType] = useState<string>("all");
  const [priority, setPriority] = useState<
    "low" | "normal" | "high" | "urgent"
  >("normal");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "IN_APP",
  ]);

  useEffect(() => {
    void fetchMe();
    void fetchNotifications();
  }, []);

  /**
   * Fetch currently authenticated user.
   */
  async function fetchMe(): Promise<void> {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) return;

      const js = await res.json();
      setMe(js.data ?? null);
    } catch (err) {
      console.error("Failed to fetch user info", err);
    }
  }

  /**
   * Fetch notifications for the current user.
   */
  async function fetchNotifications(): Promise<void> {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) return;

      const js = await res.json();
      setNotifications(js.data?.notifications ?? []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }

  /**
   * Broadcast notification (admins only).
   */
  async function handleBroadcast(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      alert("Please login to broadcast notifications");
      return;
    }

    if (!message.trim()) return;

    try {
      const body: Record<string, any> = {
        message,
        subject: subject.trim() || undefined,
        priority,
        channels: selectedChannels,
      };
      if (targetRole !== "ALL") body.targetRole = targetRole;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (res.ok) {
        setMessage("");
        setSubject("");
        setTargetRole("ALL");
        setPriority("normal");
        setSelectedChannels(["IN_APP"]);
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

  /**
   * Determines whether user can see broadcast UI.
   */
  const isAdmin =
    me?.role === "COMMUNITY_HEAD" ||
    me?.role === "COMMUNITY_SUBHEAD" ||
    me?.role === "GOTRA_HEAD";

  /**
   * Reset target role when user role changes
   * to prevent invalid selections.
   */
  useEffect(() => {
    setTargetRole("ALL");
  }, [me?.role]);

  /**
   * Toggle channel selection
   */
  function toggleChannel(channel: string) {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  }

  /**
   * Mark notification as read/unread
   */
  async function handleToggleRead(
    notificationId: string,
    currentReadStatus: boolean,
  ): Promise<void> {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/notifications/${notificationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ read: !currentReadStatus }),
        },
      );

      if (res.ok) {
        // Update local state
        setNotifications((prevs) =>
          prevs.map((n) =>
            n.id === notificationId ? { ...n, read: !n.read } : n,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to update notification", err);
    }
  }

  /**
   * Get unique notification types for filter dropdown
   */
  const notificationTypes = Array.from(
    new Set(notifications.map((n) => n.type)),
  ).sort();

  /**
   * Apply filters and sorting
   */
  const filteredNotifications = notifications
    .filter((n) => {
      // Filter by read status
      if (filterRead === "read" && !n.read) return false;
      if (filterRead === "unread" && n.read) return false;
      // Filter by type
      if (selectedType !== "all" && n.type !== selectedType) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        // unread-first
        if (a.read === b.read) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return a.read ? 1 : -1;
      }
    });

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
          <h2 className="text-lg font-semibold mb-1">Broadcast Notification</h2>
          <p className="text-xs text-gray-400 mb-4">
            You can notify users within your permitted scope.
          </p>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write a message to broadcast..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="ALL">All users</option>

                {me?.role === "COMMUNITY_HEAD" && (
                  <>
                    <option value="COMMUNITY_HEAD">Community Heads</option>
                    <option value="COMMUNITY_SUBHEAD">
                      Community Subheads
                    </option>
                    <option value="GOTRA_HEAD">Gotra Heads</option>
                    <option value="FAMILY_HEAD">Family Heads</option>
                    <option value="MEMBER">Members</option>
                  </>
                )}

                {me?.role === "COMMUNITY_SUBHEAD" && (
                  <>
                    <option value="COMMUNITY_HEAD">Community Heads</option>
                    <option value="COMMUNITY_SUBHEAD">
                      Community Subheads
                    </option>
                    <option value="GOTRA_HEAD">Gotra Heads</option>
                  </>
                )}

                {me?.role === "GOTRA_HEAD" && (
                  <>
                    <option value="FAMILY_HEAD">Family Heads</option>
                    <option value="MEMBER">Members</option>
                  </>
                )}
              </select>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as "low" | "normal" | "high" | "urgent",
                  )
                }
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <button
                type="submit"
                disabled={!message.trim()}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>

            {/* Channels */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-200">
              {[
                { label: "In-App", value: "IN_APP" },
                { label: "Email", value: "EMAIL" },
                { label: "Push", value: "PUSH" },
              ].map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                    selectedChannels.includes(c.value)
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-black/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(c.value)}
                    onChange={() => toggleChannel(c.value)}
                    className="accent-blue-500"
                  />
                  {c.label}
                </label>
              ))}
            </div>

            {/* Preview */}
            {(subject.trim() || message.trim()) && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-100 font-semibold uppercase">
                    {priority}
                  </span>
                  <span className="text-gray-400">
                    Channels: {selectedChannels.join(", ") || "None"}
                  </span>
                  {targetRole !== "ALL" && (
                    <span className="text-gray-400">
                      • Target: {targetRole}
                    </span>
                  )}
                </div>
                {subject.trim() && (
                  <p className="font-semibold text-white">{subject}</p>
                )}
                <p>{message}</p>
              </div>
            )}
          </form>
        </section>
      )}

      {/* Notifications List */}
      <section className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl">
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Notifications</h2>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">
                {notifications.filter((n) => !n.read).length} unread
              </span>
            )}
          </div>

          {/* Filters and Sorting */}
          {notifications.length > 0 && (
            <div className="flex flex-wrap gap-3 text-sm">
              {/* Filter by Read Status */}
              <select
                value={filterRead}
                onChange={(e) =>
                  setFilterRead(e.target.value as "all" | "read" | "unread")
                }
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              {/* Filter by Type */}
              {notificationTypes.length > 0 && (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
                >
                  <option value="all">All types</option>
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "newest" | "oldest" | "unread-first",
                  )
                }
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="unread-first">Unread first</option>
              </select>
            </div>
          )}
        </div>

        {filteredNotifications.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">
            {notifications.length === 0
              ? "No notifications yet"
              : "No notifications match your filters"}
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredNotifications.map((n) => (
              <li
                key={n.id}
                className={`px-5 py-4 transition ${
                  n.read
                    ? "hover:bg-white/5 opacity-60"
                    : "hover:bg-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.message}</p>
                      {!n.read && (
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{n.type}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Mark as Read/Unread */}
                  <button
                    onClick={() => handleToggleRead(n.id, n.read)}
                    className="text-xs px-3 py-1 rounded border border-white/10 hover:border-white/30 transition whitespace-nowrap"
                  >
                    {n.read ? "Mark unread" : "Mark read"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
