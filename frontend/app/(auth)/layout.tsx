import type { ReactNode } from "react";

/** Auth pages (login, signup) — full-screen, no Header or Footer. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
