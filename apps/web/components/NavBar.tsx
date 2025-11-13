import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Performs  nav bar operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function NavBar() {
  const router = useRouter();

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
      <div className="text-xl font-semibold text-black dark:text-white">
        Modheshwari
      </div>
      <div className="flex gap-6 text-black dark:text-white">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <button onClick={() => router.push("/me")}>Me</button>
      </div>
    </nav>
  );
}
