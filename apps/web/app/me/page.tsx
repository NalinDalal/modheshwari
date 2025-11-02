"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Performs  me page operation.
 * @returns {React.JSX.Element} Description of return value
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
        console.error(err);
        alert("Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [router]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">Welcome, {user.name}</h1>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.role}
      </p>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/signin");
        }}
        className="bg-red-600 text-white px-4 py-2 mt-4 rounded w-full"
      >
        Log Out
      </button>
    </div>
  );
}
