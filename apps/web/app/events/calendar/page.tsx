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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
    } catch (_err) {
      void _err;
    }
  });

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[28px] bg-black/35 backdrop-blur-2xl border border-white/10 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalIcon className="w-6 h-6 text-rose-400" />
            <div>
              <h1 className="text-3xl font-extrabold">Events Calendar</h1>
              <p className="text-sm muted">Browse upcoming community events by date</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="p-2 bg-white/5 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 bg-white/5 rounded font-medium">{current.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="p-2 bg-white/5 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

          <div className="grid grid-cols-7 gap-2 text-[11px] font-semibold tracking-wide text-white/50 mb-3">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="text-center">{d}</div>)}
          </div>

        <div className="lg:flex lg:gap-6">
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-2">
              {days.map((dayObj, idx) => {
                const key = dayObj.date.toISOString().slice(0,10);
                const dayEvents = eventsByDay.get(key) || [];
                const isSelected = selectedDate && selectedDate.toISOString().slice(0,10) === key;
                const todayKey = new Date().toISOString().slice(0,10);
                const isToday = key === todayKey;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(new Date(dayObj.date))}
                    role="button"
                    className={
                      `
                      min-h-[92px] p-3 rounded-2xl border cursor-pointer transition
                      ${dayObj.inMonth
                        ? "bg-white/6 border-white/10 hover:bg-white/10"
                        : "bg-white/0 border-white/0 text-white/25"}
                      ${isSelected ? "ring-2 ring-rose-400/40 bg-white/10" : ""}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm font-semibold ${isToday ? "text-rose-200" : "text-white"}`}>
                        {dayObj.date.getDate()}
                      </div>
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0,3).map((ev: any) => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); router.push(`/events/${ev.id}`); }}
                          role="button"
                          className={"text-[11px] px-2 py-1 rounded-lg bg-white/8 border border-white/10 text-white/80 hover:bg-white/12 truncate"}
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
          </div>

          {/* Sidebar / selected-day list */}
          <aside className="mt-4 lg:mt-0 lg:w-80">
            <div className="rounded-3xl bg-white/6 border border-white/10 backdrop-blur-xl p-5">
              <h3 className="text-sm font-semibold mb-2">{selectedDate ? selectedDate.toLocaleDateString() : 'Upcoming events'}</h3>
              <div className="space-y-3 max-h-[60vh] overflow-auto">
                {(selectedDate
                  ? (eventsByDay.get(selectedDate.toISOString().slice(0,10)) || [])
                  : events.slice(0, 50)
                ).map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg bg-white/4 border border-white/6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{ev.name}</div>
                        <div className="text-xs muted">{new Date(ev.date).toLocaleString()}</div>
                        {ev.venue && <div className="text-xs muted">{ev.venue}</div>}
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <button onClick={() => router.push(`/events/${ev.id}`)} className="px-3 py-1 rounded bg-rose-500 text-white text-sm">Open</button>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedDate && (eventsByDay.get(selectedDate.toISOString().slice(0,10)) || []).length === 0 && (
                  <div className="text-sm muted">No events on this day</div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {loading && <div className="mt-4 text-sm text-gray-400">Loading events...</div>}
      </div>
</div>    </DreamySunsetBackground>
  );
}
