import { useRouter } from "next/navigation";
import Link from "next/link";
export default function NavBar() {
  const router = useRouter();
  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
      <div className="text-xl font-semibold text-black dark:text-white">
        Modheshwari
      </div>
      <div className="flex gap-6 text-black dark:text-white">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
      </div>
    </nav>
  );
}
