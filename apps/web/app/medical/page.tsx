/* 
  Page to check if user is logged in. If logged in, fetch other users for medical emergency.
  - Fetch users based on role, then fetch medical history
  - User can search for other users
  - Fetches medical info for self or other users
  - Allows search by blood group
*/

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
}

interface MedicalInfo {
  userId: string;
  name: string;
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
}

/**
 * Medical Dashboard page.
 * - Shows logged-in user info
 * - Allows searching other users by blood group
 * - Displays medical info in a table
 */
export default function Medical() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [medicalList, setMedicalList] = useState<MedicalInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // --- Fetch logged-in user info ---
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

  // --- Fetch medical info based on blood group search ---
  async function fetchMedicalInfo(query: string) {
    if (!query.trim()) {
      setMedicalList([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setSearchLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/search?bloodGroup=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.status === "success") {
        setMedicalList(data.data);
      } else {
        setMedicalList([]);
        console.warn("No medical info found");
      }
    } catch (err) {
      console.error("Failed to fetch medical info:", err);
      setMedicalList([]);
    } finally {
      setSearchLoading(false);
    }
  }

  // --- Render ---
  if (loading) return <p>Loading user info...</p>;
  if (!user) return <p>No user data available</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f17] to-black text-white px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Medical Dashboard</h1>
        <p className="text-sm text-gray-400">Welcome back, {user.name}</p>
      </div>

      {/* Search Card */}
      <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-5 mb-8">
        <label className="block text-sm text-gray-400 mb-2">
          Search by blood group
        </label>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. O+, AB-"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchMedicalInfo(searchQuery);
            }}
            className="flex-grow bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => fetchMedicalInfo(searchQuery)}
            disabled={searchLoading}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
        {medicalList.length === 0 ? (
          <div className="text-center text-gray-500 py-10 text-sm">
            No medical records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/40 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Blood Group
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Allergies</th>
                  <th className="px-4 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>

              <tbody>
                {medicalList.map((m) => (
                  <tr
                    key={m.userId}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs">
                        {m.bloodGroup || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {m.allergies || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {m.medicalNotes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
