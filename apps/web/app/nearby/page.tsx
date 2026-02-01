"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderFour } from "@repo/ui/loading";

interface NearbyUser {
  id: string;
  name: string;
  phone: string | null;
  locationLat: number | null;
  locationLng: number | null;
  distanceKm: number;
}

//Helper function
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export default function NearbyPage() {
  const router = useRouter();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    async function fetchNearby() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"
          }/users/nearby?radiusKm=${radiusKm}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await res.json();

        if (data.status === "success") {
          setUsers(data.data as NearbyUser[]);
        } else {
          throw new Error(data.error || "Failed to fetch nearby users");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNearby();
  }, [radiusKm, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderFour text="Finding nearby members..." />
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-12">
      {/* Header */}
      <section className="bg-white dark:bg-neutral-900 border rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Nearby Members</h1>
        <p className="text-sm text-neutral-500 mt-1">
          People around you based on location
        </p>

        {/* Radius Control */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-500">Search radius</span>
            <span className="font-medium">{radiusKm} km</span>
          </div>

          <input
            type="range"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </section>

      {/* Error */}
      {error && (
        <section className="mt-6 border border-red-300 bg-red-50 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </section>
      )}

      {/* Empty */}
      {!error && users.length === 0 && (
        <section className="mt-6 border rounded-xl p-6 text-sm text-neutral-500 bg-white dark:bg-neutral-900">
          No nearby members found.
        </section>
      )}

      {/* List */}
      <section className="mt-6 space-y-4">
        {users.map((u) => {
          const initials = u.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <div
              key={u.id}
              className="bg-white dark:bg-neutral-900 border rounded-2xl p-6 flex gap-4 items-center"
            >
              {/* Avatar */}
              <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="font-semibold">{u.name}</h2>

                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <Meta label="Distance" value={`${u.distanceKm} km`} />
                  {u.phone && <Meta label="Phone" value={u.phone} />}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
