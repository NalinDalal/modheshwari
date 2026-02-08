"use client";

import React, { useState } from "react";
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

const CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const ROLES = ["COMMUNITY_HEAD","COMMUNITY_SUBHEAD","GOTRA_HEAD","FAMILY_HEAD","MEMBER"] as const;

/**
 * Performs  admin notifications operation.
 * @returns {any} Description of return value
 */
export default function AdminNotifications() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["IN_APP"]);
  const [priority, setPriority] = useState<string>("normal");
  const [targetRole, setTargetRole] = useState<string | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message, subject, channels: selectedChannels, priority, targetRole }),
      });
      const json = await res.json();
      setResult(json);
      if (res.ok) {
        setMessage("");
        setSubject("");
      }
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-3xl mx-auto bg-[#0e1320]/60 p-6 rounded">
        <h1 className="text-xl font-bold mb-4">Compose Notification</h1>

        <div className="mb-3">
          <label className="text-sm text-gray-400">Subject (optional)</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full mt-1 p-2 rounded bg-black/20" />
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-400">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full mt-1 p-2 rounded bg-black/20" />
        </div>

        <div className="mb-3 flex gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Channels</div>
            <div className="flex gap-2">
              {CHANNELS.map((ch) => (
                <label key={ch} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={selectedChannels.includes(ch)} onChange={() => toggleChannel(ch)} />
                  <span className="text-sm">{ch}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Priority</div>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-2 rounded bg-black/20">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Target Role (optional)</div>
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value || undefined)} className="p-2 rounded bg-black/20">
              <option value="">All (scope applies)</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setPreviewOpen(true)} className="px-4 py-2 bg-white/5 rounded">Preview</button>
          <button onClick={send} disabled={sending || !message.trim()} className="px-4 py-2 bg-blue-600 text-white rounded">{sending ? 'Sending...' : 'Send'}</button>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-white/5 rounded">
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {previewOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-[#0b1220] p-6 rounded w-[min(800px,95%)]">
              <h2 className="text-lg font-semibold mb-2">Preview</h2>
              {subject && <div className="font-bold mb-1">{subject}</div>}
              <div className="mb-4">{message}</div>
              <div className="text-sm text-gray-400 mb-4">Channels: {selectedChannels.join(', ')} • Priority: {priority}</div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setPreviewOpen(false)} className="px-3 py-2 bg-white/5 rounded">Close</button>
                <button onClick={() => { setPreviewOpen(false); send(); }} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DreamySunsetBackground>
  );
}
