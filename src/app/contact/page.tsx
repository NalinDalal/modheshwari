"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import Navigation from "@/components/Navigation";
import { Sidebar } from "@/components/ui/Sidebar";
export default function Home() {
  const form = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.current) {
      emailjs
        .sendForm("service_o7uvaom", "template_qr99caa", form.current, {
          publicKey: "Jb1-cOw2aZTU68gyO",
        })
        .then(
          () => {
            setMessage("Your message has been sent successfully.");
            form.current?.reset();
          },
          (error) => {
            setMessage("Failed to send your message. Please try again later.");
            console.error("FAILED...", error.text);
          },
        )
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="overflow-hidden relative min-h-screen text-white bg-gradient-to-br from-purple-900 to-indigo-900">
      <Sidebar />
      <section
        id="contact"
        className="container relative z-10 py-16 px-4 mx-auto md:pl-72"
      >
        <main className="grid gap-8 mt-8 md:grid-cols-1">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-6 bg-white bg-opacity-10 rounded-lg shadow-lg backdrop-blur-md"
          >
            <h3 className="flex items-center mb-4 text-xl font-semibold">
              Mail Us 📧
            </h3>
            <p className="text-gray-300">
              Contact us via email or submit your query below.
            </p>

            <form ref={form} onSubmit={sendEmail} className="mt-4 space-y-2">
              <input
                type="text"
                name="from_name"
                placeholder="Your Name"
                className="p-2 w-full text-black rounded"
                required
              />
              <input
                type="email"
                name="to_email"
                placeholder="Your Email"
                className="p-2 w-full text-black rounded"
                required
              />
              <textarea
                name="message"
                placeholder="Your Message"
                className="p-2 w-full text-black rounded"
                required
              />
              <button
                type="submit"
                className="p-2 w-full text-white bg-blue-500 rounded cursor-pointer"
                disabled={loading}
              >
                {loading ? "Sending..." : "Submit"}
              </button>
            </form>

            {message && <p className="mt-2 text-sm text-white">{message}</p>}

            <a
              href="mailto:nalindalal2004@gmail.com"
              className="block mt-4 text-sm font-semibold text-blue-600 hover:underline"
            >
              Mail us directly from your inbox
            </a>
          </motion.div>
        </main>
      </section>
    </div>
  );
}
