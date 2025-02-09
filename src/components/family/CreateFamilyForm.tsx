// components/family/CreateFamilyForm.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@clerk/nextjs";

interface CreateFamilyFormData {
  name: string;
  description?: string;
  gotraId?: number;
  address?: string;
}

export function CreateFamilyForm() {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFamilyFormData>();

  const onSubmit = async (data: CreateFamilyFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, headId: user?.id }),
      });

      if (!response.ok) throw new Error("Failed to create family");

      // Redirect to new family page
      const family = await response.json();
      window.location.href = `/family/${family.id}`;
    } catch (error) {
      console.error("Error creating family:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Family Name
        </label>
        <input
          type="text"
          {...register("name", { required: "Family name is required" })}
          className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register("description")}
          rows={3}
          className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Family Address
        </label>
        <textarea
          {...register("address")}
          rows={3}
          className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex justify-center py-2 px-4 w-full text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        {isSubmitting ? "Creating..." : "Create Family"}
      </button>
    </form>
  );
}

// components/family/JoinFamilyForm.tsx
export function JoinFamilyForm() {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ familyId: string }>();

  const onSubmit = async (data: { familyId: string }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: data.familyId, userId: user?.id }),
      });

      if (!response.ok) throw new Error("Failed to join family");

      // Redirect to family page
      window.location.href = `/family/${data.familyId}`;
    } catch (error) {
      console.error("Error joining family:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Family ID
        </label>
        <input
          type="text"
          {...register("familyId", { required: "Family ID is required" })}
          className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.familyId && (
          <p className="mt-1 text-sm text-red-600">{errors.familyId.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex justify-center py-2 px-4 w-full text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        {isSubmitting ? "Joining..." : "Join Family"}
      </button>
    </form>
  );
}
