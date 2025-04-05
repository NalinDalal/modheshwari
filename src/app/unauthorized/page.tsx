"use client";
import Link from "next/Link";
export default function unAuthorized() {
  return (
    <div className="flex justify-center items-center min-h-screen text-white bg-gradient-to-br from-indigo-700 to-purple-900">
      <div className="p-8 max-w-md text-center rounded-2xl shadow-lg bg-white/10 backdrop-blur-md">
        <h1 className="mb-4 text-3xl font-bold">Access Denied</h1>
        <p className="mb-6 text-lg">
          You’re <span className="font-semibold">not authorized</span> to view
          this page.
        </p>
        <Link
          href="/login"
          className="inline-block py-2 px-6 font-semibold text-white bg-indigo-500 rounded-full transition-colors duration-200 hover:bg-indigo-600"
        >
          Go to Login
        </Link>
      </div>{" "}
    </div>
  );
}
