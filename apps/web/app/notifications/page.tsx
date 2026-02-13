"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

import useNotifications from "../../hooks/useNotifications";

/**
 * Single notification item returned from backend.
 */
type Notification = {
  id?: string;
  previewId?: string;
  type?: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

/**
 * Minimal authenticated user shape used on this page.
 */
type Role =
  | "COMMUNITY_HEAD"
  | "COMMUNITY_SUBHEAD"
  | "GOTRA_HEAD"
  | "FAMILY_HEAD"
  | "MEMBER";

type Me = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Priority = "low" | "normal" | "high" | "urgent";
type ReadFilter = "all" | "read" | "unread";
type SortBy = "newest" | "oldest" | "unread-first";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}


function isAdminRole(role?: Role): boolean {
  return (
    role === "COMMUNITY_HEAD" ||
    role === "COMMUNITY_SUBHEAD" ||
    role === "GOTRA_HEAD"
  );
}

function dedupeKey(n: Notification): string {
  if (n.id) return `id:${n.id}`;
  if (n.previewId) return `preview:${n.previewId}`;
  return `fallback:${n.message}:${n.createdAt}`;
}

export default function NotificationsPage(): React.ReactElement {
  const { notifications: hookNotifications, unreadCount, refresh, markRead, markAllRead, pulse } = useNotifications();
  const [me, setMe] = useState<Me | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [targetRole, setTargetRole] = useState("ALL");
  const [priority, setPriority] = useState<Priority>("normal");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["IN_APP"]);

  const [filterRead, setFilterRead] = useState<ReadFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [selectedType, setSelectedType] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  const isAdmin = isAdminRole(me?.role);

  const loadCurrentUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const js = await res.json();
      setMe(js.data ?? null);
    } catch (err) {
      console.error("Failed to fetch user info", err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    // delegate to hook
    setError(null);
    setLoading(true);
    try {
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  /**
   * Initial load
   */
  useEffect(() => {
    void loadCurrentUser();
    void fetchNotifications();
  }, [loadCurrentUser, fetchNotifications]);

  /**
   * Reset target role when role changes (avoid invalid selection)
   */
  useEffect(() => {
    setTargetRole("ALL");
  }, [me?.role]);

  // Hook now manages WS and incoming notifications.

  function toggleChannel(channel: string) {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      alert("Please login to broadcast notifications");
      return;
    }

    if (!message.trim()) return;

    setBroadcasting(true);

    try {
      const body: {
        message: string;
        subject?: string;
        priority: Priority;
        channels: string[];
        targetRole?: string;
      } = {
        message: message.trim(),
        subject: subject.trim() || undefined,
        priority,
        channels: selectedChannels,
      };

      if (targetRole !== "ALL") body.targetRole = targetRole;

      const res = await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const js = await res.json().catch(() => null);
        alert(js?.message || "Failed to broadcast");
        return;
      }

      setMessage("");
      setSubject("");
      setTargetRole("ALL");
      setPriority("normal");
      setSelectedChannels(["IN_APP"]);

      await fetchNotifications();
      alert("Broadcast sent");
    } catch (err) {
      console.error("Broadcast error", err);
      alert("Network error");
    } finally {
      setBroadcasting(false);
    }
  }

  async function handleToggleRead(notificationId: string, currentRead: boolean) {
    try {
      const ok = await markRead(notificationId, currentRead);
      if (!ok) return;
      // hook updates notifications state
      await refresh();
    } catch (err) {
      console.error("Failed to update notification", err);
    }
  }

  async function handleMarkAllRead() {
    try {
      setLoading(true);
      await markAllRead();
      await refresh();
    } catch (err) {
      console.error("Failed to mark all read", err);
    } finally {
      setLoading(false);
    }
  }

  const notificationTypes = useMemo(() => {
    return Array.from(new Set(hookNotifications.map((n) => n.type).filter(Boolean))).sort();
  }, [hookNotifications]);

  const filteredNotifications = useMemo(() => {
    return hookNotifications
      .filter((n) => {
        if (filterRead === "read" && !n.read) return false;
        if (filterRead === "unread" && n.read) return false;
        if (selectedType !== "all" && n.type !== selectedType) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return +new Date(b.createdAt) - +new Date(a.createdAt);
        }
        if (sortBy === "oldest") {
          return +new Date(a.createdAt) - +new Date(b.createdAt);
        }

        // unread-first
        if (a.read === b.read) {
          return +new Date(b.createdAt) - +new Date(a.createdAt);
        }
        return a.read ? 1 : -1;
      });
  }, [hookNotifications, filterRead, selectedType, sortBy]);
  

  return (
    <DreamySunsetBackground className="px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
            Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Stay updated with system and community alerts
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Admin Broadcast */}
        {isAdmin && (
          <section className="bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl p-8 mb-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              📢 Broadcast Notification
            </h2>
            <p className="text-gray-600 mb-6">
              You can notify users within your permitted scope.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-6">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (optional)"
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3"
              />

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Write a message to broadcast..."
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 resize-none"
              />

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-3"
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
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-3"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>

                <button
                  type="submit"
                  disabled={broadcasting || !message.trim()}
                  className="px-6 py-3 rounded-lg bg-pink-600 text-white disabled:opacity-50"
                >
                  {broadcasting ? "Sending..." : "Send Notification"}
                </button>
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Channels
                </label>
                <div className="flex gap-3">
                  {["IN_APP", "EMAIL", "PUSH"].map((c) => (
                    <label key={c} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(c)}
                        onChange={() => toggleChannel(c)}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {(subject.trim() || message.trim()) && (
                <div className="border rounded-lg p-4">
                  <p className="font-semibold">{subject.trim() || "—"}</p>
                  <p>{message.trim()}</p>
                </div>
              )}
            </form>
          </section>
        )}

        {/* Notifications List */}
        <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b flex flex-wrap gap-3 items-center">
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as ReadFilter)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="unread-first">Unread first</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All types</option>
              {notificationTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => void fetchNotifications()}
                className="text-sm px-3 py-2 rounded-lg border"
              >
                Refresh
              </button>

              <button
                onClick={() => void handleMarkAllRead()}
                className="text-sm px-3 py-2 rounded-lg border"
                title="Mark all read"
              >
                Mark all read
              </button>

              <div className="text-sm text-pink-600">
                {unreadCount > 0 && (
                  <span className={`${pulse ? "animate-pulse font-semibold" : "font-medium"}`}>
                    Unread: {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <p className="text-center py-12 text-gray-500">Loading...</p>
          ) : filteredNotifications.length === 0 ? (
            <p className="text-center py-12 text-gray-500">📭 No notifications</p>
          ) : (
            <ul>
              {filteredNotifications.map((n) => {
                const canToggleRead = Boolean(n.id);

                return (
                  <li
                    key={dedupeKey(n)}
                    className={`p-6 border-b last:border-b-0 ${
                      n.read ? "bg-white" : "bg-pink-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-gray-900">{n.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {canToggleRead && (
                        <button
                          onClick={() => void handleToggleRead(n.id!, !!n.read)}
                          className="text-xs px-3 py-2 rounded-lg border flex items-center justify-center"
                          title={n.read ? "Mark unread" : "Mark read"}
                          aria-label={n.read ? "Mark unread" : "Mark read"}
                        >
                          {n.read ? (
                            <Eye className="w-4 h-4 text-gray-700" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-700" />
                          )}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </DreamySunsetBackground>
  );
}
