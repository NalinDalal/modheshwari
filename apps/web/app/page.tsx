"use client";

import NavBar from "@repo/ui/NavBar";
import { Button } from "@repo/ui/button";
import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <NavBar />
      <main className="flex flex-col items-center justify-center py-20">
        <h1 className="text-4xl font-bold text-black dark:text-white">
          Welcome to Modheshwari
        </h1>
        {/*well how about like a little bit of animations here
                    like a telegram like paper plane, which animates like making a alpha shape and moves around when you arrive at screen
                    keep it simple, keep ui similar to like apple or vercel or something cool
                */}
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Simplified and clean. Nothing fancy — just clarity.
        </p>
        <div className="mt-8 flex flex-col items center justify-center gap-4 text-center">
          <Link href="/signin" className="">
            <Button variant="primary" className="px-6 py-2">
              Sign In
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
