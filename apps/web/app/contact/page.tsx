"use client";

import { useState } from "react";
import {
  Heart,
  Mail,
  MessageCircle,
  Smartphone,
  Send,
  Bug,
  HelpCircle,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

/**
 * Performs  contact page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "question",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        type: "question",
      });
      setSubmitted(false);
    }, 3000);
  };

  const contactTypes = [
    {
      value: "question",
      label: "Question",
      icon: HelpCircle,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      value: "bug",
      label: "Bug Report",
      icon: Bug,
      gradient: "from-red-500 to-rose-500",
    },
    {
      value: "feature",
      label: "Feature Request",
      icon: Lightbulb,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      value: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/mandala.svg')] bg-center bg-no-repeat bg-contain opacity-5 scale-[2] animate-pulse-slow" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-400/20 via-transparent to-rose-400/20 blur-3xl animate-gradient-shift" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-amber-200/50 dark:border-gray-700/50">
        <div className="px-4 sm:px-8 lg:px-12 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-rose-600 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Modheshwari
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/about"
              className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
            >
              About
            </Link>
            <Link
              href="/features"
              className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
            >
              Features
            </Link>
            <Link
              href="/contact"
              className="text-amber-700 dark:text-amber-400 font-medium"
            >
              Contact
            </Link>
          </div>

          <Link
            href="/signin"
            className="text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium transition"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative flex-1 px-4 py-20 sm:py-28">
        {/* Floating decorative blobs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-rose-300/20 rounded-full blur-3xl animate-float-delayed" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50 dark:border-amber-700/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                We&apos;re here to help
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 bg-clip-text text-transparent leading-tight">
              Get in Touch
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Found something wrong? Have a question? Found something else?
              <br />
              <span className="font-semibold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                I would love to hear from you!
              </span>
              <br />I love to solve problems and squash bugs 🐛
            </p>
          </div>

          {/* Contact Type Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {contactTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: type.value }))
                  }
                  className={`group p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                    formData.type === type.value
                      ? `bg-gradient-to-r ${type.gradient} border-transparent text-white shadow-lg`
                      : "bg-white/80 dark:bg-gray-800/80 border-amber-100/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 backdrop-blur-sm"
                  }`}
                >
                  <IconComponent
                    className={`w-8 h-8 mb-3 mx-auto ${formData.type === type.value ? "text-white" : "text-amber-600 dark:text-amber-400"}`}
                  />
                  <div className="text-sm font-semibold">{type.label}</div>
                </button>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-100/50 dark:border-gray-700/50 p-8 md:p-12 mb-12">
            {submitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
                  <Send className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Message Sent!
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-400">
                  Thanks for reaching out. I&apos;ll get back to you soon!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Name & Email Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-amber-500 dark:focus:border-rose-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-amber-500 dark:focus:border-rose-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-amber-500 dark:focus:border-rose-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell me all about it..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-amber-500 dark:focus:border-rose-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full inline-flex items-center justify-center gap-3 py-4 px-8 rounded-full font-bold text-lg text-white transition-all duration-300 transform hover:scale-105 shadow-xl ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 hover:shadow-2xl hover:shadow-amber-500/50"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Contact Options */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Mail,
                title: "Email",
                value: "hello@modheshwari.com",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: MessageCircle,
                title: "Live Chat",
                value: "Available 9 AM - 6 PM",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Smartphone,
                title: "Social Media",
                value: "@modheshwari",
                gradient: "from-rose-500 to-orange-500",
              },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.title}
                  className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-amber-100/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${option.gradient} rounded-xl shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-t from-amber-100/50 via-orange-50/50 to-rose-50/50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 border-t border-amber-200/40 dark:border-gray-800 py-12">
        <div className="px-4 sm:px-8 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-rose-600 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Modheshwari
            </span>
          </div>
          <p className="text-sm text-amber-900 dark:text-gray-400 mb-6">
            Made with <span className="inline-block animate-pulse">❤️</span> —
            © {new Date().getFullYear()} Modheshwari. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </footer>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.08;
          }
        }
        @keyframes gradient-shift {
          0%,
          100% {
            transform: translateX(0%) translateY(0%);
          }
          50% {
            transform: translateX(10%) translateY(10%);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-gradient-shift {
          animation: gradient-shift 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
