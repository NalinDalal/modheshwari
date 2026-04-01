"use client";

import React, { forwardRef } from "react";

import colors from "./colors";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className = "",
      disabled,
      ...rest
    },
    ref,
  ) => {
    const base =
      "rounded-xl font-semibold transition-all duration-300 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]";

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary: `
        bg-gradient-to-r from-[${colors.brand500}] to-[${colors.brand600}]
        text-jewel-deep border border-[${colors.brand600}]
        focus:ring-[${colors.brand500}]
        shadow-jewel hover:shadow-xl
        hover:scale-[1.02]
      `,
      secondary: `
        border border-jewel-400/30
        bg-jewel-50/60 backdrop-blur-sm
        text-jewel-800
        hover:bg-jewel-100 hover:border-jewel-gold/40
        focus:ring-[${colors.brand500}]
        shadow-soft hover:shadow-jewel
      `,
      ghost: `
        bg-transparent 
        text-jewel-700 
        hover:bg-jewel-100 hover:text-jewel-gold
        focus:ring-[${colors.brand500}]
        border border-transparent
      `,
      danger: `
        bg-gradient-to-r from-[${colors.danger500}] to-[${colors.danger600}]
        text-white
        hover:opacity-90
        focus:ring-[${colors.danger500}]
        shadow-md hover:shadow-lg
        border border-[${colors.danger600}]
      `,
    };

    const disabledClasses = disabled
      ? "opacity-60 cursor-not-allowed pointer-events-none hover:scale-100"
      : "";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`.trim()}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
