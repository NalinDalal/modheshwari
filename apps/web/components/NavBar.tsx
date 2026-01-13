"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Home,
  Users,
  Package,
  Bell,
  Phone,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const isActive = (href: string) => pathname === href;

  const navLink = (href: string, label: string, icon?: any) => {
    const active = isActive(href);
    const Icon = icon;

    return (
      <Link
        key={href}
        href={href}
        className={`
          group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${
            active
              ? "text-white bg-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }
        `}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </span>
        {active && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
        )}
      </Link>
    );
  };

  const mobileNavLink = (href: string, label: string, icon?: any) => {
    const active = isActive(href);
    const Icon = icon;

    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
          ${
            active
              ? "text-white bg-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }
        `}
      >
        {Icon && <Icon className="w-5 h-5" />}
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
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-xl font-bold"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-110">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Modheshwari
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!loading && (
            <div className="hidden md:flex items-center gap-1">
              {/* Public Links */}
              {navLink("/", "Home", Home)}
              {navLink("/contact", "Contact", Phone)}

              {/* Search Button */}
              <Link
                href="/search"
                className="group flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <Search className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              </Link>

              {/* Private Links (if logged in) */}
              {user && (
                <>
                  <div className="mx-2 h-6 w-px bg-white/10" />

                  {navLink("/family", "Family", Users)}
                  {navLink("/resources", "Resources", Package)}
                  {navLink("/notifications", "Notifications", Bell)}

                  {/* User Avatar */}
                  <button
                    onClick={() => router.push("/me")}
                    title={user.name}
                    className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-110 hover:shadow-blue-500/40"
                  >
                    {initials}
                  </button>
                </>
              )}

              {/* Sign In Button */}
              {!user && (
                <Link
                  href="/signin"
                  className="ml-4 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 hover:shadow-blue-500/40"
                >
                  Sign in
                </Link>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && !loading && (
          <div className="md:hidden mt-4 py-4 border-t border-white/10 space-y-2">
            {/* Public Links */}
            {mobileNavLink("/", "Home", Home)}
            {mobileNavLink("/contact", "Contact", Phone)}

            {/* Search */}
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Search className="w-5 h-5" />
              Search
            </Link>

            {/* Private Links (if logged in) */}
            {user && (
              <>
                <div className="my-2 h-px bg-white/10" />

                {mobileNavLink("/family", "Family", Users)}
                {mobileNavLink("/resources", "Resources", Package)}
                {mobileNavLink("/notifications", "Notifications", Bell)}

                {/* Profile Link */}
                <Link
                  href="/me"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                    {initials}
                  </div>
                  {user.name}
                </Link>
              </>
            )}

            {/* Sign In Button (Mobile) */}
            {!user && (
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
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
