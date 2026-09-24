import type {
  Brand,
  Category,
  OrderPayload,
  OrderResponse,
  ProductDetail,
  ProductFilters,
  ProductListResponse,
  CustomerOrder,
  CustomerOrderDetail,
  CouponResult,
  CustomerAddress,
  CustomerNotification,
  ShippingQuote,
} from "@/app/types/product";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const requestInit: RequestInit = {
    ...init,
    cache: "no-store",
  };

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, requestInit);
  } catch {
    throw new Error(
      "Could not reach the server. Make sure the Django backend is running.",
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);

    const message =
      body && typeof body === "object"
        ? Object.values(body).flat().join(" ")
        : `Request failed (${res.status})`;

    throw new Error(message || `Request failed (${res.status})`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function apiRegister(
  name: string,
  email: string,
  phone: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export async function apiLogin(
  identifier: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
}

export async function apiLogout(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });
  } catch {
    // Ignore — we always clear local state regardless
  }
}

export async function apiMe(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me/", {
    headers: { Authorization: `Token ${token}` },
  });
}

// ---------------------------------------------------------------------------
// Stock Alerts
// ---------------------------------------------------------------------------

export async function apiCreateStockAlert(
  productId: number,
  email: string,
  variantId?: number,
): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>("/api/stock-alerts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: productId,
      variant: variantId ?? null,
      email,
    }),
  });
}

export async function getFeaturedProducts(limit = 8): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>(`/api/products/?featured=true&limit=${limit}`);
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return apiFetch<ProductListResponse>(`/api/products/${query ? `?${query}` : ""}`);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/api/products/${slug}/`);
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>(`/api/categories/`);
}

export async function getBrands(): Promise<Brand[]> {
  return apiFetch<Brand[]>(`/api/brands/`);
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  return apiFetch<CouponResult>("/api/coupons/validate/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function submitReview(
  slug: string,
  review: { customer_name: string; customer_email?: string; rating: number; title?: string; comment: string },
) {
  return apiFetch(`/api/products/${slug}/reviews/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });
}

export async function updateProfile(payload: { name: string; email: string; phone: string }): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/profile/", { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
}

export async function changePassword(payload: { current_password: string; new_password: string; confirm_password: string }): Promise<{ token: string; detail: string }> {
  return apiFetch<{ token: string; detail: string }>("/api/auth/password/", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
}

export async function getAddresses(): Promise<CustomerAddress[]> {
  return apiFetch<CustomerAddress[]>("/api/addresses/", { headers: authHeaders() });
}

export async function createAddress(payload: Omit<CustomerAddress, "id" | "is_default"> & { is_default?: boolean }): Promise<CustomerAddress> {
  return apiFetch<CustomerAddress>("/api/addresses/", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
}

export async function updateAddress(id: number, payload: Partial<CustomerAddress>): Promise<CustomerAddress> {
  return apiFetch<CustomerAddress>(`/api/addresses/${id}/`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
}

export async function deleteAddress(id: number): Promise<void> {
  await apiFetch(`/api/addresses/${id}/`, { method: "DELETE", headers: authHeaders() });
}

export async function setDefaultAddress(id: number): Promise<CustomerAddress> {
  return apiFetch<CustomerAddress>(`/api/addresses/${id}/default/`, { method: "POST", headers: authHeaders() });
}

export async function getNotifications(): Promise<CustomerNotification[]> {
  return apiFetch<CustomerNotification[]>("/api/notifications/", { headers: authHeaders() });
}

export async function markNotificationRead(id?: number): Promise<void> {
  await apiFetch(id ? `/api/notifications/${id}/read/` : "/api/notifications/read/", { method: "POST", headers: authHeaders() });
}

export async function getShippingQuote(subtotal: number): Promise<ShippingQuote> {
  return apiFetch<ShippingQuote>("/api/shipping/quote/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subtotal }) });
}

// ---------------------------------------------------------------------------
// Hero Slides
// ---------------------------------------------------------------------------

export interface HeroSlide {
  id: number;
  badge: string;
  headline: string;
  sub: string;
  cta_label: string;
  cta_href: string;
  bg_image: string | null;
  accent_color: string;
  display_order: number;
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return apiFetch<HeroSlide[]>("/api/hero-slides/");
}

export async function createOrder(payload: OrderPayload): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/api/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("ndps_token");
  return token ? { Authorization: `Token ${token}` } : {};
}

export async function getMyOrders(): Promise<CustomerOrder[]> {
  const response = await apiFetch<CustomerOrder[] | { results: CustomerOrder[] }>("/api/orders/mine/", { headers: authHeaders() });
  return Array.isArray(response) ? response : response.results;
}

export function getMyOrder(orderId: number): Promise<CustomerOrderDetail> {
  return apiFetch<CustomerOrderDetail>(`/api/orders/${orderId}/`, { headers: authHeaders() });
}

export function cancelMyOrder(orderId: number, reason: string, notes = ""): Promise<CustomerOrderDetail> {
  return apiFetch<CustomerOrderDetail>(`/api/orders/${orderId}/cancel/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reason, notes }),
  });
}
