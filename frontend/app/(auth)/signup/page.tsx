"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/app/components/Logo";
import { useAuth } from "@/app/context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [phone, setPhone]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [error, setError]                   = useState("");

  function validate(): string | null {
    if (!name.trim()) return "Full name is required.";
    if (!email.trim() && !phone.trim()) return "Please enter an email address or phone number.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    if (phone.trim() && !/^\+?[\d\s\-()]{7,15}$/.test(phone.trim())) return "Please enter a valid phone number.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) { setError(err); return; }

    startTransition(async () => {
      try {
        await signup(name, email, phone, password);
        router.push("/shop");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Signup failed.");
      }
    });
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Left panel — branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-zinc-900 px-12 py-10 dark:bg-zinc-800">
        <Logo className="[&_span]:text-white" />
        <div>
          <p className="text-4xl font-bold leading-tight text-white">
            Join NDPS.<br />Step into style.
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            Create a free account to shop, save favourites, and track orders.
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} NDPS Store
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 sm:px-10">
        {/* Mobile logo */}
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create account
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Fill in your details to get started.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3.5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Ahmad Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
            </div>

            {/* Email + Phone side by side on desktop */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                  <span className="ml-1 font-normal text-zinc-400 text-xs">(or phone)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Phone
                  <span className="ml-1 font-normal text-zinc-400 text-xs">(or email)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
                />
              </div>
            </div>

            {/* Password + Confirm side by side on desktop */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
                  />
                  <button type="button" aria-label={showPassword ? "Hide" : "Show"} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Confirm
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
                  />
                  <button type="button" aria-label={showConfirm ? "Hide" : "Show"} onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
            >
              {isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800 dark:hover:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.78-1.9 2.08-3.57 3.72-4.84M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.89 11 8a10.94 10.94 0 0 1-1.34 2.64M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12C2.73 7.89 7 4 12 4s9.27 3.89 11 8c-1.73 4.11-6 8-11 8S2.73 16.11 1 12Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
