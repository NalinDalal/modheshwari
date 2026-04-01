"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../lib/api";
import { API_BASE } from "../../lib/config";
import { LoaderFour } from "@repo/ui/loading";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: boolean;
  profile: Profile | null;
  families: FamilyMembership[];
  createdAt: string;
  updatedAt: string;
}

interface Profile {
  phone?: string | null;
  address?: string | null;
  profession?: string | null;
  gotra?: string | null;
  location?: string | null;
  status?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  medicalNotes?: string | null;
}

interface FamilyMembership {
  id: string;
  familyId: string;
  role: string;
  joinedAt: string;
  family: {
    id: string;
    name: string;
    uniqueId: string;
  };
}

/* =======================
   Small Helpers
======================= */

/**
 * Performs  profile field operation.
 * @param {{ label: string; value?: string; }} {
 *   label,
 *   value,
 * } - Description of {
 *   label,
 *   value,
 * }
 * @returns {React.JSX.Element} Description of return value
 */
function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="p-3 border border-jewel-400/20 rounded-lg bg-jewel-50/50">
      <div className="text-xs text-jewel-500">{label}</div>
      <div className="font-medium text-jewel-900">{value}</div>
    </div>
  );
}

/**
 * Performs  me page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (mounted) router.push("/signin");
          return;
        }

        if (mounted) setLoading(true);

        const result = await apiFetch(`${API_BASE}/me`, {
          throwOnError: false,
        });
        if (result?.ok === false) {
          localStorage.removeItem("token");
          if (mounted) router.push("/signin");
          return;
        }

        const u = result?.data?.data ?? result?.data ?? result;
        if (u && mounted) setUser(u as User);
      } catch (err) {
        console.error("Failed to fetch /me", err);
        localStorage.removeItem("token");
        if (mounted) router.push("/signin");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    const handler = () => setTimeout(checkAuth, 10);
    window.addEventListener("storage", handler);
    window.addEventListener("authChanged", handler as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("storage", handler);
      window.removeEventListener("authChanged", handler as EventListener);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderFour text="Loading your profile..." />
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Role badge color
  const roleColors: Record<string, string> = {
    COMMUNITY_HEAD: "bg-jewel-gold",
    COMMUNITY_SUBHEAD: "bg-jewel-600",
    GOTRA_HEAD: "bg-jewel-emerald",
    FAMILY_HEAD: "bg-jewel-500",
    MEMBER: "bg-jewel-400",
  };

  // Status chip
  const statusChip = user.status ? (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-jewel-emerald/20 text-jewel-emerald border border-jewel-emerald/30">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-jewel-200/50 text-jewel-600 border border-jewel-400/20">
      Inactive
    </span>
  );

  // Dashboard layout
  return (
    <main className="max-w-4xl mx-auto px-4 pb-12">
      {/* Top Summary Bar */}
      <section className="flex items-center gap-6 py-8 border-b border-jewel-400/20 mb-8">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-jewel-deep shadow-lg"
          style={{ background: roleColors[user.role] || "#78716c" }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold text-jewel-900">
              {user.name}
            </h1>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold text-jewel-deep ${roleColors[user.role] || "bg-jewel-400"}`}
            >
              {user.role ? user.role.replace(/_/g, " ") : "Unknown"}
            </span>
            {statusChip}
          </div>
          <p className="text-sm text-jewel-500 mt-1">{user.email}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push("/me/edit")}
            className="btn-primary"
          >
            Edit profile
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/signin");
            }}
            className="px-5 py-2 border border-jewel-400/30 rounded-lg text-sm text-jewel-700 hover:bg-jewel-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </section>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <section className="card border-transparent p-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <span>Personal Details</span>
            <span className="text-xs text-jewel-500">Profile</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <ProfileField label="Profession" value={user.profile?.profession} />
            <ProfileField label="Gotra" value={user.profile?.gotra} />
            <ProfileField
              label="Blood Group"
              value={user.profile?.bloodGroup}
            />
            <ProfileField label="Location" value={user.profile?.location} />
            <ProfileField label="Phone" value={user.profile?.phone} />
            <ProfileField label="Address" value={user.profile?.address} />
          </div>
        </section>

        {/* Families Card */}
        <section className="card border-transparent p-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <span>Family Memberships</span>
            <span className="text-xs text-jewel-500">Families</span>
          </h2>
          {!Array.isArray(user.families) || user.families.length === 0 ? (
            <div className="text-jewel-500 text-sm">No families linked.</div>
          ) : (
            <ul className="space-y-3">
              {user.families.map((fm) => (
                <li
                  key={fm.id}
                  className="border border-jewel-400/20 rounded-lg p-3 flex items-center gap-3"
                >
                  <span className="font-semibold text-jewel-600">
                    {fm.family.name}
                  </span>
                  <span className="text-xs text-jewel-500">
                    {fm.role.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-jewel-400">
                    Joined: {new Date(fm.joinedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Activity/Notifications Card (placeholder) */}
      <section className="mt-8 card border-transparent p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span>Activity & Notifications</span>
          <span className="text-xs text-jewel-500">Recent</span>
        </h2>
        <div className="text-jewel-500 text-sm">No recent activity.</div>
      </section>
    </main>
  );
}
