"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Home,
  Users,
  Package,
  BellPlus,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  MessageCircle,
  Stethoscope,
} from "lucide-react";

import { API_BASE } from "../lib/config";
import apiFetch from "../lib/api";
import Tooltip from "./Tooltip";
import useNotifications from "../hooks/useNotifications";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
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
  const { unreadCount } = useNotifications();

  /* ================= Auth ================= */

  useEffect(() => {
    // Re-check auth whenever the pathname changes so NavBar reflects recent signin/signout.
    // Also listen for storage events and a custom `authChanged` event so pages can notify NavBar
    // when the token is updated without a pathname change.
    let mounted = true;

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (!mounted) return;
          setUser(null);
          setLoading(false);
          return;
        }

        if (mounted) setLoading(true);

        const result = await apiFetch(`${API_BASE}/me`, {
          throwOnError: false,
        });
        if (result?.ok === false) {
          // unauthenticated or missing resource
          localStorage.removeItem("token");
          if (mounted) setUser(null);
          return;
        }

        const u = result?.data?.data ?? result?.data ?? result;
        if (u && mounted) setUser(u);
      } catch {
        localStorage.removeItem("token");
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    const handler = () => {
      // slight delay to let signin code finish writing token
      setTimeout(checkAuth, 10);
    };

    window.addEventListener("storage", handler);
    window.addEventListener("authChanged", handler as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("storage", handler);
      window.removeEventListener("authChanged", handler as EventListener);
    };
  }, [pathname]);

  /* ================= Helpers ================= */

  const isActive = (href: string) => pathname === href;

  const NavItem = ({
    href,
    label,
    Icon,
    onClick,
    hideLabel,
    title,
  }: {
    href: string;
    label: string;
    Icon?: ComponentType<{ className?: string }>;
    onClick?: () => void;
    hideLabel?: boolean;
    title?: string;
  }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg ${isActive(href) ? "bg-jewel-100" : ""}`}
    >
      {hideLabel ? (
        <Tooltip text={title ?? href}>
          <div
            className={`p-2 rounded ${isActive(href) ? "text-jewel-700" : "text-jewel-700 hover:text-jewel-gold"}`}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </div>
        </Tooltip>
      ) : (
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isActive(href) ? "bg-jewel-100 text-jewel-700" : "text-jewel-700 hover:text-jewel-gold hover:bg-jewel-50"}`}
        >
          {Icon && <Icon className="h-4 w-4" />}
          <span>{label}</span>
        </div>
      )}
    </Link>
  );

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  // Role badge color
  const roleColors: Record<string, string> = {
    COMMUNITY_HEAD: "bg-jewel-gold",
    COMMUNITY_SUBHEAD: "bg-jewel-600",
    GOTRA_HEAD: "bg-jewel-emerald",
    FAMILY_HEAD: "bg-jewel-500",
    MEMBER: "bg-jewel-400",
  };

  // Status chip
  const statusChip = user?.status ? (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-jewel-emerald/20 text-jewel-emerald border border-jewel-emerald/30">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-jewel-200/50 text-jewel-600 border border-jewel-400/20">
      Inactive
    </span>
  );

  /* ================= JSX ================= */

  return (
    <nav className="fixed top-0 z-50 h-16 w-full bg-jewel-50/90 backdrop-blur-xl border-b border-jewel-400/20 shadow-sm">
      <div className="mx-auto max-w-7xl h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-bold text-lg"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-jewel-gold to-jewel-500 flex items-center justify-center text-jewel-deep text-sm shadow-lg shadow-jewel-gold/30">
            M
          </div>
          <span className="text-jewel-900">Modheshwari</span>
        </Link>

        {/* Desktop */}
        {!loading && (
          <div className="hidden md:flex items-center gap-1">
            <NavItem
              href="/"
              label="Home"
              Icon={Home}
              hideLabel
              title="/home"
            />
            <NavItem
              href="/contact"
              label="Contact"
              Icon={Phone}
              hideLabel
              title="/contact"
            />

            <Link
              href="/search"
              className="ml-1 h-9 w-9 rounded-lg flex items-center justify-center hover:bg-jewel-100"
            >
              <Search className="h-4 w-4 text-jewel-700" />
            </Link>

            {user ? (
              <>
                <div className="mx-2 h-6 w-px bg-jewel-400/30" />
                <NavItem
                  href="/family"
                  label="Family"
                  Icon={Users}
                  hideLabel
                  title="/family"
                />
                <NavItem
                  href="/medical"
                  label="Medical"
                  Icon={Stethoscope}
                  hideLabel
                  title="/medical"
                />
                <NavItem
                  href="/resources"
                  label="Resources"
                  Icon={Package}
                  hideLabel
                  title="/resources"
                />
                <NavItem
                  href="/nearby"
                  label="Nearby"
                  Icon={MapPin}
                  hideLabel
                  title="/nearby"
                />
                <NavItem
                  href="/events/calendar"
                  label="Calendar"
                  Icon={Calendar}
                  hideLabel
                  title="/events/calendar"
                />
                <NavItem
                  href="/notifications"
                  label="Notifications"
                  Icon={BellPlus}
                  hideLabel
                  title="/notifications"
                />
                <NavItem
                  href="/chat"
                  label="Chat"
                  Icon={MessageCircle}
                  hideLabel
                  title="/chat"
                />
                <div className="relative group">
                  <button
                    onClick={() => router.push("/me")}
                    className="ml-2 h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-jewel-deep shadow-lg"
                    style={{ background: roleColors[user.role] || "#78716c" }}
                    title="Profile"
                  >
                    {initials}
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-jewel-ruby rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                  <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-jewel-50 border border-jewel-400/20 rounded-lg shadow-jewel z-50">
                    <div className="px-4 py-3 border-b border-jewel-400/20">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold text-jewel-deep ${roleColors[user.role] || "bg-jewel-400"}`}
                        >
                          {user.role ? user.role.replace(/_/g, " ") : "Unknown"}
                        </span>
                        {statusChip}
                      </div>
                      <div className="mt-1 text-xs text-jewel-500">
                        {user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => router.push("/me/edit")}
                      className="w-full text-left px-4 py-2 hover:bg-jewel-100 text-sm text-jewel-700"
                    >
                      Edit profile
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        router.push("/signin");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-jewel-100 text-sm text-jewel-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link
                href="/signin"
                className="ml-4 px-5 py-2 rounded-lg bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep text-sm font-semibold"
              >
                Sign in
              </Link>
            )}
          </div>
        )}

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-jewel-100"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-jewel-900" />
          ) : (
            <Menu className="h-5 w-5 text-jewel-900" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && !loading && (
        <div className="md:hidden bg-jewel-50/95 border-t border-jewel-400/20 px-4 py-4">
          <div className="mb-2">
            <NavItem href="/" label="Home" Icon={Home} />
            <NavItem href="/contact" label="Contact" Icon={Phone} />
            <NavItem href="/search" label="Search" Icon={Search} />
          </div>
          {user ? (
            <>
              <div className="h-px bg-jewel-400/30 my-2" />
              <div className="mb-2">
                <NavItem href="/family" label="Family" Icon={Users} />
                <NavItem href="/medical" label="Medical" Icon={Stethoscope} />
                <NavItem href="/resources" label="Resources" Icon={Package} />
                <NavItem href="/nearby" label="Nearby" Icon={MapPin} />
                <NavItem
                  href="/events/calendar"
                  label="Calendar"
                  Icon={Calendar}
                />
                <NavItem href="/chat" label="Chat" Icon={MessageSquare} />
              </div>
              <div className="h-px bg-jewel-400/30 my-2" />
              <Link
                href="/notifications"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              >
                <div className="relative">
                  <BellPlus className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-jewel-ruby rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span>Notifications</span>
              </Link>
              <NavItem href="/me" label={user.name} />
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.push("/signin");
                }}
                className="block w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="block text-center mt-3 py-2 rounded-lg bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
