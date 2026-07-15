"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SpeedyLogo } from "@/components/brand/speedy-logo";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPage() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#1e3a6e]">
      <div className="absolute inset-0">
        <Image
          src="/hero-print.png"
          alt="Impression professionnelle SpeedyPrint — magazine et explosion CMJN"
          fill
          priority
          className="object-cover object-left"
          sizes="100vw"
        />
        <div
          className="absolute inset-y-0 right-0 hidden w-[58%] lg:block"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #1e3a6e 18%, #1e3a6e 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(30,58,110,.35) 0%, rgba(30,58,110,.55) 40%, #1e3a6e 72%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col lg:flex-row">
        {/* Left — logo + slogan remonté */}
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

          <div className="max-w-md">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
              Qualité.
              <br />
              Rapidité.
              <br />
              <span className="bg-gradient-to-r from-[#38bdf8] via-[#f472b6] to-[#fbbf24] bg-clip-text text-transparent">
                Impression parfaite.
              </span>
            </h1>
          </div>
        </motion.div>

        <div className="flex w-full flex-1 items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:w-[55%]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
