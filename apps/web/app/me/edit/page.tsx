"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderFour } from "@repo/ui/loading";
/**
 * Performs  edit profile page operation.
 * @returns {React.JSX.Element} Description of return value
 */

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

interface User {
  id: string;
  name: string;
  email: string;
  profile: Profile | null;
}

/**
 * Performs  edit profile page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: "",
    gotra: "",
    profession: "",
  });

  // Fetch current user data on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to sign in first.");
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
          const user = data.data as User;

          // Pre-populate form with existing data
          setFormData({
            bloodGroup: user.profile?.bloodGroup || "",
            gotra: user.profile?.gotra || "",
            profession: user.profile?.profession || "",
          });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to sign in first.");
      router.push("/signin");
      return;
    }

    // Check if at least one field has a value
    if (!formData.bloodGroup && !formData.gotra && !formData.profession) {
      alert("Please fill in at least one field.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await res.json();
      if (data.status === "success") {
        alert("Profile updated successfully.");
        router.push("/me");
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("An error occurred while updating your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderFour text="Loading your profile..." />
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-12">
      <form
        onSubmit={handleSubmit}
        className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/40 rounded-2xl p-8"
      >
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
          Edit Profile
        </h1>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label
              htmlFor="bloodGroup"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Blood Group
            </label>
            <input
              type="text"
              id="bloodGroup"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              placeholder="e.g., O+, A-, AB+"
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="gotra"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Gotra
            </label>
            <input
              type="text"
              id="gotra"
              name="gotra"
              value={formData.gotra}
              onChange={handleChange}
              placeholder="Enter your gotra"
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="profession"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Profession
            </label>
            <input
              type="text"
              id="profession"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              placeholder="e.g., Software Engineer"
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/me")}
            disabled={saving}
            className="px-5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
