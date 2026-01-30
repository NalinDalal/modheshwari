"use client";

import { useCallback, useMemo, useState } from "react";
import { Bug, HelpCircle, Lightbulb, MessageSquare, Send } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

/* ============================== */
/* Types                          */
/* ============================== */

type ContactType = "question" | "bug" | "feature" | "feedback";

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: ContactType;
}

const INITIAL_FORM_STATE: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  type: "question",
};

/* ============================== */
/* Component                      */
/* ============================== */

/**
 * Performs  contact page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function ContactPage() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((p) => ({ ...p, [name]: value }));
    },
    [],
  );

  const isFormValid = useMemo(
    () =>
      !!(
        formData.name &&
        formData.email &&
        formData.subject &&
        formData.message
      ),
    [formData],
  );

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const contactTypes = [
    {
      value: "question" as const,
      label: "Question",
      icon: HelpCircle,
      accent: "from-blue-500 to-cyan-500",
    },
    {
      value: "bug" as const,
      label: "Bug",
      icon: Bug,
      accent: "from-red-500 to-rose-500",
    },
    {
      value: "feature" as const,
      label: "Feature",
      icon: Lightbulb,
      accent: "from-purple-500 to-pink-500",
    },
    {
      value: "feedback" as const,
      label: "Feedback",
      icon: MessageSquare,
      accent: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <DreamySunsetBackground className="px-6 py-16">
      <section className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            We’re listening
          </span>

          <h1 className="text-5xl font-extrabold tracking-tight">
            Contact <span className="text-blue-400">Support</span>
          </h1>

          <p className="text-gray-400 max-w-xl mx-auto">
            Questions, bugs, feature requests, or feedback — send it straight to
            us.
          </p>
        </div>

        {/* Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {contactTypes.map((t) => {
            const Icon = t.icon;
            const active = formData.type === t.value;

            return (
              <button
                key={t.value}
                onClick={() => setFormData((p) => ({ ...p, type: t.value }))}
                className={`relative overflow-hidden rounded-2xl p-4 border transition-all
                ${
                  active
                    ? `bg-gradient-to-r ${t.accent} text-white border-transparent shadow-lg`
                    : "bg-white/5 border-white/10 hover:border-white/30 text-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-semibold">{t.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-xl">
          {submitted ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <Send className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">
                Message sent successfully
              </h2>
              <p className="text-gray-400 mt-2">
                Our team will get back to you shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <Input
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Input
                  name="subject"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <textarea
                name="message"
                rows={6}
                placeholder="Write your message..."
                value={formData.message}
                onChange={handleChange}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="w-full py-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 font-semibold transition-all disabled:opacity-50 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
              >
                {isSubmitting ? "Sending…" : "Send Message"}
              </button>
            </div>
          )}
        </div>
      </section>
    </DreamySunsetBackground>
  );
}

/* ============================== */
/* Small Input Component          */
/* ============================== */

/**
 * Performs  input operation.
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props - Description of props
 * @returns {React.JSX.Element} Description of return value
 */
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
