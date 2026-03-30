"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import apiFetch from "../../../lib/api";
import { API_BASE } from "../../../lib/config";

type EventItem = {
  id: string;
  name: string;
  date: string;
  venue?: string;
  status: string;
  createdAt?: string;
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

  // use centralized API base
  const base = API_BASE;
  const router = useRouter();

  const lastItemsRef = React.useRef<string | null>(null);

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
        const json = await apiFetch(
          `${base}/events?status=APPROVED&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(
            end.toISOString(),
          )}&limit=500`,
          { throwOnError: false },
        );
        // Normalize response into an array. API may return { status, data: { data: [...] } } or pagination objects.
        let items: EventItem[] = [];
        if (json == null) {
          items = [];
        } else if (Array.isArray(json)) {
          items = json;
        } else if (Array.isArray(json.data)) {
          items = json.data;
        } else if (json.data && Array.isArray(json.data.data)) {
          items = json.data.data;
        } else if (json.ok === false && json.data) {
          items = Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.data.data)
              ? json.data.data
              : [];
        } else {
          items = [];
        }

        try {
          const ids = Array.isArray(items)
            ? items.map((it: EventItem) => it?.id ?? JSON.stringify(it))
            : [];
          const hash = JSON.stringify(ids);
          if (lastItemsRef.current !== hash) {
            setEvents(items);
            lastItemsRef.current = hash;
          }
        } catch {
          setEvents(items);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [base, current, monthEnd, monthStart]);

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
    days.push({
      date: new Date(current.getFullYear(), current.getMonth(), d),
      inMonth: true,
    });
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
  events.forEach((ev: EventItem) => {
    try {
      const dateStr = ev.date || ev.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr).toISOString().slice(0, 10);
      const arr = eventsByDay.get(d) || [];
      arr.push(ev);
      eventsByDay.set(d, arr);
    } catch {
      // skip invalid dates
    }
  });

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/50 p-6 md:p-8 shadow-xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <CalIcon className="w-6 h-6 text-rose-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  Events Calendar
                </h1>
                <p className="text-sm text-gray-600">
                  Browse upcoming community events by date
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label="Previous month"
                onClick={() =>
                  setCurrent(
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-900" />
              </button>

              <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-900">
                {current.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <button
                aria-label="Next month"
                onClick={() =>
                  setCurrent(
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-900" />
              </button>
            </div>
          </div>

          <div className="lg:flex lg:gap-6">
            {/* Calendar + Headers together */}
            <div className="flex-1 min-w-0">
              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-2 text-xs font-semibold tracking-wide text-gray-600 mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2 auto-rows-[92px]">
                {days.map((dayObj, idx) => {
                  const key = dayObj.date.toISOString().slice(0, 10);
                  const dayEvents = eventsByDay.get(key) || [];

                  const isSelected =
                    selectedDate &&
                    selectedDate.toISOString().slice(0, 10) === key;

                  const todayKey = new Date().toISOString().slice(0, 10);
                  const isToday = key === todayKey;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDate(new Date(dayObj.date))}
                      className={`relative w-full h-full text-left rounded-xl border transition
                        ${
                          dayObj.inMonth
                            ? "aspect-square bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm flex flex-col"
                            : "bg-gray-50 border-gray-100 text-gray-400"
                        }
                        ${isSelected ? "ring-2 ring-rose-400 border-rose-200 bg-rose-50" : ""}
                      `}
                    >
                      {/* Day number (top-right) */}
                      <div className="absolute top-2 right-2">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold
                            ${
                              isToday
                                ? "bg-rose-600 text-white"
                                : dayObj.inMonth
                                  ? "text-gray-900"
                                  : "text-gray-400"
                            }
                          `}
                        >
                          {dayObj.date.getDate()}
                        </div>
                      </div>

                      {/* Events count pill */}
                      {dayEvents.length > 0 && (
                        <div className="absolute top-2 left-2">
                          <div className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            {dayEvents.length} event
                            {dayEvents.length > 1 ? "s" : ""}
                          </div>
                        </div>
                      )}

                      {/* Event preview (bottom) */}
                      <div className="absolute left-2 right-2 bottom-2 space-y-1">
                        {dayEvents.slice(0, 1).map((ev: EventItem) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/events/${ev.id}`);
                            }}
                            title={ev.name}
                            className="text-xs px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-900 hover:bg-gray-100 truncate"
                          >
                            {ev.name}
                          </div>
                        ))}

                        <div className="mt-auto space-y-1">
                          {dayEvents.length > 1 && (
                            <div className="text-[11px] text-gray-500">
                              +{dayEvents.length - 1} more
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="mt-4 lg:mt-0 lg:w-80 lg:flex-shrink-0">
              <div className="rounded-2xl bg-white/90 border border-gray-200 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedDate
                      ? selectedDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Upcoming events"}
                  </h3>

                  <button
                    onClick={() => router.push("/events")}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-auto">
                  {(selectedDate
                    ? eventsByDay.get(
                        selectedDate.toISOString().slice(0, 10),
                      ) || []
                    : events.slice(0, 50)
                  ).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {ev.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(ev.date).toLocaleString()}
                        </div>
                        {ev.venue && (
                          <div className="text-xs text-gray-600">
                            {ev.venue}
                          </div>
                        )}
                      </div>

                      <div className="ml-3 flex-shrink-0">
                        <button
                          onClick={() => router.push(`/events/${ev.id}`)}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedDate &&
                    (
                      eventsByDay.get(
                        selectedDate.toISOString().slice(0, 10),
                      ) || []
                    ).length === 0 && (
                      <div className="text-sm text-gray-600">
                        No events on this day
                      </div>
                    )}
                </div>
              </div>
            </aside>
          </div>

          {loading && (
            <div className="mt-4 text-sm text-gray-600">Loading events...</div>
          )}
        </div>
      </div>
    </DreamySunsetBackground>
  );
}
