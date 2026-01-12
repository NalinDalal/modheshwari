"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Performs  nav bar operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ============================== */
  /* Auth check                    */
  /* ============================== */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    async function fetchMe() {
      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api"
          }/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        if (data?.status === "success") {
          setUser(data.data);
        } else {
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, []);

  /* ============================== */
  /* Helpers                       */
  /* ============================== */

  const navLink = (href: string, label: string) => {
    const active = pathname === href;

    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active
            ? "text-amber-600 dark:text-amber-400"
            : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  /* ============================== */
  /* JSX                           */
  /* ============================== */

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white"
        >
          Modheshwari
        </Link>

        {/* Nav */}
        {!loading && (
          <div className="flex items-center gap-6">
            {/* Public */}
            {navLink("/", "Home")}

            {/* Contact + Search */}
            <div className="flex items-center gap-2">
              {navLink("/contact", "Contact")}

              <Link
                href="/search"
                title="Search"
                className="group flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                {/* Search SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Link>
            </div>

            {/* Private */}
            {user && (
              <>
                <span className="mx-2 h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
                {navLink("/family", "Family")}
                {navLink("/resources", "Resources")}
                {navLink("/notifications", "Notifications")}

                {/* Avatar */}
                <button
                  onClick={() => router.push("/me")}
                  title={user.name}
                  className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-sm font-bold text-white shadow-md transition hover:scale-105"
                >
                  {initials}
                </button>
              </>
            )}

            {/* Auth CTA */}
            {!user && (
              <Link
                href="/signin"
                className="ml-4 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
