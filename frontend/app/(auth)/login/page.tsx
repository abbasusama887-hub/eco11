"use client";

import { Suspense, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/app/components/Logo";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) { setError("Please enter your email or phone number."); return; }
    if (!password)           { setError("Please enter your password."); return; }

    startTransition(async () => {
      try {
        await login(identifier, password);
        router.push(searchParams.get("next") ?? "/shop");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed.");
      }
    });
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Left panel — branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between bg-zinc-900 px-12 py-10 dark:bg-zinc-800">
        <Logo className="[&_span]:text-white" />
        <div>
          <p className="text-4xl font-bold leading-tight text-white">
            Your next step<br />starts here.
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            Sign in to browse, shop, and track every order.
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} NDPS Store
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Welcome back — enter your credentials below.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            {/* Identifier */}
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email or Phone
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="you@example.com or 03001234567"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-blue-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="mt-1 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
            >
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-800 dark:hover:text-blue-400">
              Create one
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
