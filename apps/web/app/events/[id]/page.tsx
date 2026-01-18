"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  UserCheck,
  UserX,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoaderOne } from "@repo/ui/loading";
import { NotAuthenticated } from "@repo/ui/not-authenticated";

interface EventDetails {
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
  approvals: Array<{
    id: string;
    status: string;
    remarks?: string;
    reviewedAt?: string;
    approver: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  registrations: Array<{
    id: string;
    userId: string;
    registeredAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    registrations: number;
  };
  createdAt: string;
}

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;

  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  useEffect(() => {
    setHydrated(true);
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);

    // Decode token to get userId
    if (savedToken) {
      try {
        const parts = savedToken.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]!));
          setUserId(payload.userId || payload.id);
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (hydrated && eventId) {
      fetchEvent();
    }
  }, [hydrated, eventId]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch event");

      const data = await response.json();
      setEvent(data.data.event);

      // Check if user is registered
      if (userId && data.data.event.registrations) {
        const userRegistration = data.data.event.registrations.find(
          (r: any) => r.userId === userId,
        );
        setIsRegistered(!!userRegistration);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!token) return;

    setRegistering(true);
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register");
      }

      setIsRegistered(true);
      fetchEvent(); // Refresh to get updated registration count
    } catch (error: any) {
      alert(error.message || "Failed to register for event");
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!token) return;

    setRegistering(true);
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to unregister");
      }

      setIsRegistered(false);
      fetchEvent(); // Refresh to get updated registration count
    } catch (error: any) {
      alert(error.message || "Failed to unregister from event");
    } finally {
      setRegistering(false);
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
        label: "Pending Approval",
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
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${color}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (hydrated && !token) return <NotAuthenticated />;
  if (!hydrated) return null;

  if (loading) return <LoaderOne />;

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f17] to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event not found</h2>
          <button
            onClick={() => router.push("/events")}
            className="text-blue-400 hover:text-blue-300"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f17] to-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>

        {/* Event Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-8"
        >
          {/* Status & Registration Count */}
          <div className="flex items-center justify-between mb-6">
            {getStatusBadge(event.status)}
            <span className="flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span className="font-semibold">
                {event._count.registrations}
              </span>
              <span className="text-sm">registered</span>
            </span>
          </div>

          {/* Event Name */}
          <h1 className="text-3xl font-bold mb-4">{event.name}</h1>

          {/* Description */}
          {event.description && (
            <p className="text-gray-300 mb-6 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                <p className="text-sm font-medium">{formatDate(event.date)}</p>
              </div>
            </div>

            {event.venue && (
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Venue</p>
                  <p className="text-sm font-medium">{event.venue}</p>
                </div>
              </div>
            )}
          </div>

          {/* Organizer */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-8">
            <p className="text-xs text-gray-500 mb-2">Organized by</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {event.createdBy.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{event.createdBy.name}</p>
                <p className="text-xs text-gray-500">{event.createdBy.email}</p>
              </div>
            </div>
          </div>

          {/* Registration Button */}
          {event.status === "APPROVED" && (
            <div className="flex gap-3">
              {isRegistered ? (
                <button
                  onClick={handleUnregister}
                  disabled={registering}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Unregistering...
                    </>
                  ) : (
                    <>
                      <UserX className="w-5 h-5" />
                      Unregister
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                >
                  {registering ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Register for Event
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {event.status === "PENDING" && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
              <strong>Pending Approval:</strong> This event is awaiting approval
              from community admins.
            </div>
          )}

          {event.status === "REJECTED" && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              <strong>Rejected:</strong> This event was not approved by the
              admins.
            </div>
          )}

          {event.status === "CANCELLED" && (
            <div className="p-4 bg-gray-900/20 border border-gray-500/30 rounded-lg text-gray-200 text-sm">
              <strong>Cancelled:</strong> This event has been cancelled.
            </div>
          )}
        </motion.div>

        {/* Approval Status (if pending/rejected) */}
        {event.approvals && event.approvals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Approval Status</h2>
            <div className="space-y-3">
              {event.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <p className="font-medium">{approval.approver.name}</p>
                    <p className="text-xs text-gray-500">
                      {approval.approver.role.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      approval.status === "APPROVED"
                        ? "bg-green-500/20 text-green-400"
                        : approval.status === "REJECTED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {approval.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
