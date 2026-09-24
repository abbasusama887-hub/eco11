"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/context/AuthContext";
import { createAddress, deleteAddress, getAddresses, getMyOrders, getNotifications, markNotificationRead, setDefaultAddress, updateAddress } from "@/app/lib/api";
import type { CustomerAddress, CustomerNotification, CustomerOrder } from "@/app/types/product";
import { useCart } from "@/app/context/CartContext";
import { useToast } from "@/app/components/ToastProvider";

const emptyAddress = { label: "Home", full_name: "", phone: "", address: "", city: "", delivery_area: "" };

export default function AccountPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const [password, setPassword] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerAddress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAddresses(), getNotifications(), getMyOrders()]).then(([addressData, notificationData, orderData]) => { setAddresses(addressData); setNotifications(notificationData); setOrders(orderData); }).catch(() => setError("We could not load your account details."));
  }, []);

  function clearFeedback() { setMessage(null); setError(null); }

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); clearFeedback();
    try { await updateProfile(profile); setMessage("Profile updated successfully."); } catch (err) { setError(err instanceof Error ? err.message : "We could not update your profile."); }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault(); clearFeedback();
    if (password.new_password !== password.confirm_password) { setError("New passwords do not match."); return; }
    try { await changePassword(password); setPassword({ current_password: "", new_password: "", confirm_password: "" }); setMessage("Password changed successfully."); } catch (err) { setError(err instanceof Error ? err.message : "We could not change your password."); }
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault(); clearFeedback();
    try {
      const saved = editingAddress ? await updateAddress(editingAddress, addressForm) : await createAddress(addressForm);
      setAddresses((current) => editingAddress ? current.map((address) => address.id === saved.id ? saved : address) : [...current, saved]);
      setAddressForm(emptyAddress); setEditingAddress(null); setMessage("Address saved successfully.");
    } catch (err) { setError(err instanceof Error ? err.message : "We could not save this address."); }
  }

  async function removeAddress() {
    if (!pendingDelete) return;
    try { await deleteAddress(pendingDelete.id); setAddresses((current) => current.filter((address) => address.id !== pendingDelete.id)); setMessage("Address deleted."); } catch (err) { setError(err instanceof Error ? err.message : "We could not delete this address."); }
    setPendingDelete(null);
  }

  async function makeDefault(id: number) {
    try { const updated = await setDefaultAddress(id); setAddresses((current) => current.map((address) => ({ ...address, is_default: address.id === updated.id }))); } catch { setError("We could not set that address as default."); }
  }

  async function markRead(id?: number) {
    await markNotificationRead(id);
    setNotifications((current) => current.map((notification) => id ? notification.id === id ? { ...notification, is_read: true } : notification : { ...notification, is_read: true }));
  }

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <header><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Your account</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Account settings</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage your profile, delivery addresses, security, and notifications.</p>{notifications.some((notification) => !notification.is_read) && <p className="mt-3 text-xs font-semibold text-cyan-700 dark:text-cyan-300">{notifications.filter((notification) => !notification.is_read).length} unread notification{notifications.filter((notification) => !notification.is_read).length === 1 ? "" : "s"}</p>}</header>
        {(message || error) && <p role={error ? "alert" : undefined} className={`mt-5 rounded-xl p-4 text-sm ${error ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300" : "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>{error ?? message}</p>}
        <RecentlyPurchased orders={orders} />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7"><h2 className="text-lg font-bold">Profile</h2><form onSubmit={saveProfile} className="mt-5 space-y-3"><input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Full name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder="Email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="Phone" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">Save profile</button></form></section>
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7"><h2 className="text-lg font-bold">Security</h2><form onSubmit={savePassword} className="mt-5 space-y-3"><input required type="password" autoComplete="current-password" value={password.current_password} onChange={(event) => setPassword({ ...password, current_password: event.target.value })} placeholder="Current password" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input required minLength={8} type="password" autoComplete="new-password" value={password.new_password} onChange={(event) => setPassword({ ...password, new_password: event.target.value })} placeholder="New password (8+ characters)" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input required minLength={8} type="password" autoComplete="new-password" value={password.confirm_password} onChange={(event) => setPassword({ ...password, confirm_password: event.target.value })} placeholder="Confirm new password" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">Change password</button></form></section>

          <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7 lg:col-span-2"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">Addresses</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save delivery details for faster checkout.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{addresses.map((address) => <div key={address.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{address.label}</p>{address.is_default && <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300">Default</span>}</div><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{address.full_name}<br />{address.address}<br />{address.delivery_area && `${address.delivery_area}, `}{address.city}<br />{address.phone}</p><div className="mt-4 flex gap-3 text-xs font-semibold"><button type="button" onClick={() => { setEditingAddress(address.id); setAddressForm({ label: address.label, full_name: address.full_name, phone: address.phone, address: address.address, city: address.city, delivery_area: address.delivery_area }); }} className="text-cyan-700 hover:text-cyan-500">Edit</button>{!address.is_default && <button type="button" onClick={() => makeDefault(address.id)} className="text-cyan-700 hover:text-cyan-500">Set default</button>}<button type="button" onClick={() => setPendingDelete(address)} className="text-red-600 hover:text-red-500">Delete</button></div></div>)}</div><form onSubmit={saveAddress} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><input required value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="Label, e.g. Home" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input required value={addressForm.full_name} onChange={(event) => setAddressForm({ ...addressForm, full_name: event.target.value })} placeholder="Full name" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input required value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} placeholder="Phone" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input required value={addressForm.address} onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })} placeholder="Street address" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white sm:col-span-2" /><input required value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} placeholder="City" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><input value={addressForm.delivery_area} onChange={(event) => setAddressForm({ ...addressForm, delivery_area: event.target.value })} placeholder="Area (optional)" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950">{editingAddress ? "Update address" : "Add address"}</button>{editingAddress && <button type="button" onClick={() => { setEditingAddress(null); setAddressForm(emptyAddress); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-white/10">Cancel edit</button>}</form></section>

          <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7 lg:col-span-2"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Notifications</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Updates from your real orders and account activity.</p></div><button type="button" onClick={() => markRead()} className="text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">Mark all as read</button></div><div className="mt-5 space-y-2">{notifications.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">You have no notifications yet.</p>}{notifications.map((notification) => <button key={notification.id} type="button" onClick={() => markRead(notification.id)} className={`w-full rounded-2xl border p-4 text-left transition ${notification.is_read ? "border-slate-200 dark:border-white/10" : "border-cyan-200 bg-cyan-50/60 dark:border-cyan-300/20 dark:bg-cyan-300/10"}`}><div className="flex items-start justify-between gap-3"><span className="font-semibold">{notification.title}</span>{!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />}</div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p><p className="mt-2 text-[10px] text-slate-400">{new Date(notification.created_at).toLocaleString()}</p></button>)}</div></section>
        </div>
      </div>
      {pendingDelete && <ConfirmDialog title="Delete this address?" description={`${pendingDelete.label} will be removed from your saved addresses.`} confirmLabel="Delete" onConfirm={removeAddress} onCancel={() => setPendingDelete(null)} />}
    </main>
  );
}

function RecentlyPurchased({ orders }: { orders: CustomerOrder[] }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const seen = new Set<number>();
  const items = orders.filter((order) => order.status === "delivered").flatMap((order) => order.order_items).filter((item) => { if (seen.has(item.variant_id)) return false; seen.add(item.variant_id); return true; }).slice(0, 4);

  function buyAgain(item: CustomerOrder["order_items"][number]) {
    if (item.stock_status === "out_of_stock" || item.stock_quantity < 1) { showToast({ title: "Item unavailable", description: `${item.product_name} is currently out of stock.`, variant: "info" }); return; }
    addItem({ variantId: item.variant_id, productSlug: item.product_slug, productName: item.product_name, brandName: item.brand_name, thumbnail: item.product_image ?? null, size: item.size, color: item.color, unitPrice: Number(item.current_price), maxStock: item.stock_quantity });
  }

  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Your history</p><h2 className="mt-2 text-xl font-bold">Recently purchased</h2></div><Link href="/orders" className="text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">View orders</Link></div>{items.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">Completed purchases will appear here for quick reordering.</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <div key={item.variant_id} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">{item.product_image && <Image src={item.product_image} alt={item.product_name} fill sizes="220px" className="object-cover" />}</div><Link href={`/products/${item.product_slug}`} className="mt-3 block truncate text-sm font-semibold hover:text-cyan-700">{item.product_name}</Link><p className="mt-1 text-xs text-slate-500">Rs {Number(item.current_price).toLocaleString()} · {item.size}</p><button type="button" onClick={() => buyAgain(item)} className="mt-3 w-full rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950">Buy again</button></div>)}</div>}</section>;
}
