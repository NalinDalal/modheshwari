"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Events() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch events from API
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, []);

  if (!session) {
    return (
      <div>
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="p-6 bg-white bg-opacity-10 rounded-lg"
        >
          {t("notSignedIn")}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-4xl font-bold text-center"
      >
        {t("events")}
      </motion.h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 * index }}
            className="p-6 bg-white bg-opacity-10 rounded-lg"
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
            <button className="py-2 px-4 mt-4 font-semibold text-purple-900 bg-white rounded-full transition duration-300 hover:bg-opacity-90">
              {t("register")}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
