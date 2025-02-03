"use client"

import { useSession } from "next-auth/react"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export default function Family() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [familyData, setFamilyData] = useState(null)

  useEffect(() => {
    if (session?.user?.id) {
      // Fetch family data from API
      fetch(`/api/family/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => setFamilyData(data))
    }
  }, [session])

  if (!session) {
    return <div>{t("notSignedIn")}</div>
  }

  return (
    <div className="container mx-auto py-8">
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
          className="bg-white bg-opacity-10 p-8 rounded-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">{familyData.name}</h2>
          <p>
            <strong>{t("gotra")}:</strong> {familyData.gotra.name}
          </p>
          <p>
            <strong>{t("address")}:</strong> {familyData.address}
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-4">{t("familyMembers")}</h3>
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
  )
}


