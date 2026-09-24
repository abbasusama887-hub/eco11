export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  product_count: number;
}

export interface Size {
  id: number;
  system: "UK" | "US" | "EU";
  value: string;
}

export interface Color {
  id: number;
  name: string;
  hex_code: string;
}

export interface ProductVariant {
  id: number;
  size: Size;
  color: Color;
  variant_sku: string;
  stock_quantity: number;
  stock_status: "out_of_stock" | "low_stock" | "in_stock";
  effective_price: number;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

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

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand: Brand;
  category: Category;
  gender: "men" | "women" | "kids" | "unisex";
  price: string;
  discount_price: string | null;
  current_price: number;
  discount_percent: number;
  thumbnail: string | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_in_stock: boolean;
  stock_status?: "out_of_stock" | "low_stock" | "in_stock";
  average_rating: number | null;
}

export interface ProductDetail extends Product {
  short_description: string;
  description: string;
  material: string;
  sole_type: string;
  style_code: string;
  weight_grams: number | null;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: Review[];
}

export interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  gender?: string;
  min_price?: string;
  max_price?: string;
  ordering?: "price_asc" | "price_desc" | "newest" | "rating" | "popular";
  size?: string;
  rating?: string;
  availability?: "in_stock" | "out_of_stock";
  featured?: "true";
  limit?: number;
}

export interface OrderItemInput {
  variant_id: number;
  quantity: number;
}

export type PaymentMethod = "cod" | "jazzcash" | "easypaisa";

export interface OrderPayload {
  full_name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  delivery_area?: string;
  delivery_latitude: number;
  delivery_longitude: number;
  location_source: "current_location" | "manual";
  location_accuracy?: number;
  notes?: string;
  payment_method: PaymentMethod;
  coupon_code?: string;
  items: OrderItemInput[];
}

export interface OrderResponse {
  id: number;
  order_number: string;
  status: string;
  full_name: string;
  subtotal: string;
  total: string;
  discount_total?: string;
  address?: string;
  city?: string;
  delivery_area?: string;
  delivery_latitude: string | null;
  delivery_longitude: string | null;
  location_source: string;
  order_items: {
    id: number;
    variant_id: number;
    product_name: string;
    product_slug: string;
    brand_name: string;
    product_image?: string | null;
    size: string;
    color: string;
    quantity: number;
    unit_price: string;
    current_price: number;
    stock_quantity: number;
    stock_status: "out_of_stock" | "low_stock" | "in_stock";
    line_total: number;
  }[];
}

export interface CouponResult {
  code: string;
  description: string;
  discount: number;
}

export interface CustomerAddress {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  delivery_area: string;
  is_default: boolean;
}

export interface CustomerNotification {
  id: number;
  notification_type: "order" | "stock" | "promo";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  order: number | null;
}

export interface ShippingQuote {
  threshold: number;
  shipping: number;
  free_shipping: boolean;
  estimate: string;
}

export interface CustomerOrder {
  id: number;
  order_number: string;
  created_at: string;
  status: string;
  order_items: OrderResponse["order_items"];
  total: string;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  delivery_city: string;
  assigned_delivery_boy: number | null;
  can_cancel: boolean;
  cancellation_deadline: string;
}

export interface CustomerOrderDetail extends CustomerOrder {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  delivery_area: string;
  delivery_latitude: string | null;
  delivery_longitude: string | null;
  notes: string;
  subtotal: string;
  delivery_charge: string;
  discount_total: string;
  status_history: { status: string; timestamp: string; note: string }[];
  delivery_boy: {
    full_name: string;
    employee_id: string;
    vehicle: string;
    vehicle_registration_number: string | null;
    phone: string;
    whatsapp: string;
    status: string;
  } | null;
  active_delivery_contact: { phone: string; whatsapp: string } | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  cancellation_notes: string;
}

export interface PaymentInitiateResponse {
  action_url: string;
  fields: Record<string, string>;
}

export interface OrderStatusResponse {
  order_number: string;
  status: string;
  total: string;
  payment: {
    gateway: PaymentMethod;
    status: "pending" | "completed" | "failed" | "cancelled";
    amount: string;
    gateway_transaction_id: string;
  } | null;
}