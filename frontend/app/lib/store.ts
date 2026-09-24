export interface StorePolicyLink {
  label: string;
  href: string;
}

/** The site has one store. Keep its public information in one small config. */
export const STORE = {
  name: "Bazar Store",
  logo: "/logo.jpg",
  verified: true,
  description: "Shoes for every step - running, courts, and the street in between.",
  sells: "Footwear for performance, comfort, and everyday style.",
  deliveryInformation: "Estimated delivery: 3-5 business days.",
  whatsapp: "03047345026",
  email: "usama.developer.500@gmail.com",
  policies: [{ label: "Return & Refund guidance", href: "/help" }] satisfies StorePolicyLink[],
} as const;
