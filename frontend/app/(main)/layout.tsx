import type { ReactNode } from "react";
import StoreChrome from "@/app/components/StoreChrome";

/** Shared layout for all storefront pages — includes Header and Footer. */
export default function MainLayout({ children }: { children: ReactNode }) {
  return <StoreChrome>{children}</StoreChrome>;
}
