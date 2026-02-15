import elasticClient from "./elastic";

export async function indexUser(user: any) {
  if (!user || !user.id) return;
  try {
    await elasticClient.index({
      index: "users",
      id: user.id,
      body: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: {
          gotra: user.profile?.gotra,
          profession: user.profile?.profession,
          bloodGroup: user.profile?.bloodGroup,
          location: user.profile?.location,
        },
        location: user.locationLat && user.locationLng ? { lat: user.locationLat, lon: user.locationLng } : undefined,
      },
      refresh: false,
    });
  } catch (err) {
    console.error("Failed to index user:", err);
  }
}

export async function deleteUser(userId: string) {
  if (!userId) return;
  try {
    await elasticClient.delete({ index: "users", id: userId });
  } catch (err: any) {
    // ignore not found (Elasticsearch client error shape varies)
    const status = err?.meta?.statusCode ?? err?.statusCode ?? (err && (err as any).status);
    if (status !== 404) console.error("Failed to delete user from index:", err);
  }
}

export async function indexEvent(ev: any) {
  if (!ev || !ev.id) return;
  try {
    await elasticClient.index({
      index: "events",
      id: ev.id,
      body: {
        id: ev.id,
        name: ev.name,
        description: ev.description,
        date: ev.date,
        venue: ev.venue,
        status: ev.status,
        location: ev.locationLat && ev.locationLng ? { lat: ev.locationLat, lon: ev.locationLng } : undefined,
      },
      refresh: false,
    });
  } catch (err) {
    console.error("Failed to index event:", err);
  }
}

export async function deleteEvent(eventId: string) {
  if (!eventId) return;
  try {
    await elasticClient.delete({ index: "events", id: eventId });
  } catch (err: any) {
    const status = err?.meta?.statusCode ?? err?.statusCode ?? (err && (err as any).status);
    if (status !== 404) console.error("Failed to delete event from index:", err);
  }
}

export default {
  indexUser,
  deleteUser,
  indexEvent,
  deleteEvent,
};
