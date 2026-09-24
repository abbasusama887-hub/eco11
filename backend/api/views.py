from django.db.models import Avg, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, serializers, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .delivery import assign_order, auto_assign_order, eligible_delivery_boys, update_delivery_location
from .models import Brand, Category, Coupon, Customer, DeliveryBoy, HeroSlide, Order, OrderStatusHistory, Product, Review, StockAlert
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    CustomerSerializer,
    HeroSlideSerializer,
    LoginSerializer,
    OrderCreateSerializer,
    DeliveryLocationSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    RegisterSerializer,
    ReviewCreateSerializer,
    StockAlertSerializer,
)


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------

class RegisterView(APIView):
    """POST /api/auth/register/  — create account, return token + profile."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token, _ = Token.objects.get_or_create(user=user)
        profile = CustomerSerializer(user.customer_profile).data

        return Response(
            {"token": token.key, "user": profile},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/  — authenticate, return token + profile."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        token, _ = Token.objects.get_or_create(user=user)
        profile = CustomerSerializer(user.customer_profile).data

        return Response({"token": token.key, "user": profile})


class LogoutView(APIView):
    """POST /api/auth/logout/  — delete the auth token (requires auth)."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET /api/auth/me/  — return the current user's profile."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = CustomerSerializer(request.user.customer_profile).data
        return Response(profile)


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/

    Supports:
      ?featured=true          — only featured products
      ?search=air max         — matches name, SKU, brand, category
      ?category=running       — category slug
      ?brand=nike              — brand slug
      ?gender=men|women|kids|unisex
      ?min_price=1000&max_price=5000
    ?ordering=price_asc|price_desc|newest|rating|popular
      ?limit=8                 — cap result count (in addition to pagination)
    """

    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True, status="published")
        qs = qs.select_related("brand", "category").prefetch_related("variants")
        params = self.request.query_params

        if params.get("featured") == "true":
            qs = qs.filter(is_featured=True)

        availability = params.get("availability")
        if availability == "in_stock":
            qs = qs.filter(variants__stock_quantity__gt=0)
        elif availability == "out_of_stock":
            qs = qs.exclude(variants__stock_quantity__gt=0)

        size = params.get("size")
        if size:
            qs = qs.filter(variants__size__value__iexact=size)

        search = params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(brand__name__icontains=search)
                | Q(category__name__icontains=search)
            )

        category = params.get("category")
        if category:
            qs = qs.filter(category__slug=category)

        brand = params.get("brand")
        if brand:
            qs = qs.filter(brand__slug=brand)

        gender = params.get("gender")
        if gender:
            qs = qs.filter(gender=gender)

        min_price = params.get("min_price")
        if min_price:
            qs = qs.filter(price__gte=min_price)

        max_price = params.get("max_price")
        if max_price:
            qs = qs.filter(price__lte=max_price)

        rating = params.get("rating")
        if rating:
            try:
                qs = qs.filter(reviews__is_approved=True).annotate(
                    average_rating_filter=Avg("reviews__rating"),
                ).filter(average_rating_filter__gte=float(rating))
            except (TypeError, ValueError):
                pass

        ordering = params.get("ordering")
        if ordering == "price_asc":
            qs = qs.order_by("price")
        elif ordering == "price_desc":
            qs = qs.order_by("-price")
        elif ordering == "newest":
            qs = qs.order_by("-created_at")
        elif ordering == "rating":
            qs = qs.annotate(
                average_rating_order=Avg("reviews__rating", filter=Q(reviews__is_approved=True)),
            ).order_by("-average_rating_order", "-created_at")
        elif ordering == "popular":
            qs = qs.order_by("-views_count", "-created_at")
        else:
            qs = qs.order_by("-created_at")

        qs = qs.distinct()

        limit = params.get("limit")
        if limit and limit.isdigit():
            qs = qs[: int(limit)]

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """GET /api/products/<slug>/  — full product detail with images, variants, reviews."""

    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.filter(is_active=True, status="published").select_related(
            "brand", "category",
        ).prefetch_related("images", "variants__size", "variants__color", "reviews")


class CategoryListView(generics.ListAPIView):
    """GET /api/categories/  — for shop-page filters and nav menus."""

    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True).order_by("display_order", "name")


class BrandListView(generics.ListAPIView):
    """GET /api/brands/  — for shop-page filters."""

    serializer_class = BrandSerializer
    pagination_class = None

    def get_queryset(self):
        return Brand.objects.filter(is_active=True).order_by("name")


class CouponValidateView(APIView):
    """POST /api/coupons/validate/ — validate a coupon without exposing rules client-side."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        code = str(request.data.get("code", "")).strip().upper()
        try:
            subtotal = max(float(request.data.get("subtotal", 0)), 0)
        except (TypeError, ValueError):
            subtotal = 0
        coupon = Coupon.objects.filter(code=code, is_active=True).first()
        now = timezone.now()
        if not coupon:
            return Response({"detail": "That coupon code is not valid."}, status=status.HTTP_400_BAD_REQUEST)
        if not (coupon.valid_from <= now <= coupon.valid_to):
            return Response({"detail": "That coupon has expired or is not active yet."}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.usage_limit is not None and coupon.times_used >= coupon.usage_limit:
            return Response({"detail": "That coupon has reached its usage limit."}, status=status.HTTP_400_BAD_REQUEST)
        if subtotal < float(coupon.min_purchase_amount):
            return Response({"detail": f"Spend at least Rs {coupon.min_purchase_amount} to use this coupon."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.discount_type == "percent":
            discount = subtotal * float(coupon.discount_value) / 100
            if coupon.max_discount_amount is not None:
                discount = min(discount, float(coupon.max_discount_amount))
        else:
            discount = float(coupon.discount_value)
        discount = min(discount, subtotal)
        return Response({"code": coupon.code, "description": coupon.description, "discount": round(discount, 2)})


class ReviewCreateView(generics.CreateAPIView):
    """POST /api/products/<slug>/reviews/ — submit a moderated customer review."""

    serializer_class = ReviewCreateSerializer
    authentication_classes = []
    permission_classes = []

    def get_product(self):
        return get_object_or_404(Product, slug=self.kwargs["slug"], is_active=True, status="published")

    def perform_create(self, serializer):
        serializer.save(product=self.get_product(), is_approved=False, is_verified_purchase=False)


class OrderCreateView(generics.CreateAPIView):
    """POST /api/orders/  — guest checkout. Creates an Order + OrderItems from a cart payload."""

    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            self.get_serializer(order).data, status=status.HTTP_201_CREATED,
        )


class MyOrderListView(generics.ListAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return Order.objects.filter(customer__user=self.request.user).select_related("assigned_delivery_boy").prefetch_related("items__product", "items__variant__size", "items__variant__color")


class MyOrderDetailView(generics.RetrieveAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer
    lookup_field = "pk"

    def get_queryset(self):
        return Order.objects.filter(customer__user=self.request.user).select_related("assigned_delivery_boy").prefetch_related("items__product", "items__variant__size", "items__variant__color", "status_history")


class MyOrderCancelView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order.objects.filter(customer__user=request.user), pk=pk)
        if order.status in {"delivered", "cancelled", "returned", "rejected", "out_for_delivery"}:
            return Response({"detail": "This order can no longer be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        if timezone.now() >= order.created_at + timedelta(hours=2):
            return Response({"detail": "The two-hour cancellation window has expired."}, status=status.HTTP_400_BAD_REQUEST)
        reason = str(request.data.get("reason", "Other")).strip()[:120] or "Other"
        notes = str(request.data.get("notes", "")).strip()[:1000]
        old_status = order.status
        order.status = "cancelled"
        order.cancelled_at = timezone.now()
        order.cancellation_reason = reason
        order.cancellation_notes = notes
        order.cancelled_by = request.user
        order.cancellation_source = "customer"
        order.save(update_fields=["status", "cancelled_at", "cancellation_reason", "cancellation_notes", "cancelled_by", "cancellation_source", "updated_at"])
        OrderStatusHistory.objects.create(order=order, old_status=old_status, new_status="cancelled", changed_by=request.user, changed_by_type="customer", note=reason)
        return Response(OrderDetailSerializer(order, context={"request": request}).data)


class DeliveryLocationView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            delivery_boy = request.user.delivery_boy_profile
        except DeliveryBoy.DoesNotExist:
            return Response({"detail": "Delivery boy account not found."}, status=status.HTTP_403_FORBIDDEN)
        serializer = DeliveryLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        location = update_delivery_location(delivery_boy, **serializer.validated_data)
        return Response(DeliveryLocationSerializer(location).data)


class OrderEligibleDeliveryBoysView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        return Response([
            {
                "id": item["delivery_boy"].id,
                "name": item["delivery_boy"].full_name,
                "employee_id": item["delivery_boy"].employee_id,
                "phone": item["delivery_boy"].phone,
                "distance_km": round(item["distance"], 2),
                "active_orders": item["active_orders"],
            }
            for item in eligible_delivery_boys(order)
        ])


class OrderAssignmentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        if request.data.get("automatic"):
            assignment = auto_assign_order(order, request.user)
        else:
            try:
                delivery_boy = DeliveryBoy.objects.get(pk=request.data.get("delivery_boy_id"))
            except DeliveryBoy.DoesNotExist:
                raise serializers.ValidationError({"delivery_boy_id": "Choose a valid delivery boy."})
            assignment = assign_order(order, delivery_boy, request.user)
        return Response({"assignment_id": assignment.id, "order_status": order.status})


# ---------------------------------------------------------------------------
# Stock Alerts
# ---------------------------------------------------------------------------

class StockAlertCreateView(generics.CreateAPIView):
    """POST /api/stock-alerts/  — subscribe to back-in-stock notification.

    Body: { "product": <id>, "variant": <id|null>, "email": "<email>" }
    No authentication required — any visitor can subscribe.
    """

    queryset = StockAlert.objects.all()
    serializer_class = StockAlertSerializer
    authentication_classes = []
    permission_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "You'll be notified when this item is back in stock."},
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Hero Slides
# ---------------------------------------------------------------------------

class HeroSlideListView(generics.ListAPIView):
    """GET /api/hero-slides/  — returns active slides ordered by display_order."""

    serializer_class = HeroSlideSerializer
    authentication_classes = []
    permission_classes = []
    pagination_class = None

    def get_queryset(self):
        return HeroSlide.objects.filter(is_active=True).order_by("display_order", "id")
