// components/ui/Button.tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseStyle = "py-2 px-4 rounded-lg font-semibold transition-all";
  const variantStyle =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : "border border-indigo-600 text-indigo-600 hover:bg-indigo-100";

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};
