import React, { useState } from "react";
import { Menu } from "lucide-react";

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Burger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 m-4 bg-gray-200 rounded-md focus:outline-none"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-indigo-900 to-purple-900 text-white transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out shadow-lg`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 m-4 bg-indigo-700 rounded-md focus:outline-none"
        >
          Close
        </button>
        <nav className="mt-10">
          <ul className="px-6 space-y-4">
            <li>
              <a href="#" className="block hover:text-gray-300">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="block hover:text-gray-300">
                About
              </a>
            </li>
            <li>
              <a href="#" className="block hover:text-gray-300">
                Services
              </a>
            </li>
            <li>
              <a href="#" className="block hover:text-gray-300">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

//export default Sidebar;
