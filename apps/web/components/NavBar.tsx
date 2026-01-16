"use client";

import { useEffect, useState } from "react";
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
    Icon?: any;
  }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
        ${
          isActive(href)
            ? "bg-white/10 text-white"
            : "text-gray-400 hover:text-white hover:bg-white/5"
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
    <nav className="fixed top-0 z-50 h-16 w-full bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="mx-auto max-w-7xl h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
            M
          </div>
          <span className="text-white">Modheshwari</span>
        </Link>

        {/* Desktop */}
        {!loading && (
          <div className="hidden md:flex items-center gap-1">
            <NavItem href="/" label="Home" Icon={Home} />
            <NavItem href="/contact" label="Contact" Icon={Phone} />

            <Link
              href="/search"
              className="ml-1 h-9 w-9 rounded-lg flex items-center justify-center hover:bg-white/10"
            >
              <Search className="h-4 w-4 text-gray-400" />
            </Link>

            {user ? (
              <>
                <div className="mx-2 h-6 w-px bg-white/10" />
                <NavItem href="/family" label="Family" Icon={Users} />
                <NavItem href="/resources" label="Resources" Icon={Package} />
                <NavItem href="/notifications" label="Alerts" Icon={Bell} />
                <button
                  onClick={() => router.push("/me")}
                  className="ml-2 h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold"
                >
                  {initials}
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="ml-4 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold"
              >
                Sign in
              </Link>
            )}
          </div>
        )}

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/10"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <Menu className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && !loading && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-4 py-4 space-y-2">
          <NavItem href="/" label="Home" Icon={Home} />
          <NavItem href="/contact" label="Contact" Icon={Phone} />
          <NavItem href="/search" label="Search" Icon={Search} />

          {user ? (
            <>
              <div className="h-px bg-white/10 my-2" />
              <NavItem href="/family" label="Family" Icon={Users} />
              <NavItem href="/resources" label="Resources" Icon={Package} />
              <NavItem href="/notifications" label="Alerts" Icon={Bell} />
              <NavItem href="/me" label={user.name} />
            </>
          ) : (
            <Link
              href="/signin"
              className="block text-center mt-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
