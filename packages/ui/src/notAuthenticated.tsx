"use client";
import { type JSX, type ReactNode } from "react";

interface NotAuthenticatedProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Generic fallback view for unauthenticated access.
 * Centered, minimal, and reusable across pages.
 */
export function NotAuthenticated({
  children,
  className = "",
}: NotAuthenticatedProps): JSX.Element {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen text-center px-4 ${className}`}
    >
      <h1 className="text-3xl font-bold mb-2">Not Authenticated</h1>
      <p className="text-gray-600 mb-6">
        You are not authorized to view this page.
      </p>
      {children}
    </div>
  );
}
