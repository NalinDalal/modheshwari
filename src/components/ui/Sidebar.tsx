import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Burger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 m-4 bg-indigo-600 rounded-md shadow-md transition hover:bg-indigo-700 focus:outline-none"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-indigo-900 to-purple-900 text-white transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out shadow-xl`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white bg-red-500 rounded-md transition hover:bg-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-10">
          <ul className="px-6 space-y-6">
            {[
              { name: "Home", href: "/" },
              { name: "About", href: "/about" },
              { name: "Services", href: "/services" },
              { name: "Contact", href: "/contact" },
              { name: "Events", href: "/events" },
            ].map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className="block text-lg font-semibold tracking-wide transition duration-300 hover:pl-2 hover:text-indigo-300"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};
