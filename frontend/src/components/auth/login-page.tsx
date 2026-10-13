"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { SpeedyLogo } from "@/components/brand/speedy-logo";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPage() {
  const [panelVisible, setPanelVisible] = useState(true);

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
        className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-6 sm:top-6"
        aria-label={
          panelVisible
            ? "Masquer le panneau de connexion"
            : "Afficher le panneau de connexion"
        }
        aria-pressed={!panelVisible}
      >
        {panelVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {panelVisible ? "Masquer" : "Se connecter"}
        </span>
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.35 }}
                className="max-w-md text-center lg:text-left"
              >
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
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
