"use client";

import React, { forwardRef } from "react";
import { colors } from "./colors";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = "primary", className = "", disabled, ...rest },
    ref,
  ) => {
    const base =
      "px-5 py-2.5 rounded-full font-medium shadow-md transition-all duration-300 inline-flex items-center justify-center";

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-gradient-to-r from-amber-600 to-rose-600 text-white hover:from-amber-700 hover:to-rose-700",
      secondary:
        "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/50 hover:bg-gray-50 dark:hover:bg-neutral-800",
      ghost:
        "bg-transparent text-gray-700 hover:bg-gray-50 dark:hover:bg-neutral-800",
      danger:
        // group so children (icons) can use group-hover for motion
        "group inline-flex items-center gap-2 bg-red-600 text-white hover:bg-white hover:text-red-600 border border-transparent hover:border-red-600",
    };

    const disabledClasses = disabled
      ? "opacity-60 cursor-not-allowed pointer-events-none"
      : "";

    return (
      <button
        ref={ref}
        className={`${base} ${variantClasses[variant]} ${disabledClasses} ${className}`.trim()}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
