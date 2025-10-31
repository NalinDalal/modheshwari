"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = /**
 * Executes  button operation.
 * @param {ButtonProps} { children, className, appName } - Description of { children, className, appName }
 * @returns {React.JSX.Element} Description of return value
 */
({ children, className, appName }: ButtonProps) => {
  return (
    <button
      className={className}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
