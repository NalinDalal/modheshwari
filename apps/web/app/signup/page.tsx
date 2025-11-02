"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    familyName: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL}/signup/familyhead`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      alert("Signup successful! Please sign in.");
      router.push("/signin");
    } else alert("Signup failed: " + data.message);
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">Family Head Signup</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="border p-2 w-full rounded"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="Family Name"
          value={form.familyName}
          onChange={(e) => setForm({ ...form, familyName: e.target.value })}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Sign Up
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        Already have an account?{" "}
        <a href="/signin" className="text-blue-600 hover:underline">
          Sign In
        </a>
      </p>
    </div>
  );
}
