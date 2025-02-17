import React from "react";

export const SmoothButton = ({ label, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-lg font-semibold text-blue-600 border-2 border-blue-600 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-600 hover:text-white ${className}`}
    >
      {label}
    </button>
  );
};
