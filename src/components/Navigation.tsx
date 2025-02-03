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
    <nav className="p-4 bg-white bg-opacity-10">
      <ul className="flex justify-center space-x-6">
        <li>
          <Link
            href="/"
            className="transition duration-300 hover:text-gray-300"
          >
            {t("home")}
          </Link>
        </li>
        {session ? (
          <>
            <li>
              <Link
                href="/profile"
                className="transition duration-300 hover:text-gray-300"
              >
                {t("profile")}
              </Link>
            </li>
            <li>
              <Link
                href="/family"
                className="transition duration-300 hover:text-gray-300"
              >
                {t("family")}
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                className="transition duration-300 hover:text-gray-300"
              >
                {t("events")}
              </Link>
            </li>
            <li>
              <button
                onClick={() => signOut()}
                className="transition duration-300 hover:text-gray-300"
              >
                {t("signOut")}
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link
              href="/auth/signin"
              className="transition duration-300 hover:text-gray-300"
            >
              {t("signIn")}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
