"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="p-3 border rounded-lg">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="font-medium">{value}</div>
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
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    async function fetchMe() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await res.json();
        if (data.status === "success") {
          setUser(data.data as User);
        } else {
          alert("Auth expired, please log in again");
          localStorage.removeItem("token");
          router.push("/signin");
        }
      } catch (err) {
        console.error("Failed to fetch /me", err);
        alert("Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
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

  const primaryFamily = user.families[0];

  return (
    <main className="max-w-3xl mx-auto px-4 pb-12">
      {/* Profile Card */}
      <section className="bg-white dark:bg-neutral-900 border rounded-2xl p-8 flex gap-6 items-center">
        <div className="h-24 w-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
          {initials}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Meta label="Role" value={user.role} />
            <Meta label="Status" value={user.status ? "Active" : "Inactive"} />
            <Meta label="Family" value={primaryFamily?.family.name ?? "—"} />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/me/edit")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg"
            >
              Edit profile
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/signin");
              }}
              className="px-5 py-2 border rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {/* Profile Details */}
      {user.profile && (
        <section className="mt-6 bg-white dark:bg-neutral-900 border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4">Personal Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <ProfileField label="Profession" value={user.profile.profession} />
            <ProfileField label="Gotra" value={user.profile.gotra} />
            <ProfileField label="Blood Group" value={user.profile.bloodGroup} />
            <ProfileField label="Location" value={user.profile.location} />
          </div>
        </section>
      )}
    </main>
  );
}
