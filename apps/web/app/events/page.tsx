import EventsListClient from "./EventsListClient";

/**
 * Performs  events page operation.
 * @returns {Promise<React.JSX.Element>} Description of return value
 */
export default async function EventsPage() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEndDate.setHours(23, 59, 59, 999);
    const monthEnd = monthEndDate.toISOString();

    const res = await fetch(
      `/api/events?status=APPROVED&startDate=${encodeURIComponent(monthStart)}&endDate=${encodeURIComponent(monthEnd)}&limit=500`,
      { next: { revalidate: 60 } },
    );

    const json = res.ok ? await res.json() : null;
    const initialData = json?.data?.data || json?.data || [];

    return <EventsListClient initialData={initialData} />;
  } catch (_err) {
    // On server error, render client with empty initial data — client will retry via SWR.
    void _err;
    return <EventsListClient initialData={[]} />;
  }
}
