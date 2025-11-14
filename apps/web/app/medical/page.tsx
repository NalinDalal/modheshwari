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
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Medical Dashboard</h1>
      <p className="mb-4">Welcome, {user.name}</p>

      {/* --- Search Section --- */}
      <div className="my-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by blood group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchMedicalInfo(searchQuery);
          }}
          className="border px-2 py-1 rounded flex-grow"
        />
        <button
          onClick={() => fetchMedicalInfo(searchQuery)}
          className="bg-blue-500 text-white px-4 py-1 rounded"
          disabled={searchLoading}
        >
          {searchLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* --- Medical Info Table --- */}
      {medicalList.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Blood Group</th>
                <th className="border px-2 py-1">Allergies</th>
                <th className="border px-2 py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {medicalList.map((m) => (
                <tr key={m.userId} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{m.name}</td>
                  <td className="border px-2 py-1">{m.bloodGroup || "-"}</td>
                  <td className="border px-2 py-1">{m.allergies || "-"}</td>
                  <td className="border px-2 py-1">{m.medicalNotes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
