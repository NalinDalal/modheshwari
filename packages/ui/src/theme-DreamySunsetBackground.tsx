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
    <div className={`min-h-screen w-full relative text-gray-800 ${className}`}>
      {/* Dreamy Sunset Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#f5f5dc] via-[#ffdbb3]/80 via-[#ffb6c1]/60 via-[#9370db]/70 to-[#483d8b]/90" />
      
      {/* Radial gradient overlays for depth */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[30%] w-1/2 h-1/2 bg-[#ffffe0]/40 rounded-full blur-3xl" />
        <div className="absolute top-[80%] left-[70%] w-[70%] h-[70%] bg-[#483d8b]/60 rounded-full blur-3xl" />
        <div className="absolute top-[60%] left-[50%] w-[60%] h-[60%] bg-[#9370db]/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      {/* Subtle overlay pattern for depth */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}