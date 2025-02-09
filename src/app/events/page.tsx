"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

export default function Events() {
  const { user, isSignedIn } = useUser();
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Fetch user role from the database (mocked for now)
    if (isSignedIn && user) {
      fetch(`/api/user-role?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => setUserRole(data.role));
    }

    // Fetch events from API
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, [isSignedIn, user]);

  if (!isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="p-6 text-xl font-semibold text-white bg-red-500 bg-opacity-80 rounded-lg shadow-lg"
        >
          {t("notSignedIn")}
        </motion.div>
      </div>
    );
  }

  // Check if user is an admin or subadmin
  const isAdmin = userRole === "admin" || userRole === "subadmin";

  return (
    <div className="container py-8 mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-4xl font-bold text-center text-white"
      >
        {t("events")}
      </motion.h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.length > 0 ? (
          events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 * index }}
              className="p-6 bg-white bg-opacity-10 rounded-lg shadow-lg"
            >
              <h2 className="mb-2 text-2xl font-semibold">{event.name}</h2>
              <p className="mb-2">{event.description}</p>
              <p>
                <strong>{t("startDate")}:</strong>{" "}
                {new Date(event.startDate).toLocaleString()}
              </p>
              <p>
                <strong>{t("endDate")}:</strong>{" "}
                {event.endDate
                  ? new Date(event.endDate).toLocaleString()
                  : t("notSpecified")}
              </p>
              <p>
                <strong>{t("venue")}:</strong> {event.venue}
              </p>

              {/* Normal users: Show Register Button */}
              {!isAdmin && (
                <button className="py-2 px-4 mt-4 font-semibold text-purple-900 bg-white rounded-full transition duration-300 hover:bg-opacity-90">
                  {t("register")}
                </button>
              )}

              {/* Admins & Subadmins: Show Edit Button */}
              {isAdmin && (
                <button
                  onClick={() => handleEditEvent(event.id)}
                  className="py-2 px-4 mt-4 font-semibold text-blue-900 bg-yellow-300 rounded-full transition duration-300 hover:bg-yellow-400"
                >
                  {t("editEvent")}
                </button>
              )}
            </motion.div>
          ))
        ) : (
          <p className="text-lg text-center text-gray-400">{t("noEvents")}</p>
        )}
      </div>
    </div>
  );
}

// Function to handle editing events (only for admins/subadmins)
function handleEditEvent(eventId: string) {
  const newName = prompt("Enter new event name:");
  if (!newName) return;

  fetch(`/api/edit-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, newName }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert("Event updated successfully!");
      window.location.reload();
    })
    .catch((err) => console.error("Error updating event:", err));
}
