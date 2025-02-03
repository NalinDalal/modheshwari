"use client";

import { signIn } from "next-auth/react";
import { useTranslation } from "react-i18next";

export default function SignIn() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="p-8 bg-white bg-opacity-10 rounded-lg">
        <h1 className="mb-6 text-3xl font-bold text-center">{t("signIn")}</h1>
        <button
          onClick={() => signIn("google")}
          className="py-2 px-4 w-full font-semibold text-purple-900 bg-white rounded-full transition duration-300 hover:bg-opacity-90"
        >
          {t("signInWithGoogle")}
        </button>
      </div>
    </div>
  );
}
