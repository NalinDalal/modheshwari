import { useEffect, useRef, useState, useCallback } from "react";

import { API_BASE } from "../lib/config";

type Notification = {
  id?: string;
  previewId?: string;
  type?: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

export type UseNotificationsHook = {
  unreadCount: number;
  notifications: Notification[];
  refresh: () => Promise<void>;
  markRead: (notificationId: string, currentRead: boolean) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
  pulse: boolean;
};

export default function useNotifications(): UseNotificationsHook {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pulse, setPulse] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const mergePersisted = (prev: Notification[], fetched: Notification[]) => {
    const next = [...fetched];
    const fetchedKeys = new Set(next.map((n) => (n.id ? `id:${n.id}` : n.previewId ? `preview:${n.previewId}` : `fallback:${n.message}:${n.createdAt}`)));
    const fetchedPreviewIds = new Set(next.map((n) => n.previewId).filter(Boolean));

    for (const p of prev) {
      if (p.previewId && fetchedPreviewIds.has(p.previewId)) continue;
      const key = p.id ? `id:${p.id}` : p.previewId ? `preview:${p.previewId}` : `fallback:${p.message}:${p.createdAt}`;
      if (fetchedKeys.has(key)) continue;
      next.unshift(p);
    }

    return next;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const js = await res.json();
      const fetched: Notification[] = js?.data?.notifications ?? [];
      setNotifications((prev) => mergePersisted(prev, fetched));
      setUnreadCount(fetched.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.hostname}:3002/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      try {
        ws.send(JSON.stringify({ type: "auth", token }));
      } catch {
        // ignore
      }
    });

    ws.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === "notification") {
          const incoming: Notification = data.notification;
          setNotifications((prev) => [incoming, ...prev]);
          setUnreadCount((c) => c + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 700);
        }
        if (data?.type === "notification_read") {
          // server may broadcast read events; refresh full list
          void fetchNotifications();
        }
      } catch {
        // ignore parse errors
      }
    });

    ws.addEventListener("error", () => {
      // ignore for now
    });

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [fetchNotifications]);

  async function markRead(notificationId: string, currentRead: boolean) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ read: !currentRead }),
      });
      if (!res.ok) return false;

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: !currentRead } : n)));
      if (!currentRead) setUnreadCount((c) => Math.max(0, c - 1));
      else setUnreadCount((c) => c + 1);

      return true;
    } catch (err) {
      console.error("Failed to mark notification read", err);
      return false;
    }
  }

  async function markAllRead() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return false;
    try {
      // Try bulk endpoint first
      const bulkRes = await fetch(`${API_BASE}/notifications/mark-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bulkRes.ok) {
        // refresh list
        await fetchNotifications();
        return true;
      }

      // Fallback: patch each unread notification
      const unreadIds = notifications.filter((n) => !n.read && n.id).map((n) => n.id!) as string[];
      await Promise.all(unreadIds.map((id) => fetch(`${API_BASE}/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ read: true }),
      })));

      await fetchNotifications();
      return true;
    } catch (err) {
      console.error("Failed to mark all read", err);
      return false;
    }
  }

  return { unreadCount, notifications, refresh: fetchNotifications, markRead, markAllRead, pulse };
}
