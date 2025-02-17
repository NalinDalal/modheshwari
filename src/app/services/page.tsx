"use client";
import { Sidebar } from "@/components/ui/Sidebar";
export default function Services() {
  return (
    <div className="p-8 min-h-screen text-white bg-gradient-to-br from-purple-900 to-indigo-900">
      <Sidebar />
      <div className="p-6 mx-auto max-w-3xl bg-white bg-opacity-10 rounded-lg shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-center">Services</h1>
        <p className="text-lg">
          This website was made by Nalin Dalal, the main aim was to create a
          website that would help to take the visitors use all the services of
          the community via internet. build using Next. js, Tailwind CSS and
          TypeScript.
        </p>
        <h2 className="mt-4 text-2xl font-semibold">Significance</h2>
        <p className="text-lg">
          Website maybe used for various reasons like medical emergencies,
          various event registrations and what not.
          <br />
          tell about various servies
        </p>
      </div>
    </div>
  );
}
