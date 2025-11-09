export default function NavBar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
      <div className="text-xl font-semibold text-black dark:text-white">
        Modheshwari
      </div>
      <div className="flex gap-6 text-black dark:text-white">
        <a href="/" className="hover:underline">
          Home
        </a>
        <a href="/about" className="hover:underline">
          About
        </a>
        <a href="/contact" className="hover:underline">
          Contact
        </a>
      </div>
    </nav>
  );
}
