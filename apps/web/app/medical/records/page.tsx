"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type MedicalRecord = {
  id: string;
  userId: string;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  notes?: string;
  createdAt: string;
};

type FormState = {
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  bloodType: "",
  allergies: "",
  conditions: "",
  medications: "",
  notes: "",
};

/**
 * Performs  medical records page operation.
 * @returns {any} Description of return value
 */
export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const hasAnyFormValue = useMemo(() => {
    return Object.values(form).some((v) => v.trim().length > 0);
  }, [form]);

  const loadRecords = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/medical-records");
      if (!res.ok) throw new Error("Failed to load records");

      const json = await res.json();
      setRecords(json.data?.items ?? []);
    } catch (e) {
      console.error(e);
      setError("Could not load medical records.");
    } finally {
      setLoading(false);
    }
  }, []);

 
useEffect(() => {
    void loadRecords();
  }, [loadRecords]);


  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error("Failed to create record");
      } 

      setForm(EMPTY_FORM);
      await loadRecords();
    } catch (e) {
      console.error(e);
      setError("Could not create record.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Medical Records</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-8 space-y-4">
        <Field label="Blood Type">
          <input
            value={form.bloodType}
            onChange={(e) => updateField("bloodType", e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="e.g. O+"
          />
        </Field>

        <Field label="Allergies">
          <input
            value={form.allergies}
            onChange={(e) => updateField("allergies", e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="e.g. peanuts, dust"
          />
        </Field>

        <Field label="Conditions">
          <input
            value={form.conditions}
            onChange={(e) => updateField("conditions", e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="e.g. asthma"
          />
        </Field>

        <Field label="Medications">
          <input
            value={form.medications}
            onChange={(e) => updateField("medications", e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="e.g. cetirizine"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="w-full rounded-md border px-3 py-2 min-h-[100px]"
            placeholder="Anything important..."
          />
        </Field>

        <button
          type="submit"
          disabled={submitting || !hasAnyFormValue}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </form>

      <h2 className="text-lg font-semibold mb-3">Your Records</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-500">No records yet.</p>
      ) : (
        <ul className="space-y-4">
          {records.map((r) => (
            <li key={r.id} className="rounded-lg border p-4">
              <Row label="Blood" value={r.bloodType} />
              <Row label="Allergies" value={r.allergies} />
              <Row label="Conditions" value={r.conditions} />
              <Row label="Medications" value={r.medications} />
              {r.notes && <Row label="Notes" value={r.notes} />}

              <div className="mt-3 text-xs text-gray-500">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold">{label}:</span>{" "}
      <span className="text-gray-700">{value?.trim() || "—"}</span>
    </div>
  );
}







