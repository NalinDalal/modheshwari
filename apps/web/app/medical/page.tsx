/*page to check if user logged in, if logged in then we can biasically fetch
 * other users for medical emergency
 * fetch users based on role, then fetch medical history
 * user can search for other users
 */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  // add more fields as needed
}

/**
 * Page to check if user is logged in.
 * If logged in, fetch other users for medical emergency.
 * Fetch users based on role, then fetch medical history.
 * User can search for other users.
 */
export default function Medical() {
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

  // 🩺 Render section
  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No user data available</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Medical Dashboard</h1>
      <p>Welcome, {user.name}</p>
      {/* add your medical list / emergency search here */}
    </div>
  );
}
