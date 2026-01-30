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
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Profile {
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
}

interface MedicalInfo {
  userId: string;
  name: string;
  email: string;
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
}

// Blood group mapping for display and search
const BLOOD_GROUP_MAP: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
};

const REVERSE_BLOOD_GROUP_MAP: Record<string, string> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
};

/**
 * Medical Dashboard page.
 * - Shows logged-in user's medical info
 * - Allows searching other users by blood group
 * - Displays medical info in a table
 */
export default function Medical() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
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
          setMyProfile(data.data.profile || null);
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

  // --- Convert user input to enum format ---
  function convertToEnumFormat(input: string): string {
    const normalized = input.trim().toUpperCase();
    return REVERSE_BLOOD_GROUP_MAP[normalized] || input;
  }

  // --- Convert enum to display format ---
  function formatBloodGroup(enumValue: string | undefined): string {
    if (!enumValue) return "-";
    return BLOOD_GROUP_MAP[enumValue] || enumValue;
  }

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
      // Convert user-friendly format to enum format
      const enumFormat = convertToEnumFormat(query);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/medical/search?bloodGroup=${encodeURIComponent(enumFormat)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.status === "success") {
        setMedicalList(data.data || []);
      } else {
        setMedicalList([]);
        alert(data.message || "No users found");
      }
    } catch (err) {
      console.error("Failed to fetch medical info:", err);
      setMedicalList([]);
      alert("Failed to search medical records");
    } finally {
      setSearchLoading(false);
    }
  }

  // --- Render ---
  if (loading) {
    return (
      <DreamySunsetBackground>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading user info...</p>
        </div>
      </DreamySunsetBackground>
    );
  }

  if (!user) {
    return (
      <DreamySunsetBackground>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">No user data available</p>
        </div>
      </DreamySunsetBackground>
    );
  }

  return (
    <DreamySunsetBackground>
      <div className="min-h-screen px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-gray-900">Medical Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
        </div>

        {/* My Medical Info Card */}
        <div className="bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-xl p-5 mb-8 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">My Medical Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Blood Group</p>
              <p className="text-sm font-medium text-gray-900">
                {formatBloodGroup(myProfile?.bloodGroup)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Allergies</p>
              <p className="text-sm font-medium text-gray-900">
                {myProfile?.allergies || "None recorded"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Medical Notes</p>
              <p className="text-sm font-medium text-gray-900">
                {myProfile?.medicalNotes || "None recorded"}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 transition font-medium"
          >
            Update Medical Info →
          </button>
        </div>

        {/* Search Card */}
        <div className="bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-xl p-5 mb-8 shadow-lg">
          <label className="block text-sm text-gray-700 font-medium mb-2">
            Search users by blood group
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Enter blood group (e.g., O+, AB-, B+)
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. O+, AB-, B+"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchMedicalInfo(searchQuery);
              }}
              className="flex-grow bg-white/80 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />

            <button
              onClick={() => fetchMedicalInfo(searchQuery)}
              disabled={searchLoading || !searchQuery.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Quick Search Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.keys(REVERSE_BLOOD_GROUP_MAP).map((bg) => (
              <button
                key={bg}
                onClick={() => {
                  setSearchQuery(bg);
                  fetchMedicalInfo(bg);
                }}
                className="px-3 py-1 text-xs rounded-full bg-white/80 hover:bg-white border border-gray-300 transition text-gray-700"
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results
              {medicalList.length > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  ({medicalList.length} users)
                </span>
              )}
            </h2>
          </div>

          {medicalList.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">
              {searchQuery
                ? "No users found with this blood group"
                : "Enter a blood group to search"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100/80 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
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
                      className="border-t border-gray-200 hover:bg-white/50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                      <td className="px-4 py-3 text-gray-600">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                          {formatBloodGroup(m.bloodGroup)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {m.allergies || "None"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {m.medicalNotes || "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DreamySunsetBackground>
  );
}