"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NotSigned from "@/components/ui/NotSigned";

export default function Family() {
  const { user } = useUser();
  const { t } = useTranslation();
  const [familyData, setFamilyData] = useState(null);

  useEffect(() => {
    if (user?.id) {
      // Fetch family data from API
      fetch(`/api/family/${user.id}`)
        .then((res) => res.json())
        .then((data) => setFamilyData(data));
    }
  }, [user]);

  if (!user) {
    return <NotSigned />;
  }

  return (
    <div className="container py-8 mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-4xl font-bold text-center"
      >
        {t("family")}
      </motion.h1>
      {familyData && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="p-8 bg-white bg-opacity-10 rounded-lg"
        >
          <h2 className="mb-4 text-2xl font-semibold">{familyData.name}</h2>
          <p>
            <strong>{t("gotra")}:</strong> {familyData.gotra.name}
          </p>
          <p>
            <strong>{t("address")}:</strong> {familyData.address}
          </p>
          <h3 className="mt-6 mb-4 text-xl font-semibold">
            {t("familyMembers")}
          </h3>
          <ul>
            {familyData.members.map((member) => (
              <li key={member.id} className="mb-2">
                {member.name} {member.surname} - {member.relation}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
