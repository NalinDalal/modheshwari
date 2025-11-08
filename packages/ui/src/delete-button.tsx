"use client";

import React from "react";

interface DeleteButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

/**
 * A custom delete button with a dustbin SVG that animates on hover.
 * Visual behavior:
 * - Rectangular with small rounded corners
 * - Dustbin icon to the left, text to the right
 * - On hover: background shifts to white, text becomes red, and the dustbin lid animates
 */
export function DeleteButton({
  children = "Delete",
  className = "",
  ...rest
}: DeleteButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-md border border-transparent bg-red-600 text-white font-medium shadow-sm transition-colors duration-200 ease-in-out hover:bg-white hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 ${className}`}
    >
      <span className="w-5 h-5 flex-shrink-0">
        {/* Dustbin icon: body + lid. The lid will animate on hover via transform on parent hover */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 transition-transform duration-200 ease-in-out transform group-hover:-translate-y-0.5"
          aria-hidden
        >
          <g
            className="bin-lid"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" className="" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" className="" />
          </g>
          <g
            className="bin-body"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 6l1 13a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l1-13" />
            <path d="M10 11v6M14 11v6" />
          </g>
        </svg>
      </span>

      <span className="text-sm leading-5">{children}</span>
      <style jsx>{`
        button {
          --tw-text-opacity: 1;
        }

        /* Use the parent hover to animate the SVG lid slightly */
        button:hover svg .bin-lid {
          transform-origin: center 0.6rem;
          transform: translateY(-2px) rotate(-8deg);
        }

        button svg .bin-lid,
        button svg .bin-body {
          transition:
            transform 180ms ease-in-out,
            stroke 180ms ease-in-out;
          color: currentColor;
        }

        /* When hovered make the icon stroke red (inherited from text color) */
        button:hover svg {
          color: currentColor;
        }
      `}</style>
    </button>
  );
}

export default DeleteButton;
