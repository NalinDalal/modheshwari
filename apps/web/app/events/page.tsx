import EventsListClient from "./EventsListClient";

// Server component: fetch initial events for the current month (approved) and
// pass as initial data to the client component which will use SWR for caching.
export default async function EventsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  // Fetch approved events as initial payload. Keep response shape similar to
  // the client-side API (pagination wrapper) so SWR can directly use it as fallback.
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEndDate.setHours(23, 59, 59, 999);
    const monthEnd = monthEndDate.toISOString();

    const res = await fetch(
      `${API_BASE}/events?status=APPROVED&startDate=${encodeURIComponent(monthStart)}&endDate=${encodeURIComponent(monthEnd)}&limit=500`,
      { next: { revalidate: 60 } },
    );

    const json = res.ok ? await res.json() : null;
    const initialData = json?.data?.data || json?.data || [];

    return <EventsListClient initialData={initialData} />;
  } catch (err) {
    // On server error, render client with empty initial data — client will retry via SWR.
    return <EventsListClient initialData={[]} />;
  }
}
