"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { useUser, SignOutButton } from "@clerk/nextjs";

export default function Navigation() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <nav className="p-3 bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 rounded-lg shadow-lg">
      <ul className="flex gap-x-6 justify-between items-center md:justify-center">
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
              <SignOutButton />
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
