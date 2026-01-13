"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    bloodGroup: "",
    gotra: "",
    profession: "",
  });

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
    }
  };

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
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition shadow-sm"
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={() => router.push("/me")}
            className="px-5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
