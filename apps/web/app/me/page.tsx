"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Performs  me page operation.
 * @returns {React.JSX.Element} Description of return value
 * Me page — shows current user profile information.
 */
export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
          setUser(data.data);
        } else {
          // token invalid or expired
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

  if (loading)
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-gray-300" />
          <p className="text-sm text-gray-600">Loading your profile…</p>
        </div>
      </div>
    );

  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const familyName = user.families?.[0]?.family?.name || user.familyName || "—";

  return (
    <main className="max-w-3xl mx-auto mt-16 px-4">
      <section className="bg-white shadow-md rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-shrink-0 flex items-center justify-center h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold">
          {initials || "U"}
        </div>

        <div className="flex-1 w-full">
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-400">Role</div>
              <div className="font-medium">{user.role}</div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-400">Status</div>
              <div className="font-medium">
                {user.status ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-400">Family</div>
              <div className="font-medium">{familyName}</div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => router.push("/me/edit")}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Edit Profile
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/signin");
              }}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="bg-white shadow-sm rounded p-4">
          <h2 className="text-lg font-medium mb-2">About</h2>
          <p className="text-sm text-gray-600">
            Private profile information and family details are shown here. You
            can update these by editing your profile.
          </p>
        </div>
      </section>
    </main>
  );
}
