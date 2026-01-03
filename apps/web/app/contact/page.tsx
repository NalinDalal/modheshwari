"use client";

import { useCallback, useMemo, useState } from "react";
import { Bug, HelpCircle, Lightbulb, MessageSquare, Send } from "lucide-react";

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

  const isFormValid = useMemo(() => {
    return (
      formData.name && formData.email && formData.subject && formData.message
    );
  }, [formData]);

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
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      value: "bug" as const,
      label: "Bug",
      icon: Bug,
      gradient: "from-red-500 to-rose-500",
    },
    {
      value: "feature" as const,
      label: "Feature",
      icon: Lightbulb,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      value: "feedback" as const,
      label: "Feedback",
      icon: MessageSquare,
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-sm font-medium text-amber-700 dark:text-amber-300">
          We&apos;re here to help
        </span>

        <h1 className="text-5xl font-bold text-neutral-900 dark:text-white">
          Contact Us
        </h1>

        <p className="text-neutral-600 dark:text-neutral-400">
          Questions, feedback, bugs, or ideas — drop a message.
        </p>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {contactTypes.map((t) => {
          const Icon = t.icon;
          const active = formData.type === t.value;

          return (
            <button
              key={t.value}
              onClick={() => setFormData((p) => ({ ...p, type: t.value }))}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                active
                  ? `bg-gradient-to-r ${t.gradient} text-white border-transparent`
                  : "bg-white dark:bg-neutral-900 hover:border-neutral-400"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
        {submitted ? (
          <div className="py-14 text-center">
            <Send className="w-10 h-10 mx-auto text-green-500" />
            <h2 className="mt-4 text-2xl font-bold">Message Sent</h2>
            <p className="text-neutral-500 mt-2">
              We&apos;ll get back to you shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                className="input"
              />
              <input
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                className="input"
              />
              <input
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Message */}
            <textarea
              name="message"
              rows={6}
              placeholder="Write your message..."
              value={formData.message}
              onChange={handleChange}
              className="input resize-none"
            />

            {/* CTA */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="w-full py-4 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 text-white font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? "Sending…" : "Send Message"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
