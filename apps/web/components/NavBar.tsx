"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE } from "../lib/config";
import {
  Search,
  Menu,
  X,
  Home,
  Users,
  Package,
  Bell,
  Phone,
  MessageSquare
} from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ================= Auth ================= */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);

    fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === "success") setUser(data.data);
        else localStorage.removeItem("token");
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  /* ================= Helpers ================= */

  const isActive = (href: string) => pathname === href;

  const NavItem = ({
    href,
    label,
    Icon,
  }: {
    href: string;
    label: string;
    Icon?: ComponentType<{ className?: string }>;
  }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
        ${
          isActive(href)
            ? "bg-pink-100 text-pink-700"
            : "text-gray-700 hover:text-pink-700 hover:bg-pink-50"
        }
      `}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  );

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  /* ================= JSX ================= */

  return (
    <nav className="fixed top-0 z-50 h-16 w-full bg-gradient-to-r from-pink-50/95 via-white/95 to-rose-50/95 backdrop-blur-xl border-b border-pink-200 shadow-lg shadow-pink-500/10">
      <div className="mx-auto max-w-7xl h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-white text-sm shadow-lg shadow-pink-500/30">
            M
          </div>
          <span className="text-gray-900">Modheshwari</span>
        </Link>

        {/* Desktop */}
        {!loading && (
          <div className="hidden md:flex items-center gap-1">
            <NavItem href="/" label="Home" Icon={Home} />
            <NavItem href="/contact" label="Contact" Icon={Phone} />

            <Link
              href="/search"
              className="ml-1 h-9 w-9 rounded-lg flex items-center justify-center hover:bg-pink-100"
            >
              <Search className="h-4 w-4 text-gray-700" />
            </Link>

            {user ? (
              <>
                <div className="mx-2 h-6 w-px bg-pink-200" />
                <NavItem href="/family" label="Family" Icon={Users} />
                <NavItem href="/resources" label="Resources" Icon={Package} />
                <NavItem href="/notifications" label="Alerts" Icon={Bell} />
                <button
                  onClick={() => router.push("/me")}
                  className="ml-2 h-9 w-9 rounded-lg bg-gradient-to-br from-pink-600 to-rose-600 text-white text-xs font-bold"
                >
                  {initials}
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="ml-4 px-5 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold"
              >
                Sign in
              </Link>
            )}
          </div>
        )}

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-pink-100"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-900" />
          ) : (
            <Menu className="h-5 w-5 text-gray-900" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && !loading && (
        <div className="md:hidden bg-white/95 border-t border-pink-200 px-4 py-4 space-y-2">
          <NavItem href="/" label="Home" Icon={Home} />
          <NavItem href="/contact" label="Contact" Icon={Phone} />
          <NavItem href="/search" label="Search" Icon={Search} />

          {user ? (
            <>
              <div className="h-px bg-pink-200 my-2" />
              <NavItem href="/family" label="Family" Icon={Users} />
              <NavItem href="/resources" label="Resources" Icon={Package} />
              <NavItem href="/notifications" label="Alerts" Icon={Bell} />
              <NavItem href='/chat' label='Chat' Icon={MessageSquare} />
              <NavItem href="/me" label={user.name} />
            </>
          ) : (
            <Link
              href="/signin"
              className="block text-center mt-3 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
