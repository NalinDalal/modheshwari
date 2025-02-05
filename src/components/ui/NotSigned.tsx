import Link from "next/link";

export default function NotSigned() {
  return (
    <div className="flex flex-col justify-center items-center p-8 h-screen text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-lg shadow-2xl">
      <p className="mb-4 text-3xl font-semibold text-center">
        You are not Signed In
      </p>
      <Link
        href="/"
        className="py-3 px-6 mt-6 text-lg font-medium text-blue-200 bg-transparent rounded-full border-2 border-blue-200 transition-all duration-300 ease-in-out hover:text-blue-800 hover:bg-blue-200"
      >
        Move Back
      </Link>
    </div>
  );
}
