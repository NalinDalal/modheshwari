"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
// You can import your own auth hook or logic here

export default function Navigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  // Replace this with your custom JWT-based auth check
  const isSignedIn = false; // Example: check localStorage, context, or cookies

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 shadow-lg">
      <ul className="flex gap-x-6 justify-between items-center py-3 px-4 md:justify-center">
        {/* Sidebar (Hamburger Menu) */}
        <li>
          <Sidebar />
        </li>

        {/* Navigation Links */}
        <li className="hidden md:block">
          <Link
            href="/"
            className={`text-lg font-semibold text-white transition duration-300 hover:opacity-80 ${
              pathname === "/" ? "border-b-2 border-white" : ""
            }`}
          >
            {t("Home")}
          </Link>
        </li>

        {isSignedIn ? (
          <>
            <li>
              <Link
                href="/profile"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("Profile")}
              </Link>
            </li>
            <li>
              <Link
                href="/family"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("Family")}
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("Events")}
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  // Add your sign-out logic here
                }}
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("SignOut")}
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link
                href="/auth/signin"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("SignIn")}
              </Link>
            </li>
            <li>
              <Link
                href="/auth/signup"
                className="text-xl font-semibold text-white transition duration-300 hover:text-gray-300 hover:underline"
              >
                {t("SignUp")}
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
