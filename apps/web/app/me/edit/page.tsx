"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderFour } from "@repo/ui/loading";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { useToast } from "@repo/ui/toast";

import { API_BASE } from "../../../lib/config";

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

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: "",
    gotra: "",
    profession: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast("You need to sign in first.", { variant: "warning" });
      router.push("/signin");
      return;
    }

    async function loadUserProfile() {
      try {
        const res = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (data.status === "success") {
          const user = data.data as User;
          setFormData({
            bloodGroup: user.profile?.bloodGroup || "",
            gotra: user.profile?.gotra || "",
            profession: user.profile?.profession || "",
          });
        } else {
          toast("Auth expired, please log in again", { variant: "warning" });
          localStorage.removeItem("token");
          router.push("/signin");
        }
      } catch (err) {
        console.error("Failed to fetch /me", err);
        toast("Failed to fetch user info", { variant: "error" });
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast("You need to sign in first.", { variant: "warning" });
      router.push("/signin");
      return;
    }

    if (!formData.bloodGroup && !formData.gotra && !formData.profession) {
      toast("Please fill in at least one field.", { variant: "warning" });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.status === "success") {
        toast("Profile updated successfully.", { variant: "success" });
        router.push("/me");
      } else {
        toast(data.message || "Failed to update profile.", { variant: "error" });
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      toast("An error occurred while updating your profile.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DreamySunsetBackground className="flex items-center justify-center min-h-screen">
        <LoaderFour text="Loading your profile..." />
      </DreamySunsetBackground>
    );
  }

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-jewel-50/80 backdrop-blur-xl border border-jewel-400/20 shadow-jewel rounded-2xl p-8"
        >
          <h1 className="text-2xl font-display font-bold text-jewel-900 mb-6">
            Edit Profile
          </h1>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="bloodGroup" className="block text-sm font-medium text-jewel-700">
                Blood Group
              </label>
              <input
                type="text"
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                placeholder="e.g., O+, A-, AB+"
                className="mt-1 block w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="gotra" className="block text-sm font-medium text-jewel-700">
                Gotra
              </label>
              <input
                type="text"
                id="gotra"
                name="gotra"
                value={formData.gotra}
                onChange={handleChange}
                placeholder="Enter your gotra"
                className="mt-1 block w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-jewel-700">
                Profession
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                placeholder="e.g., Software Engineer"
                className="mt-1 block w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/me")}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DreamySunsetBackground>
  );
}
