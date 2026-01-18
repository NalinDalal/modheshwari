"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/not-authenticated";

interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  venue?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    registrations: number;
  };
  createdAt: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">(
    "approved",
  );

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  useEffect(() => {
    setHydrated(true);
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
  }, []);

  useEffect(() => {
    if (hydrated) {
      fetchEvents();
    }
  }, [hydrated, filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const statusParam =
        filter === "all" ? "" : `?status=${filter.toUpperCase()}`;
      const response = await fetch(`${API_BASE}/events${statusParam}`);

      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      // Extract data from new pagination response format
      setEvents(data.data?.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      APPROVED: {
        icon: CheckCircle,
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        label: "Approved",
      },
      PENDING: {
        icon: Clock,
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        label: "Pending",
      },
      REJECTED: {
        icon: XCircle,
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        label: "Rejected",
      },
      CANCELLED: {
        icon: XCircle,
        color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        label: "Cancelled",
      },
    };

    const {
      icon: Icon,
      color,
      label,
    } = config[status as keyof typeof config] || config.PENDING;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

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

  if (hydrated && !token) return <NotAuthenticated />;
  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f17] to-black text-white px-6 py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-sm text-gray-400 mt-1">
              Browse and register for community events
            </p>
          </div>
          <button
            onClick={() => router.push("/events/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-[0_0_12px_rgba(59,130,246,0.5)]"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { label: "Approved", value: "approved" },
            { label: "Pending", value: "pending" },
            { label: "All", value: "all" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Events List */}
        {loading ? (
          <LoaderOne />
        ) : events.length === 0 ? (
          <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No events found
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {filter === "approved"
                ? "No approved events at the moment. Check back later!"
                : "Try adjusting your filters or create a new event."}
            </p>
            <button
              onClick={() => router.push("/events/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => router.push(`/events/${event.id}`)}
                className="group bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:bg-white/5 hover:border-blue-500/30 transition-all cursor-pointer"
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  {getStatusBadge(event.status)}
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    {event._count.registrations}
                  </span>
                </div>

                {/* Event Name */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {event.name}
                </h3>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Date & Venue */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(event.date)}</span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  )}
                </div>

                {/* Organizer */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500">
                    Organized by{" "}
                    <span className="text-gray-400 font-medium">
                      {event.createdBy.name}
                    </span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
