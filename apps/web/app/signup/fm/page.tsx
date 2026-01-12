"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";

/**
 * Performs  member signup page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MemberSignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    familyId: "",
    relationWithFamilyHead: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/signup/member`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();

      if (data.status === "success") {
        setSubmitted(true);
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-black via-[#0b0f17] to-black text-white">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
          {submitted ? (
            <SuccessState />
          ) : (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                  Join a Family
                </h1>
                <p className="text-sm text-gray-400 mt-2">
                  Your request will be sent to the family head for approval
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />

                <Input
                  label="Family ID"
                  placeholder="Provided by family head"
                  value={form.familyId}
                  onChange={(e) =>
                    setForm({ ...form, familyId: e.target.value })
                  }
                />

                <Input
                  label="Relation (optional)"
                  placeholder="Son, Daughter, Relative…"
                  value={form.relationWithFamilyHead}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      relationWithFamilyHead: e.target.value,
                    })
                  }
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4"
                >
                  {loading ? "Submitting Request…" : "Request to Join"}
                </Button>
              </form>

              {/* Footer */}
              <p className="text-xs text-gray-500 text-center mt-6">
                Already approved?{" "}
                <a href="/signin" className="text-blue-400 hover:underline">
                  Sign in
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- */

/**
 * Performs  input operation.
 * @param {{ label: string; } & React.InputHTMLAttributes<HTMLInputElement>} {
 *   label,
 *   ...props
 * } - Description of {
 *   label,
 *   ...props
 * }
 * @returns {React.JSX.Element} Description of return value
 */
function Input({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        {...props}
        required={props.required !== false}
        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/**
 * Performs  success state operation.
 * @returns {React.JSX.Element} Description of return value
 */
function SuccessState() {
  return (
    <div className="py-14 text-center">
      <div className="text-green-400 text-4xl mb-4">✓</div>
      <h2 className="text-2xl font-semibold">Request Sent</h2>
      <p className="text-sm text-gray-400 mt-2">
        The family head will review your request.
        <br />
        You’ll be able to sign in once approved.
      </p>
    </div>
  );
}
