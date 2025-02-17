"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NotSigned from "@/components/ui/NotSigned";
import { Sidebar } from "@/components/ui/Sidebar";
export default function Profile() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      // Fetch user data from API
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => setUserData(data));
    }
  }, [session]);

  if (!session) {
    return (
      <div>
        <NotSigned />
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto">
      <Sidebar />
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-4xl font-bold text-center"
      >
        {t("profile")}
      </motion.h1>
      {userData && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="p-8 bg-white bg-opacity-10 rounded-lg"
        >
          <h2 className="mb-4 text-2xl font-semibold">
            {userData.name} {userData.surname}
          </h2>
          <p>
            <strong>{t("email")}:</strong> {userData.email}
          </p>
          <p>
            <strong>{t("gender")}:</strong> {userData.gender}
          </p>
          <p>
            <strong>{t("bloodGroup")}:</strong> {userData.bloodGroup}
          </p>
          <p>
            <strong>{t("dateOfBirth")}:</strong>{" "}
            {new Date(userData.dateOfBirth).toLocaleDateString()}
          </p>
          <p>
            <strong>{t("phone")}:</strong> {userData.phone}
          </p>
          <p>
            <strong>{t("address")}:</strong> {userData.address}, {userData.city}
            , {userData.state}, {userData.pincode}
          </p>
        </motion.div>
      )}
    </div>
  );
}
