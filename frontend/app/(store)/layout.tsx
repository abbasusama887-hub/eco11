import type { ReactNode } from "react";

/** Cart, Checkout, and Product Detail pages — no site Header or Footer. */
export default function StoreLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
