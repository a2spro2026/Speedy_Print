"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { SpeedyLogo } from "@/components/brand/speedy-logo";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPage() {
  const [panelVisible, setPanelVisible] = useState(false);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#0c1b3a]">
      <div className="absolute inset-0">
        <Image
          src="/login-hero.jpg"
          alt="SPEEDY-Print — imprimerie numérique et offset"
          fill
          priority
          className="object-cover object-left"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,18,40,.55) 0%, rgba(8,18,40,0) 38%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 hidden w-[50%] lg:block"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(12,27,58,.55) 35%, rgba(12,27,58,.8) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,27,58,.35) 0%, rgba(12,27,58,.6) 40%, #0c1b3a 75%)",
          }}
          aria-hidden
        />
      </div>

      <button
        type="button"
        onClick={() => setPanelVisible((v) => !v)}
        title={panelVisible ? "Masquer le panneau" : "Afficher le panneau"}
        className="group absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6 sm:top-6"
        aria-label={
          panelVisible
            ? "Masquer le panneau de connexion"
            : "Afficher le panneau de connexion"
        }
        aria-pressed={!panelVisible}
      >
        <span
          className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr from-[#38bdf8] via-[#f472b6] to-[#fbbf24] opacity-70 blur-md transition group-hover:opacity-100"
          aria-hidden
        />
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#38bdf8] via-[#f472b6] to-[#fbbf24] p-[2px]"
          aria-hidden
        >
          <span className="block h-full w-full rounded-full bg-[#0c1b3a]/85 backdrop-blur-md" />
        </span>
        {panelVisible ? (
          <EyeOff className="relative h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] transition group-hover:scale-110" />
        ) : (
          <Eye className="relative h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] transition group-hover:scale-110" />
        )}
      </button>

      <div className="relative z-10 flex min-h-dvh w-full flex-col lg:flex-row">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col justify-start gap-8 p-6 pt-8 sm:p-10 sm:pt-12 lg:w-[45%] lg:pt-14"
        >
          <div className="w-full max-w-[300px]">
            <SpeedyLogo
              priority
              frame="card"
              className="max-h-[4.75rem] sm:max-h-[5.5rem]"
            />
          </div>
        </motion.div>

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 px-4 py-6 sm:px-8 sm:py-10 lg:w-[55%]">
          <AnimatePresence mode="wait">
            {panelVisible ? (
              <motion.div
                key="panel"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full justify-center"
              >
                <LoginForm />
              </motion.div>
            ) : (
              <motion.div
                key="slogan"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-3xl text-center lg:ml-auto lg:pr-6 lg:text-right xl:pr-12"
              >
                <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl xl:text-8xl">
                  Qualité.
                  <br />
                  Rapidité.
                  <br />
                  <span className="bg-gradient-to-r from-[#38bdf8] via-[#f472b6] to-[#fbbf24] bg-clip-text text-transparent">
                    Impression parfaite.
                  </span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
