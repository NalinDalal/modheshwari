"use client";

import { ReactNode, useState } from "react";

export default function Tooltip({
  children,
  text,
  className = "",
}: {
  children: ReactNode;
  text: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}

      <div
        role="tooltip"
        aria-hidden={!show}
        className={`pointer-events-none transition-opacity duration-150 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs py-1 px-2 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      >
        {text}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-8 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
