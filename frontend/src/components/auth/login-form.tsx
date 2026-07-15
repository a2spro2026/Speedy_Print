"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { isAuthenticated, signIn } from "@/lib/auth";
import { SpeedyLogo } from "@/components/brand/speedy-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis.")
    .email("Veuillez saisir un email valide."),
  password: z
    .string()
    .min(1, "Le mot de passe est requis.")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 11.7S6.9 21 12 21c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.48 18.63.1 12.07.1S.1 5.48.1 12.07c0 5.98 4.38 10.93 10.1 11.83v-8.37H7.2v-3.46h3v-2.64c0-2.96 1.76-4.6 4.46-4.6 1.29 0 2.64.23 2.64.23v2.9h-1.49c-1.46 0-1.92.91-1.92 1.84v2.27h3.27l-.52 3.46h-2.75v8.37C19.62 23 24 18.05 24 12.07z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@speedyprint.fr",
      password: "",
      remember: true,
    },
  });

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }
    const remembered = localStorage.getItem("speedyprint.remember");
    if (remembered) {
      setValue("email", remembered);
      setValue("remember", true);
    }
  }, [router, setValue]);

  const remember = watch("remember");

  const onSubmit = async (values: LoginValues) => {
    const result = await signIn(values);

    if (!result.ok) {
      toast.error(result.message ?? "Échec de la connexion.");
      return;
    }

    toast.success("Bienvenue sur SpeedyPrint !");
    router.push("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[480px] rounded-[28px] bg-white/97 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm ring-1 ring-white/40 sm:p-10"
    >
      <div className="mb-7 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 220 }}
          className="mx-auto mb-6 w-full max-w-[280px]"
        >
          <SpeedyLogo
            priority
            frame="card"
            showSlogan
            className="max-h-[72px] sm:max-h-[80px]"
          />
        </motion.div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">
          Bienvenue 👋
        </h2>
        <p className="mt-1.5 text-sm font-medium text-muted">
          SpeedyPrint, la solution qui gère
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="exemple@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="pl-11"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-xs font-medium text-rose-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="px-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs font-medium text-rose-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={!!remember}
              onCheckedChange={(checked) =>
                setValue("remember", checked === true)
              }
            />
            <Label htmlFor="remember" className="cursor-pointer font-normal text-muted">
              Se souvenir de moi
            </Label>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-brand transition hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
            onClick={() =>
              toast.message("Réinitialisation", {
                description:
                  "Contactez l'administrateur pour réinitialiser votre mot de passe.",
              })
            }
          >
            Mot de passe oublié ?
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          ou continuer avec
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() =>
            toast.message("Google", {
              description: "Authentification Google bientôt disponible.",
            })
          }
        >
          <GoogleIcon className="h-4 w-4" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() =>
            toast.message("Facebook", {
              description: "Authentification Facebook bientôt disponible.",
            })
          }
        >
          <FacebookIcon className="h-4 w-4" />
          Facebook
        </Button>
      </div>

      <p className="mt-7 text-center text-sm text-muted">
        Vous n&apos;avez pas de compte ?{" "}
        <button
          type="button"
          className="font-semibold text-brand transition hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
          onClick={() =>
            toast.message("Demande d'accès", {
              description: "Contactez l'administrateur SpeedyPrint.",
            })
          }
        >
          Contactez l&apos;administrateur
        </button>
      </p>
    </motion.div>
  );
}
