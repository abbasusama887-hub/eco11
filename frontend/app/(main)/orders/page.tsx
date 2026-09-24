"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/app/lib/api";
import type { CustomerOrder } from "@/app/types/product";
import { useCart } from "@/app/context/CartContext";
import { useToast } from "@/app/components/ToastProvider";

const statusLabels: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing", packed: "Packed",
  assigned: "Delivery Boy Assigned", out_for_delivery: "Out for Delivery", delivered: "Delivered",
  cancelled: "Cancelled", rejected: "Rejected", returned: "Returned",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredOrders = statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter);

  useEffect(() => {
    const loadOrders = () => getMyOrders().then(setOrders).catch((err) => setError(err instanceof Error ? err.message : "Could not load orders.")).finally(() => setLoading(false));
    loadOrders();
    const refreshTimer = window.setInterval(loadOrders, 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Your account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Orders</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Track purchases and manage eligible cancellations.</p>
        </header>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter orders">
          {[{ value: "all", label: "All" }, { value: "confirmed", label: "Confirmed" }, { value: "processing", label: "Processing" }, { value: "packed", label: "Packed" }, { value: "out_for_delivery", label: "Out for Delivery" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" }].map((filter) => (
            <button key={filter.value} type="button" role="tab" aria-selected={statusFilter === filter.value} onClick={() => setStatusFilter(filter.value)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${statusFilter === filter.value ? "bg-cyan-500 text-slate-950" : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"}`}>{filter.label}</button>
          ))}
        </div>
        {loading && <OrderSkeleton />}
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">
              <PackageIcon />
            </div>
            <h2 className="mt-5 text-lg font-semibold">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your completed purchases and delivery updates will appear here.</p>
            <Link href="/shop" className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5">Browse shoes</Link>
          </div>
        )}
        {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-white/15"><p className="text-sm text-slate-500 dark:text-slate-400">No {statusLabels[statusFilter]?.toLowerCase() ?? "matching"} orders found.</p></div>}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold">{order.order_number}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{statusLabels[order.status] ?? order.status}</span>
              </div>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-white/10">
                <div className="text-sm text-slate-600 dark:text-slate-300"><p>{order.order_items.length} {order.order_items.length === 1 ? "product" : "products"}</p><p className="mt-1 text-xs text-slate-500">{order.delivery_city || order.delivery_address}</p></div>
                <div className="flex flex-wrap items-center justify-end gap-3"><p className="text-lg font-bold">Rs {Number(order.total).toLocaleString()}</p><BuyAgainButton items={order.order_items} /><Link href={`/orders/${order.id}`} className="rounded-xl border border-cyan-300 px-4 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-400/40 dark:text-cyan-300 dark:hover:bg-cyan-400/10">View order</Link></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function BuyAgainButton({ items }: { items: CustomerOrder["order_items"] }) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  function buyAgain() {
    let added = 0;
    let unavailable = 0;
    items.forEach((item) => {
      if (item.stock_status === "out_of_stock" || item.stock_quantity < 1) { unavailable += 1; return; }
      addItem({ variantId: item.variant_id, productSlug: item.product_slug, productName: item.product_name, brandName: item.brand_name, thumbnail: item.product_image ?? null, size: item.size, color: item.color, unitPrice: Number(item.current_price), maxStock: item.stock_quantity }, item.quantity);
      added += 1;
    });
    if (added) showToast({ title: "Added to cart", description: `${added} purchased ${added === 1 ? "item" : "items"} added at current prices.` });
    if (unavailable) showToast({ title: "Some items unavailable", description: `${unavailable} item${unavailable === 1 ? " is" : "s are"} currently out of stock.`, variant: "info" });
  }

  return <button type="button" onClick={buyAgain} className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Buy again</button>;
}

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-2.5 w-40 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-white/10">
            <div className="space-y-2">
              <div className="h-2.5 w-28 rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-2.5 w-36 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-8 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PackageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 4v8m7-3.5-7 4.5-7-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
