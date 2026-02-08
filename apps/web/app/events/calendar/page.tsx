"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

type EventItem = {
  id: string;
  name: string;
  date: string;
  venue?: string;
  status: string;
};

/**
 * Performs start of month operation.
 * @param {Date} d - Description of d
 * @returns {Date} Description of return value
 */
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Performs end of month operation.
 * @param {Date} d - Description of d
 * @returns {Date} Description of return value
 */
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Performs  events calendar operation.
 * @returns {any} Description of return value
 */
export default function EventsCalendar() {
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  const router = useRouter();

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // fetch approved events for current month (server-side range)
        const start = new Date(monthStart).toISOString();
        const end = new Date(monthEnd);
        // set end to end of day
        end.setHours(23, 59, 59, 999);
        const res = await fetch(
          `${API_BASE}/events?status=APPROVED&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(
            end.toISOString(),
          )}&limit=500`,
        );
        if (!res.ok) throw new Error("Failed to fetch events");
        const json = await res.json();
        const items = json.data?.data || json.data || [];
        setEvents(items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API_BASE, monthStart, monthEnd]);

  

  // Build calendar days (Sun-Sat) for display including leading/trailing days
  const firstDayIndex = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const days: Array<{ date: Date; inMonth: boolean }> = [];

  // previous month's tail
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (i + 1));
    days.push({ date: d, inMonth: false });
  }

  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(current.getFullYear(), current.getMonth(), d), inMonth: true });
  }

  // next month's head to complete weeks
  while (days.length % 7 !== 0) {
  const lastDay = days.at(-1);
  if (!lastDay) break; // safety for TS

  const nd = new Date(lastDay.date);
  nd.setDate(nd.getDate() + 1);
  days.push({ date: nd, inMonth: false });
}


  const eventsByDay = new Map<string, EventItem[]>();
  events.forEach((ev: any) => {
    try {
      const d = new Date(ev.date || ev.createdAt).toISOString().slice(0, 10);
      const arr = eventsByDay.get(d) || [];
      arr.push(ev);
      eventsByDay.set(d, arr);
    } catch (_) {}
  });

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalIcon className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Events Calendar</h1>
              <p className="text-sm text-gray-400">Browse upcoming community events by date</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="p-2 bg-white/5 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 bg-white/5 rounded">{current.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="p-2 bg-white/5 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs text-gray-400 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="text-center">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((dayObj, idx) => {
            const key = dayObj.date.toISOString().slice(0,10);
            const dayEvents = eventsByDay.get(key) || [];
            return (
              <div key={idx} className={`min-h-[90px] p-2 rounded-lg border ${dayObj.inMonth ? 'bg-white/3 border-white/5' : 'bg-transparent border-transparent text-gray-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">{dayObj.date.getDate()}</div>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0,3).map((ev: any) => (
                    <div
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      role="button"
                      className="text-xs bg-blue-700/20 text-blue-200 px-2 py-1 rounded cursor-pointer hover:bg-blue-700/30"
                    >
                      {ev.name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-xs text-gray-400">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>

        {loading && <div className="mt-4 text-sm text-gray-400">Loading events...</div>}
      </div>
    </DreamySunsetBackground>
  );
}
