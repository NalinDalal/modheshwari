"use client";

import React, { useEffect, useRef, useState } from "react";
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

/**
 * Single notification item returned from backend.
 */
interface Notification {
  id?: string;
  previewId?: string;
  type?: string;
  message: string;
  createdAt: string;
  read?: boolean;
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
    void loadCurrentUser();
    void fetchNotifications();
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = getToken();
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.hostname}:3002/?token=${encodeURIComponent(token || "")}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.addEventListener('open', () => {
      if (token) {
        try {
          ws.send(JSON.stringify({ type: 'auth', token }));
        } catch (e) {
          console.error('Failed to send auth message', e);
        }
      }
    });
    ws.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "notification") {
          const incoming = data.notification as Notification;
          upsertNotification(incoming);
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    });

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  /**
   * Fetch currently authenticated user.
   */
  async function loadCurrentUser(): Promise<void> {
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
      const fetched: Notification[] = js.data?.notifications ?? [];
      // Merge fetched persisted notifications with any in-memory previews
      setNotifications((prev) => mergePersisted(prev, fetched));
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }

  function upsertNotification(incoming: Notification) {
    setNotifications((prev) => {
      // if incoming has id (persisted)
      if (incoming.id) {
        // replace any preview with same previewId
        const byPreview = incoming.previewId
          ? prev.findIndex((p) => p.previewId === incoming.previewId)
          : -1;
        if (byPreview >= 0) {
          const next = [...prev];
          next[byPreview] = { ...incoming };
          return next;
        }
        // if already exists by id, ignore
        if (prev.some((p) => p.id === incoming.id)) return prev;
        // prepend persisted
        return [{ ...incoming }, ...prev];
      }

      // incoming is a preview (no id)
      if (incoming.previewId) {
        if (prev.some((p) => p.previewId === incoming.previewId)) return prev;
        return [{ ...incoming }, ...prev];
      }

      // fallback: dedupe by message+createdAt
      if (prev.some((p) => p.message === incoming.message && p.createdAt === incoming.createdAt)) return prev;
      return [{ ...incoming }, ...prev];
    });
  }

  function mergePersisted(prev: Notification[], fetched: Notification[]) {
    // Start with persisted list, but ensure any existing previews that match by previewId are replaced
    const next = [...fetched];
    const previewMap = new Map<string, Notification>();
    for (const p of prev) {
      if (p.previewId) previewMap.set(p.previewId, p);
    }
    // prepend any previews that don't match fetched items
    for (const [previewId, p] of previewMap.entries()) {
      const exists = next.some((n) => n.previewId === previewId || n.message === p.message && n.createdAt === p.createdAt);
      if (!exists) next.unshift(p);
    }
    return next;
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
      interface BroadcastBody {
        message: string;
        subject?: string;
        priority: "low" | "normal" | "high" | "urgent";
        channels: string[];
        targetRole?: string;
      }

      const body: BroadcastBody = {
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
      if (a.read === b.read) {
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      }
      return a.read ? 1 : -1;
    });

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
                  onChange={(e) =>
                    setPriority(
                      e.target.value as "low" | "normal" | "high" | "urgent",
                    )
                  }
                  className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-3"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>

                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="px-6 py-3 rounded-lg bg-pink-600 text-white"
                >
                  Send Notification
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
                  <p className="font-semibold">{subject}</p>
                  <p>{message}</p>
                </div>
              )}
            </form>
          </section>
        )}

        {/* Notifications List */}
        <section className="bg-white rounded-2xl">
          {filteredNotifications.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              📭 No notifications
            </p>
          ) : (
            <ul>
              {filteredNotifications.map((n) => (
                <li key={n.id} className="p-6 border-b">
                  <p>{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DreamySunsetBackground>
  );
}
