"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_BUTTON: Record<string, string> = {
  danger:
    "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 focus:ring-red-500",
  warning:
    "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 focus:ring-amber-500",
  info: "bg-gradient-to-r from-jewel-gold to-jewel-600 text-jewel-deep hover:from-jewel-goldLight hover:to-jewel-500 focus:ring-jewel-gold",
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="relative z-10 w-full max-w-md rounded-2xl border border-jewel-200 bg-white p-6 shadow-xl dark:border-jewel-700 dark:bg-jewel-900"
          >
            <h2
              id="confirm-title"
              className="text-lg font-bold text-jewel-900 dark:text-jewel-50"
            >
              {title}
            </h2>
            <p
              id="confirm-desc"
              className="mt-2 text-sm text-jewel-600 dark:text-jewel-300"
            >
              {description}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                onClick={onCancel}
                className="rounded-xl border border-jewel-200 bg-jewel-50 px-4 py-2 text-sm font-medium text-jewel-700 transition-colors hover:bg-jewel-100 dark:border-jewel-600 dark:bg-jewel-800 dark:text-jewel-200 dark:hover:bg-jewel-700 focus:outline-none focus:ring-2 focus:ring-jewel-400 focus:ring-offset-2"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${VARIANT_BUTTON[variant]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
