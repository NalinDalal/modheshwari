"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void;
  dismiss: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Performs use toast operation.
 * @returns {ToastContextValue} Description of return value
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const DEFAULT_DURATION = 4000;

/**
 * Performs  toast provider operation.
 * @param {{ children: React.ReactNode; }} { children } - Description of { children }
 * @returns {any} Description of return value
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (
      message: string,
      opts?: { variant?: ToastVariant; duration?: number },
    ) => {
      const id = `toast-${++counterRef.current}`;
      const duration = opts?.duration ?? DEFAULT_DURATION;
      setToasts((prev) => [...prev, { id, message, variant: opts?.variant ?? "info", duration }]);
    },
    [],
  );

  const ctx = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast viewport — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Toast item
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-200",
  error:
    "bg-red-50 border-red-300 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-200",
  warning:
    "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200",
  info:
    "bg-jewel-50 border-jewel-300 text-jewel-800 dark:bg-jewel-900 dark:border-jewel-600 dark:text-jewel-200",
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};

/**
 * Performs  toast item operation.
 * @param {{ toast: Toast; onDismiss: (id: string) => void; }} {
 *   toast,
 *   onDismiss,
 * } - Description of {
 *   toast,
 *   onDismiss,
 * }
 * @returns {any} Description of return value
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        pointer-events-auto
        flex items-start gap-3
        rounded-xl border px-4 py-3
        shadow-lg backdrop-blur-sm
        min-w-[280px] max-w-[420px]
        ${VARIANT_STYLES[toast.variant]}
      `}
      role="alert"
    >
      <span className="text-lg leading-none mt-0.5" aria-hidden="true">
        {VARIANT_ICONS[toast.variant]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </motion.div>
  );
}
