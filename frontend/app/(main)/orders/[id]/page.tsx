"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cancelMyOrder, getMyOrder } from "@/app/lib/api";
import type { CustomerOrderDetail } from "@/app/types/product";

const timeline = ["confirmed", "processing", "packed", "out_for_delivery", "delivered"];
const labels: Record<string, string> = { confirmed: "Order Confirmed", processing: "Processing", packed: "Packed", out_for_delivery: "Out for Delivery", delivered: "Delivered", pending: "Order placed", assigned: "Delivery boy assigned", cancelled: "Cancelled", rejected: "Rejected", returned: "Returned" };

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("Changed my mind");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadOrder = () => getMyOrder(Number(params.id)).then(setOrder).catch((err) => setError(err instanceof Error ? err.message : "Could not load this order.")).finally(() => setLoading(false));
    loadOrder();
    const refreshTimer = window.setInterval(loadOrder, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [params.id]);

  async function cancelOrder() {
    if (!order) return;
    setCancelling(true);
    try {
      setOrder(await cancelMyOrder(order.id, reason));
      setCancelOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel this order.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950"><p className="mx-auto max-w-4xl text-sm text-slate-500">Loading order...</p></main>;
  if (error || !order) return <main className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950"><p className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">{error ?? "Order not found."}</p></main>;

  const currentIndex = timeline.indexOf(order.status);
  const isTerminal = ["cancelled", "rejected", "returned"].includes(order.status);
  const contact = order.active_delivery_contact;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <Link href="/orders" className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">← All orders</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-sm font-bold">{order.order_number}</p><p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</p></div><span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{labels[order.status] ?? order.status}</span></div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-7">
          <h2 className="text-lg font-bold">Order tracking</h2>
          {isTerminal ? (
            <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm font-semibold dark:bg-white/[0.06]">{labels[order.status]}</p>
          ) : (
            <div className="mt-6">
              <div className="grid gap-3 sm:grid-cols-5">
                {timeline.map((status, index) => {
                  const stepIndex = timeline.indexOf(order.status) >= 0 ? timeline.indexOf(order.status) : 0;
                  const isActive = index <= stepIndex;
                  return (
                    <div key={status} className="relative">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold ${isActive ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500"}`}>
                          {index + 1}
                        </div>
                        <div className={`h-px flex-1 ${isActive ? "bg-cyan-500" : "bg-slate-200 dark:bg-white/10"}`} />
                      </div>
                      <p className={`mt-2 text-[10px] font-medium leading-4 sm:text-xs ${isActive ? "text-cyan-700 dark:text-cyan-300" : "text-slate-400"}`}>
                        {labels[status]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-7"><h2 className="text-lg font-bold">Products</h2><div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">{order.order_items.map((item) => <div key={item.id} className="flex gap-3 py-4 first:pt-0"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/10">{item.product_image && <img src={item.product_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.product_name}</p><p className="mt-1 text-xs text-slate-500">{item.size} · {item.color} · Qty {item.quantity}</p></div><p className="text-sm font-bold">Rs {Number(item.line_total).toLocaleString()}</p></div>)}</div></section>
          <aside className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><h2 className="font-bold">Delivery</h2><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{order.delivery_address}<br />{order.delivery_area && `${order.delivery_area}, `}{order.delivery_city}</p>{order.delivery_boy && <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery boy</p><p className="mt-2 font-semibold">{order.delivery_boy.full_name}</p><p className="text-xs text-slate-500">{order.delivery_boy.employee_id} · {order.delivery_boy.vehicle}</p>{contact && <div className="mt-3 flex gap-2"><a href={`tel:${contact.phone}`} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950">Call</a><a href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">WhatsApp</a></div>}</div>}</section><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><div className="flex justify-between text-sm"><span>Subtotal</span><span>Rs {Number(order.subtotal).toLocaleString()}</span></div><div className="mt-2 flex justify-between text-sm"><span>Delivery</span><span>Rs {Number(order.delivery_charge).toLocaleString()}</span></div><div className="mt-4 flex justify-between border-t border-slate-100 pt-4 font-bold dark:border-white/10"><span>Total</span><span>Rs {Number(order.total).toLocaleString()}</span></div><p className="mt-3 text-xs text-slate-500">Payment: {order.payment_method} · {order.payment_status}</p></section></aside>
        </div>
        {order.can_cancel && <button type="button" onClick={() => setCancelOpen(true)} className="mt-6 rounded-xl border border-red-300 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10">Cancel order</button>}
        {cancelOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white"><h2 className="text-lg font-bold">Cancel this order?</h2><p className="mt-2 text-sm text-slate-500">This keeps the order record but marks it as cancelled.</p><select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"><option>Changed my mind</option><option>Ordered by mistake</option><option>Found another product</option><option>Wrong address</option><option>Other</option></select><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setCancelOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500">Keep order</button><button type="button" disabled={cancelling} onClick={cancelOrder} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{cancelling ? "Cancelling..." : "Cancel order"}</button></div></div></div>}
      </div>
    </main>
  );
}
