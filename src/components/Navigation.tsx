"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav className="p-6 bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 rounded-lg shadow-lg">
      <ul className="flex justify-center items-center space-x-8">
        <li>
          <Link
            href="/"
            className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
          >
            {t("home")}
          </Link>
        </li>
        {session ? (
          <>
            <li>
              <Link
                href="/profile"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("profile")}
              </Link>
            </li>
            <li>
              <Link
                href="/family"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("family")}
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("events")}
              </Link>
            </li>
            <li>
              <button
                onClick={() => signOut()}
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("signOut")}
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link
              href="/auth/signin"
              className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
            >
              {t("signIn")}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
