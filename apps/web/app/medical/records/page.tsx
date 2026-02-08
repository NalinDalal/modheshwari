"use client";

import React, { useEffect, useState } from "react";

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

/**
 * Performs  medical records page operation.
 * @returns {any} Description of return value
 */
export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ bloodType: "", allergies: "", conditions: "", medications: "", notes: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/medical-records");
      const json = await res.json();
      setRecords(json.data?.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ bloodType: "", allergies: "", conditions: "", medications: "", notes: "" });
        load();
      } else {
        console.error("Failed to create");
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Medical Records</h1>

      <form onSubmit={handleCreate} className="mb-6">
        <div>
          <label>Blood Type</label>
          <input value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} />
        </div>
        <div>
          <label>Allergies</label>
          <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
        </div>
        <div>
          <label>Conditions</label>
          <input value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
        </div>
        <div>
          <label>Medications</label>
          <input value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} />
        </div>
        <div>
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="submit">Create</button>
      </form>

      <h2 className="text-lg font-semibold">Your Records</h2>
      {loading ? <p>Loading...</p> : (
        <ul>
          {records.map((r) => (
            <li key={r.id} className="mb-3">
              <div><strong>Blood:</strong> {r.bloodType}</div>
              <div><strong>Allergies:</strong> {r.allergies}</div>
              <div><strong>Conditions:</strong> {r.conditions}</div>
              <div><strong>Medications:</strong> {r.medications}</div>
              <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
