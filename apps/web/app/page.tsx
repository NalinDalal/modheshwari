"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  FileText,
  Sparkles,
  ArrowRight,
  Heart,
  Bell,
  Calendar,
} from "lucide-react";

/**
 * Performs  home operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: Users,
      title: "Family Management",
      description:
        "Organize and track family members across generations with ease",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description:
        "Secure permissions for community heads, gotra heads, and family members",
    },
    {
      icon: FileText,
      title: "Record Keeping",
      description:
        "Maintain accurate family records without spreadsheets or confusion",
    },
    {
      icon: Heart,
      title: "Medical Emergency",
      description:
        "Quick access to blood group info and emergency contacts when needed",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description:
        "Stay updated with family events, approvals, and important announcements",
    },
    {
      icon: Calendar,
      title: "Event Planning",
      description:
        "Organize community gatherings with built-in approval workflows",
    },
  ];

  const stats = [
    { value: "500+", label: "Families" },
    { value: "2000+", label: "Members" },
    { value: "50+", label: "Gotras" },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Pink Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #ec4899 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-12 sm:py-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-200 backdrop-blur-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-pink-600" />
          <span className="text-sm text-gray-700">
            Trusted by Modheshwari Community
          </span>
        </motion.div>

        {/* Hero Section */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-bold tracking-tight text-center max-w-5xl"
        >
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Manage Your Family
          </span>
          <br />
          <span className="bg-gradient-to-r from-pink-600 via-pink-500 to-rose-600 bg-clip-text text-transparent">
            Heritage, Digitally
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-gray-700 text-center leading-relaxed"
        >
          A secure, private platform for community leaders and families to
          organize records, manage access, and stay connected across
          generations.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => router.push("/signin")}
            className="group relative px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl font-semibold text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <button
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl font-semibold text-gray-900 hover:bg-white transition-all duration-300"
          >
            Learn More
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-3 gap-8 sm:gap-16"
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <section id="features" className="mt-32 w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-700 text-lg">
              Powerful features designed for community and family management
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative p-6 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl hover:border-pink-300 hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  <div className="inline-flex p-3 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl mb-4">
                    <feature.icon className="w-6 h-6 text-pink-600" />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-gray-700 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="mt-32 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-8 sm:p-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-lg"
          >
            <div className="absolute -top-6 left-8">
              <div className="text-6xl text-pink-300">&quot;</div>
            </div>

            <p className="text-lg sm:text-xl text-gray-800 leading-relaxed mb-6 italic">
              This platform has transformed how we manage our community records.
              The role-based access and approval workflows make everything
              seamless and secure. Highly recommended for any community leader!
            </p>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />
              <div>
                <div className="font-semibold text-gray-900">Rajesh Sharma</div>
                <div className="text-sm text-gray-600">Community Head</div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-12 bg-gradient-to-br from-pink-100/80 to-rose-100/80 backdrop-blur-sm border border-pink-200 rounded-3xl text-center overflow-hidden shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-200/20 to-rose-200/20" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
                Join hundreds of families already managing their heritage with
                our platform
              </p>

              <button
                onClick={() => router.push("/signin")}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Sign In Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="mt-24 text-center text-gray-600 text-sm pb-8">
          <p>© 2026 Modheshwari Community Platform. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
