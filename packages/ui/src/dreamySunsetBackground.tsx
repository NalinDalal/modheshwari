/**
 * Dreamy Sunset Background Component
 * Provides a consistent sunset gradient background across all pages
 */

import React from "react";

interface DreamySunsetBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Performs  dreamy sunset background operation.
 * @param {DreamySunsetBackgroundProps} {
 *   children,
 *   className = "",
 * } - Description of {
 *   children,
 *   className = "",
 * }
 * @returns {any} Description of return value
 */
export function DreamySunsetBackground({
  children,
  className = "",
}: DreamySunsetBackgroundProps) {
  return (
    <div className={`min-h-screen w-full relative ${className}`}>
      {/* Pink Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #ec4899 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}