"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/not-authenticated";
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

type Event = {
  id: string;
  name: string;
  description?: string;
  date: string;
  venue?: string;
  status: string;
  createdBy: { id: string; name: string; email: string };
  _count: { registrations: number };
  createdAt: string;
};

const fetcher = /**
 * Executes fetcher operation.
 * @param {string} url - Description of url
 * @returns {Promise<any>} Description of return value
 */
async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

/**
 * Performs  events list client operation.
 * @param {{ initialData: Event[]; }} { initialData } - Description of { initialData }
 * @returns {any} Description of return value
 */
export default function EventsListClient({ initialData }: { initialData: Event[] }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("approved");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  useEffect(() => {
    setHydrated(true);
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
    if (savedToken) {
      try {
        const parts = savedToken.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]!));
          setUserRole(payload.role || payload.userRole || null);
        }
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const statusParam = filter === "all" ? "" : `?status=${filter.toUpperCase()}`;
  const key = `${API_BASE}/events${statusParam}`;

  const { data, error, isLoading } = useSWR(key, fetcher, { fallbackData: { data: { data: initialData } } });

  const events: Event[] = data?.data?.data || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAdmin = !!(
    userRole && ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"].includes(userRole)
  );

  const handleCardModeration = async (
    e: React.MouseEvent,
    id: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    e.stopPropagation();
    if (!token || !isAdmin) return alert("Not authorized");

    const remarks = window.prompt("Optional remarks / suggested changes:", "") || undefined;
    setModeratingId(id);
    try {
      const res = await fetch(`${API_BASE}/events/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, remarks }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to record moderation");

      // Refresh list
      mutate(key);
      alert(`Moderation recorded: ${status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg || "Moderation failed");
    } finally {
      setModeratingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; classes: string }> = {
      APPROVED: { label: "Approved", classes: "bg-green-500/20 text-green-400 border-green-500/30" },
      PENDING: { label: "Pending", classes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      REJECTED: { label: "Rejected", classes: "bg-red-500/20 text-red-400 border-red-500/30" },
      CANCELLED: { label: "Cancelled", classes: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    };
    return map[status] || { label: status, classes: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  };

  if (hydrated && !token) return <NotAuthenticated />;
  if (!hydrated) return null;

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-sm text-gray-400 mt-1">Browse and register for community events</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/events/calendar")} className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/5">
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button onClick={() => router.push("/events/create")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-[0_0_12px_rgba(59,130,246,0.5)]">
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[{ label: "Approved", value: "approved" as const }, { label: "Pending", value: "pending" as const }, { label: "All", value: "all" as const }].map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading || error ? (
          <LoaderOne />
        ) : events.length === 0 ? (
          <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No events found</h3>
            <p className="text-sm text-gray-500 mb-6">{filter === "approved" ? "No approved events at the moment. Check back later!" : "Try adjusting your filters or create a new event."}</p>
            <button onClick={() => router.push("/events/create")} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Create New Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const status = getStatusConfig(event.status);
              const initial = event.createdBy?.name ? event.createdBy.name.charAt(0).toUpperCase() : "?";
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="group bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:bg-white/5 hover:border-blue-500/30 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.classes}`}>
                      {status.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3.5 h-3.5" />{event._count.registrations}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">{event.name}</h3>

                  {event.description && <p className="text-sm text-gray-400 mb-4 line-clamp-2">{event.description}</p>}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="w-4 h-4 flex-shrink-0" /><span className="truncate">{formatDate(event.date)}</span></div>
                    {event.venue && (<div className="flex items-center gap-2 text-xs text-gray-500"><MapPin className="w-4 h-4 flex-shrink-0" /><span className="truncate">{event.venue}</span></div>)}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">{initial}</div>
                      <p className="text-xs text-gray-500">Organized by <span className="text-gray-400 font-medium">{event.createdBy.name}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleCardModeration(e, event.id, "APPROVED")}
                            disabled={!!moderatingId}
                            aria-label={`Approve ${event.name}`}
                            className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleCardModeration(e, event.id, "REJECTED")}
                            disabled={!!moderatingId}
                            aria-label={`Reject ${event.name}`}
                            className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DreamySunsetBackground>
  );
}
