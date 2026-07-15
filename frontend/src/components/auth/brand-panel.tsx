"use client";

import { motion } from "framer-motion";
import {
  Diamond,
  Headphones,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { SpeedyLogo } from "@/components/brand/speedy-logo";

const features = [
  { icon: Diamond, label: "Qualité Premium" },
  { icon: Rocket, label: "Livraison Rapide" },
  { icon: ShieldCheck, label: "Service fiable" },
  { icon: Headphones, label: "Support dédié" },
];

const products = [
  { title: "Flyers", rotate: -8, color: "from-blue-500 to-indigo-600" },
  { title: "Brochures", rotate: -3, color: "from-violet-500 to-purple-600" },
  { title: "Cartes", rotate: 2, color: "from-pink-500 to-rose-500" },
  { title: "Dépliants", rotate: 6, color: "from-amber-400 to-orange-500" },
  { title: "Magazines", rotate: 10, color: "from-cyan-500 to-blue-600" },
];

export function BrandPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, x: -48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden p-7 text-white md:p-10 lg:p-12"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-label="Présentation SpeedyPrint"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,17,36,.88), rgba(12,28,58,.70))",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(236,72,153,.22),transparent_40%)]" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55 }}
          className="w-full max-w-[280px]"
        >
          <SpeedyLogo priority frame="card" className="max-h-16" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mt-5 flex items-center gap-2"
          aria-hidden
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB] shadow-[0_0_12px_#2563EB]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24] shadow-[0_0_12px_#FBBF24]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#EC4899] shadow-[0_0_12px_#EC4899]" />
          <span className="ml-1 text-xs font-medium tracking-wide text-white/60">
            CMJN
          </span>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.65 }}
          className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]"
        >
          <span className="block">Qualité.</span>
          <span className="block">Rapidité.</span>
          <span className="mt-1 block bg-gradient-to-r from-[#2563EB] via-[#EC4899] to-[#F59E0B] bg-clip-text text-transparent">
            Impression parfaite.
          </span>
        </motion.h1>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + index * 0.08, duration: 0.45 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-md transition"
            >
              <feature.icon className="mb-2 h-5 w-5 text-white" strokeWidth={1.8} />
              <div className="text-[11px] font-semibold leading-tight text-white/90">
                {feature.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <div className="flex items-end gap-3 overflow-visible pb-1 pl-1">
          {products.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: product.rotate }}
              transition={{
                delay: 0.85 + index * 0.07,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -10, rotate: 0, scale: 1.05 }}
              className={`hidden h-24 w-[68px] shrink-0 rounded-xl bg-gradient-to-br ${product.color} p-2 shadow-[0_18px_30px_rgba(0,0,0,.45)] first:flex sm:flex sm:h-28 sm:w-[78px]`}
            >
              <div className="flex h-full w-full flex-col justify-between rounded-lg bg-white/15 p-2 backdrop-blur-[2px]">
                <div className="space-y-1">
                  <div className="h-1 w-8 rounded bg-white/70" />
                  <div className="h-1 w-6 rounded bg-white/40" />
                  <div className="h-1 w-7 rounded bg-white/40" />
                </div>
                <div className="text-[10px] font-bold text-white drop-shadow">
                  {product.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
