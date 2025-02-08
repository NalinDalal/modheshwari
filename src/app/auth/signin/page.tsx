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
          class="flex relative justify-start items-center px-4 space-x-2 w-full h-10 font-medium text-black bg-gray-50 rounded-md group/btn shadow-input dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
          type="submit"
          onClick={() => signIn("google")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-4 h-4 text-neutral-800 dark:text-neutral-300"
          >
            <path d="M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945z"></path>
          </svg>
          <span class="text-sm text-neutral-700 dark:text-neutral-300">
            Google
          </span>
          <span class="block absolute inset-x-0 -bottom-px w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100"></span>
          <span class="block absolute inset-x-10 -bottom-px mx-auto w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 transition duration-500 blur-sm group-hover/btn:opacity-100"></span>
        </button>
      </div>
    </div>
  );
}
