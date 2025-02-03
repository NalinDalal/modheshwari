"use client";

import { useEffect, useState } from "react";
import type React from "react"; // Added import for React

export default function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return children;
}
