from django.urls import path

from . import views

urlpatterns = [
    # ── Catalog ────────────────────────────────────────────────────────────
    path("products/", views.ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("brands/", views.BrandListView.as_view(), name="brand-list"),
    path("coupons/validate/", views.CouponValidateView.as_view(), name="coupon-validate"),
    path("shipping/quote/", views.ShippingQuoteView.as_view(), name="shipping-quote"),
    path("products/<slug:slug>/reviews/", views.ReviewCreateView.as_view(), name="review-create"),

    # ── Orders ─────────────────────────────────────────────────────────────
    path("orders/", views.OrderCreateView.as_view(), name="order-create"),
    path("orders/mine/", views.MyOrderListView.as_view(), name="my-orders"),
    path("orders/<int:pk>/", views.MyOrderDetailView.as_view(), name="my-order-detail"),
    path("orders/<int:pk>/cancel/", views.MyOrderCancelView.as_view(), name="my-order-cancel"),
    path("orders/<int:pk>/eligible-delivery-boys/", views.OrderEligibleDeliveryBoysView.as_view(), name="order-eligible-delivery-boys"),
    path("orders/<int:pk>/assign-delivery-boy/", views.OrderAssignmentView.as_view(), name="order-assign-delivery-boy"),
    path("delivery/location/", views.DeliveryLocationView.as_view(), name="delivery-location"),

    # ── Auth ───────────────────────────────────────────────────────────────
    path("auth/register/", views.RegisterView.as_view(), name="auth-register"),
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", views.MeView.as_view(), name="auth-me"),
    path("auth/profile/", views.ProfileUpdateView.as_view(), name="auth-profile-update"),
    path("auth/password/", views.PasswordChangeView.as_view(), name="auth-password-change"),

    # ── Customer data ─────────────────────────────────────────────────────
    path("addresses/", views.AddressListCreateView.as_view(), name="address-list-create"),
    path("addresses/<int:pk>/", views.AddressDetailView.as_view(), name="address-detail"),
    path("addresses/<int:pk>/default/", views.AddressDefaultView.as_view(), name="address-default"),
    path("notifications/", views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/read/", views.NotificationReadView.as_view(), name="notification-read-all"),
    path("notifications/<int:pk>/read/", views.NotificationReadView.as_view(), name="notification-read"),

    # ── Stock Alerts ───────────────────────────────────────────────────────
    path("stock-alerts/", views.StockAlertCreateView.as_view(), name="stock-alert-create"),

    # ── Hero Slides ────────────────────────────────────────────────────────
    path("hero-slides/", views.HeroSlideListView.as_view(), name="hero-slide-list"),
]
