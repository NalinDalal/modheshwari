"use client";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  user: { id: string; name: string; email: string; status: boolean };
}

/**
 * Performs  family page operation.
 * @param {any} { searchParams } - Description of { searchParams }
 * @returns {React.JSX.Element} Description of return value
 */
export default function FamilyPage({ searchParams }: any) {
  const token = searchParams.token;
  const [members, setMembers] = useState<Member[]>([]);
  const [familyName, setFamilyName] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  async function fetchMembers(all = false) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL}/family/members${all ? "?all=true" : ""}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    setFamilyName(data.data.family.name);
    setMembers(data.data.members);
  }

  async function toggleStatus(memberId: string, isAlive: boolean) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL}/family/members/${memberId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: !isAlive }),
      },
    );
    const data = await res.json();
    if (data.status === "success") fetchMembers(showAll);
    else alert("Failed to update status");
  }

  useEffect(() => {
    fetchMembers(showAll);
  }, [showAll]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{familyName}</h1>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl">Family Members</h2>
        <label className="text-sm">
          <input
            type="checkbox"
            checked={showAll}
            onChange={() => setShowAll(!showAll)}
          />{" "}
          Show all (incl. dead)
        </label>
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <div
            key={m.id}
            className={`border p-3 rounded ${
              m.user.status ? "bg-white" : "bg-gray-100 opacity-70"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{m.user.name}</div>
                <div className="text-sm text-gray-600">{m.user.email}</div>
              </div>
              <button
                onClick={() => toggleStatus(m.user.id, m.user.status)}
                className={`px-3 py-1 rounded ${
                  m.user.status
                    ? "bg-red-600 text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                Mark {m.user.status ? "Dead" : "Alive"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
