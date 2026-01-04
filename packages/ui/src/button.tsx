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
      "rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97]";

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary: `
        bg-[${colors.brand600}] text-white border border-[${colors.brand700}]
        focus:ring-[${colors.brand500}]
        shadow-md hover:shadow-lg
        transition-all duration-300 ease-in-out
        hover:bg-blue-600
        hover:scale-[1.03]
        [&>span]:transition-transform [&>span]:duration-300 [&>span]:ease-in-out
        hover:[&>span]:scale-[1.1]
      `,
      secondary: `
        border border-gray-300 dark:border-gray-700
        bg-white dark:bg-neutral-900
        text-gray-800 dark:text-gray-200
        hover:bg-gray-100 dark:hover:bg-neutral-800
        focus:ring-[${colors.brand500}]
        shadow-md hover:shadow-lg
      `,
      ghost: `
        bg-transparent text-[${colors.brand600}] dark:text-[${colors.brand500}]
        hover:bg-blue-50 dark:hover:bg-neutral-800
        focus:ring-[${colors.brand500}]
        border border-transparent
      `,
      danger: `
        bg-[${colors.danger500}] text-white
        hover:bg-[${colors.danger600}]
        focus:ring-[${colors.danger500}]
        shadow-md hover:shadow-lg
        border border-[${colors.danger600}]
      `,
    };

    const disabledClasses = disabled
      ? `opacity-60 cursor-not-allowed pointer-events-none hover:scale-100 hover:bg-[${colors.brand600}] hover:[&>span]:scale-100`
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
