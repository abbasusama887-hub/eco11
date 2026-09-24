"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/app/context/CartContext";
import { createOrder, validateCoupon } from "@/app/lib/api";
import type { OrderResponse } from "@/app/types/product";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderResponse | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [locationSource, setLocationSource] = useState<"current_location" | "manual">("manual");
  const [locationMessage, setLocationMessage] = useState("Enter coordinates manually or use your current location.");
  const total = Math.max(subtotal - (appliedCoupon?.discount ?? 0), 0);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponBusy(true);
    setCouponMessage(null);
    try {
      const result = await validateCoupon(couponCode, subtotal);
      setAppliedCoupon(result);
      setCouponMessage(`${result.code} applied. You saved Rs ${result.discount.toLocaleString()}.`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(error instanceof Error ? error.message : "That coupon could not be applied.");
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage(null);
  }

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("This browser does not provide location. Enter coordinates manually.");
      return;
    }
    setLocationMessage("Requesting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
        setLocationSource("current_location");
        setLocationMessage("Current location selected. Review the coordinates before placing your order.");
      },
      () => setLocationMessage("Location permission was denied or unavailable. Enter coordinates manually."),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);

    const latitude = Number(form.get("delivery_latitude"));
    const longitude = Number(form.get("delivery_longitude"));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Select a valid delivery location before placing your order.");
      setSubmitting(false);
      return;
    }

    try {
      const order = await createOrder({
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        delivery_area: String(form.get("delivery_area") ?? ""),
        delivery_latitude: latitude,
        delivery_longitude: longitude,
        location_source: locationSource,
        location_accuracy: location?.accuracy,
        notes: String(form.get("notes") ?? ""),
        payment_method: "cod",
        coupon_code: appliedCoupon?.code,
        items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
      });
      setConfirmedOrder(order);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4 py-20 text-center dark:bg-slate-950">
        <div className="pointer-events-none absolute -top-28 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white/80 px-6 py-12 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] sm:px-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/10 text-2xl text-emerald-600 dark:text-emerald-300">
          ✓
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          Order placed
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Order <span className="font-mono">{confirmedOrder.order_number}</span> — we&apos;ll
          call you at the number you provided to confirm delivery.
        </p>
        <p className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
          Total: Rs {Number(confirmedOrder.total).toLocaleString()}
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Continue shopping
          <ArrowIcon />
        </Link>
        {confirmedOrder.address && <p className="mt-6 text-left text-sm text-slate-600 dark:text-slate-300"><span className="font-semibold">Delivery:</span> {confirmedOrder.address}, {confirmedOrder.city}</p>}
        <p className="mt-2 text-left text-sm text-slate-600 dark:text-slate-300">Estimated delivery: 3–5 business days.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href={`/orders/${confirmedOrder.id}`} className="rounded-xl border border-cyan-300 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:text-cyan-300">Track order</Link>
        </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4 py-20 text-center dark:bg-slate-950">
        <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white/80 px-6 py-12 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add something you love before checking out.</p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-500"
        >
          Browse shoes
          <ArrowIcon />
        </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex-1 overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_92%_16%,rgba(37,99,235,0.06),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Almost there</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Checkout</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Complete your details to place your order.</p>
          </div>
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 sm:gap-2 sm:text-xs">
            {["Cart", "Address", "Delivery", "Payment", "Confirmed"].map((step, index) => (
              <span key={step} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${index === 0 ? "bg-emerald-500 text-white" : index === 1 ? "bg-cyan-500 text-slate-950" : "border border-slate-300 text-slate-400 dark:border-white/20"}`}>{index < 1 ? "✓" : index + 1}</span>
                <span className={index > 1 ? "text-slate-400" : undefined}>{step}</span>
                {index < 4 && <span className="h-px w-3 bg-slate-300 dark:bg-white/15 sm:w-6" />}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-7">
        <div className="mb-7 border-b border-slate-200 pb-5 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Delivery details</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Where should we send your order?</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
          <input
            name="full_name"
            required
            placeholder="Full name"
            autoComplete="name"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />
          <input
            name="phone"
            required
            placeholder="Phone number"
            autoComplete="tel"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email (optional)"
            autoComplete="email"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />
          <input
            name="address"
            required
            placeholder="Street address"
            autoComplete="street-address"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />
          <input
            name="city"
            required
            placeholder="City"
            autoComplete="address-level2"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />
          <input
            name="delivery_area"
            placeholder="Area / neighbourhood (optional)"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Delivery location</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{locationMessage}</p>
              </div>
              <button type="button" onClick={captureCurrentLocation} className="rounded-lg border border-cyan-300 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-400/40 dark:text-cyan-300 dark:hover:bg-cyan-400/10">
                Use current location
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input name="delivery_latitude" type="number" step="any" required value={location?.latitude ?? ""} onChange={(event) => { setLocationSource("manual"); setLocation((current) => ({ ...current, latitude: Number(event.target.value), longitude: current?.longitude ?? 0 })); }} placeholder="Latitude" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
              <input name="delivery_longitude" type="number" step="any" required value={location?.longitude || ""} onChange={(event) => { setLocationSource("manual"); setLocation((current) => ({ latitude: current?.latitude ?? 0, longitude: Number(event.target.value) })); }} placeholder="Longitude" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Source: {locationSource === "current_location" ? "Current location" : "Manual"}</p>
          </div>
          <textarea
            name="notes"
            placeholder="Delivery notes (optional)"
            rows={3}
            className="resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />

          <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50/70 p-4 dark:border-cyan-300/15 dark:bg-cyan-300/[0.06]">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Payment method</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-cyan-300/40 bg-white/70 px-4 py-3 dark:bg-white/[0.06]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-4 border-cyan-500 bg-white dark:bg-slate-950" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Cash on delivery</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pay when your order arrives.</p>
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group mt-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
          >
            {submitting ? <><Spinner /> Placing order...</> : <>Place order <ArrowIcon className="transition-transform group-hover:translate-x-1" /></>}
          </button>
          <p className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400"><LockIcon /> Secure checkout</p>
        </form>
      </section>

      <aside className="lg:sticky lg:top-24">
        <div className="rounded-3xl border border-white/15 bg-slate-950/[0.92] p-5 text-white shadow-[0_18px_44px_rgba(2,8,23,0.24),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl sm:p-6">
        <h2 className="text-lg font-semibold">Your order</h2>
        <p className="mt-1 text-xs text-slate-400">{items.length} {items.length === 1 ? "product" : "products"}</p>
        <div className="mt-5 divide-y divide-white/10">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-3 py-4 text-sm first:pt-0">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/10">
                {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <span className="min-w-0 flex-1 text-slate-200">
                <span className="block truncate">{item.productName}</span>
                <span className="block text-xs text-slate-500">Qty {item.quantity} · {item.size} · {item.color}</span>
              </span>
              <span className="shrink-0 font-semibold text-white">
                Rs {(item.unitPrice * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-3 border-t border-white/10 pt-5 text-sm">
          <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex gap-2">
              <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Coupon code" aria-label="Coupon code" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" />
              {appliedCoupon ? <button type="button" onClick={removeCoupon} className="rounded-lg px-2 text-xs font-semibold text-slate-300 hover:text-white">Remove</button> : <button type="button" disabled={couponBusy} onClick={applyCoupon} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-60">{couponBusy ? "..." : "Apply"}</button>}
            </div>
            {couponMessage && <p className={`mt-2 text-xs ${appliedCoupon ? "text-emerald-300" : "text-red-300"}`}>{couponMessage}</p>}
          </div>
          {appliedCoupon && <div className="flex justify-between text-emerald-300"><span>Discount</span><span>- Rs {appliedCoupon.discount.toLocaleString()}</span></div>}
          <div className="flex justify-between text-slate-500"><span>Shipping</span><span>Calculated at checkout</span></div>
        </div>
        <div className="my-5 border-t border-white/10" />
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm font-medium text-slate-300">Total</span>
          <span className="text-2xl font-bold tracking-tight text-white">Rs {total.toLocaleString()}</span>
        </div>
        </div>
      </aside>
        </div>
      </div>
    </main>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" aria-hidden="true" />;
}
