"use client";

import { ToastProvider } from "@repo/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
