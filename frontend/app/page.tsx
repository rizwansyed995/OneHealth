"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Database, Activity, Lock, ArrowRight, Users, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-teal-50 via-white to-cyan-50 text-slate-800 overflow-hidden">
      {/* === Background Accents === */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-300/20 rounded-full blur-3xl" />

      {/* === HERO SECTION === */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center text-center pt-36 pb-20 px-6 max-w-4xl"
      >
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight text-slate-800 mb-6">
          A Safer Way to Manage <span className="text-teal-600">Your Health Data</span>
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl">
          OneHealth gives you one secure place for your medical records, doctor visits,
          and lab results — protected, private, and accessible only to you.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/register">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 text-lg shadow-sm hover:shadow-md">
              Get Started <ArrowRight className="ml-2 h-8 w-8 " />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="border-teal-600 text-teal-600 px-6 py-2 text-lg hover:bg-teal-50"
            >
              Already a user?
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* === FEATURES SECTION === */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-8"
      >
        <FeatureCard
          icon={<Database className="w-10 h-10 text-teal-600" />}
          title="Unified Medical Records"
          desc="Access all your test reports, prescriptions, and doctor notes in one organized space."
        />
        <FeatureCard
          icon={<Activity className="w-10 h-10 text-teal-600" />}
          title="Insightful Health Tracking"
          desc="Understand your health trends over time and make data-driven decisions with your doctor."
        />
        <FeatureCard
          icon={<ShieldCheck className="w-10 h-10 text-teal-600" />}
          title="Private & Secure"
          desc="Your data is encrypted, never shared without consent, and stored under HIPAA-grade security."
        />
      </motion.section>

      {/* === HOW IT WORKS SECTION === */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-6 text-center bg-white/70 backdrop-blur-md rounded-3xl shadow-inner max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-bold mb-6 text-slate-800">How It Works</h2>
        <p className="text-slate-600 mb-12 max-w-3xl mx-auto">
          From registration to report access, OneHealth keeps every step simple,
          transparent, and under your control.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            icon={<Users className="w-10 h-10 text-teal-600" />}
            title="1. Register Securely"
            desc="Create your profile and verify identity — all data stays encrypted from the start."
          />
          <StepCard
            icon={<FileText className="w-10 h-10 text-teal-600" />}
            title="2. Upload or Sync Records"
            desc="Add your past reports manually or connect hospital portals for automatic sync."
          />
          <StepCard
            icon={<Lock className="w-10 h-10 text-teal-600" />}
            title="3. Access & Share Privately"
            desc="Grant temporary access to doctors or clinics, or keep it personal — your choice."
          />
        </div>
      </motion.section>

      {/* === FOOTER === */}
      <footer className="py-10 text-center text-slate-500 text-sm mt-10 border-t border-slate-200">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-teal-700">OneHealth</span> — Secure. Connected. Yours.
      </footer>
    </div>
  );
}

// Reusable FeatureCard Component
const FeatureCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-lg">
    <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
      {icon}
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-slate-600">{desc}</p>
    </CardContent>
  </Card>
);

// Reusable StepCard Component
const StepCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all bg-white/80 backdrop-blur-lg">
    <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-slate-600">{desc}</p>
    </CardContent>
  </Card>
);
