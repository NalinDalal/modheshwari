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
      <div className="absolute inset-0 bg-jewel-50" />

      <div className="absolute top-20 left-10 w-72 h-72 bg-jewel-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-jewel-emerald/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-jewel-goldLight/5 rounded-full blur-2xl" />

      <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-jewel-100/60 border border-jewel-400/30 backdrop-blur-sm mb-10"
        >
          <Sparkles className="w-4 h-4 text-jewel-500" />
          <span className="text-sm text-jewel-700 font-medium">
            Trusted by Modheshwari Community
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-display font-bold tracking-tight text-center max-w-5xl"
        >
          <span className="bg-gradient-to-r from-jewel-900 via-jewel-800 to-jewel-900 bg-clip-text text-transparent">
            Manage Your Family
          </span>
          <br />
          <span className="bg-gradient-to-r from-jewel-gold via-jewel-goldLight to-jewel-500 bg-clip-text text-transparent">
            Heritage, Digitally
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-jewel-700 text-center leading-relaxed"
        >
          A secure, private platform for community leaders and families to
          organize records, manage access, and stay connected across
          generations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => router.push("/signin")}
            className="group relative px-8 py-4 bg-gradient-to-r from-jewel-gold to-jewel-500 rounded-xl font-semibold text-jewel-deep shadow-lg shadow-jewel-gold/25 hover:shadow-jewel-gold/40 transition-all duration-300 hover:scale-105"
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
            className="px-8 py-4 bg-jewel-100/60 backdrop-blur-sm border border-jewel-400/30 rounded-xl font-semibold text-jewel-deep hover:bg-jewel-100 transition-all duration-300"
          >
            Learn More
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-3 gap-8 sm:gap-16"
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-jewel-gold to-jewel-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-jewel-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <section id="features" className="mt-32 w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-jewel-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-jewel-600 text-lg">
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
                className="group relative p-6 bg-jewel-50/60 backdrop-blur-sm border border-jewel-400/20 rounded-2xl hover:border-jewel-gold/40 hover:shadow-jewel transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-jewel-gold/5 to-jewel-emerald/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  <div className="inline-flex p-3 bg-gradient-to-br from-jewel-200 to-jewel-100 rounded-xl mb-4">
                    <feature.icon className="w-6 h-6 text-jewel-600" />
                  </div>

                  <h3 className="text-xl font-semibold text-jewel-900 mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-jewel-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-32 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-8 sm:p-12 bg-jewel-50/60 backdrop-blur-sm border border-jewel-400/20 rounded-3xl shadow-jewel"
          >
            <div className="absolute -top-6 left-8">
              <div className="text-6xl text-jewel-300">&quot;</div>
            </div>

            <p className="text-lg sm:text-xl text-jewel-800 leading-relaxed mb-6 italic">
              This platform has transformed how we manage our community records.
              The role-based access and approval workflows make everything
              seamless and secure. Highly recommended for any community leader!
            </p>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-jewel-gold to-jewel-500" />
              <div>
                <div className="font-semibold text-jewel-900">
                  Rajesh Sharma
                </div>
                <div className="text-sm text-jewel-600">Community Head</div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-32 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-12 bg-gradient-to-br from-jewel-100/80 to-jewel-200/80 backdrop-blur-sm border border-jewel-gold/30 rounded-3xl text-center overflow-hidden shadow-jewel"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-jewel-gold/10 to-jewel-emerald/10" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-jewel-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-jewel-700 mb-8 max-w-2xl mx-auto">
                Join hundreds of families already managing their heritage with
                our platform
              </p>

              <button
                onClick={() => router.push("/signin")}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-jewel-gold to-jewel-500 text-jewel-deep rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Sign In Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </section>

        <footer className="mt-24 text-center text-jewel-600 text-sm pb-8">
          <p>© 2026 Modheshwari Community Platform. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
