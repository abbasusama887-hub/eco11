from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Brand,
    Category,
    Color,
    Customer,
    DeliveryBoy,
    HeroSlide,
    Order,
    OrderItem,
    DeliveryBoyLocation,
    OrderStatusHistory,
    Product,
    ProductImage,
    ProductVariant,
    Review,
    Size,
    StockAlert,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Auth serializers
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        email = data.get("email", "").strip()
        phone = data.get("phone", "").strip()

        if not email and not phone:
            raise serializers.ValidationError(
                "At least one of email or phone is required."
            )

        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "An account with this email already exists."}
            )

        if phone and Customer.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                {"phone": "An account with this phone number already exists."}
            )

        # Run Django's built-in password validators
        try:
            validate_password(data["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})

        return data

    @transaction.atomic
    def create(self, validated_data):
        name = validated_data["name"].strip()
        email = validated_data.get("email", "").strip()
        phone = validated_data.get("phone", "").strip()
        password = validated_data["password"]

        # Split name into first/last (best-effort)
        parts = name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

        # username must be unique — use email, phone, or a uuid fallback
        import uuid
        username = email or phone or str(uuid.uuid4())[:30]

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        Customer.objects.create(user=user, phone=phone)
        return user


class LoginSerializer(serializers.Serializer):
    """Accepts email or phone as the identifier."""

    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data["identifier"].strip()
        password = data["password"]

        user = None

        # Try email first
        if "@" in identifier:
            user = authenticate(
                request=self.context.get("request"),
                username=identifier,
                password=password,
            )
            # Some accounts have email as username, some have phone
            if user is None:
                try:
                    u = User.objects.get(email__iexact=identifier)
                    user = authenticate(
                        request=self.context.get("request"),
                        username=u.username,
                        password=password,
                    )
                except User.DoesNotExist:
                    pass
        else:
            # Phone lookup
            try:
                profile = Customer.objects.select_related("user").get(phone=identifier)
                user = authenticate(
                    request=self.context.get("request"),
                    username=profile.user.username,
                    password=password,
                )
            except Customer.DoesNotExist:
                pass

        if user is None:
            raise serializers.ValidationError("Invalid email/phone or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been disabled.")

        data["user"] = user
        return data


class CustomerSerializer(serializers.ModelSerializer):
    """Read-only profile returned after login / from /api/auth/me/."""

    id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = ["id", "name", "email", "phone"]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "logo"]


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image", "product_count"]


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ["id", "system", "value"]


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ["id", "name", "hex_code"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "display_order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    stock_status = serializers.ReadOnlyField()
    effective_price = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = [
            "id", "size", "color", "variant_sku", "stock_quantity",
            "stock_status", "effective_price", "is_active",
        ]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            "id", "customer_name", "rating", "title", "comment",
            "is_verified_purchase", "created_at",
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for grid/card views (product listing pages)."""

    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    current_price = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "brand", "category", "gender",
            "price", "discount_price", "current_price", "discount_percent",
            "thumbnail", "is_featured", "is_new_arrival", "is_in_stock",
            "average_rating",
        ]


class ProductDetailSerializer(ProductListSerializer):
    """Full serializer for a single product page — includes gallery, variants, reviews."""

    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "short_description", "description", "material", "sole_type",
            "style_code", "weight_grams", "images", "variants", "reviews",
        ]

    def get_reviews(self, obj):
        approved = obj.reviews.filter(is_approved=True)
        return ReviewSerializer(approved, many=True).data


# ---------------------------------------------------------------------------
# Orders (write)
# ---------------------------------------------------------------------------

class OrderItemWriteSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderItemReadSerializer(serializers.ModelSerializer):
    product_image = serializers.ImageField(source="product.thumbnail", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    size = serializers.CharField(source="variant.size", read_only=True)
    color = serializers.CharField(source="variant.color", read_only=True)
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "product_image", "size", "color", "quantity", "unit_price", "line_total"]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="new_status", read_only=True)
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ["status", "timestamp", "note"]


class DeliveryBoyOrderSerializer(serializers.ModelSerializer):
    vehicle = serializers.CharField(source="get_vehicle_type_display", read_only=True)
    status = serializers.CharField(source="employment_status", read_only=True)

    class Meta:
        model = DeliveryBoy
        fields = ["full_name", "employee_id", "vehicle", "vehicle_registration_number", "phone", "whatsapp", "status"]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemWriteSerializer(many=True, write_only=True)
    order_number = serializers.CharField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    order_items = OrderItemReadSerializer(source="items", many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "full_name", "email", "phone",
            "address", "city", "notes", "items", "order_items",
            "payment_method",
            "delivery_address", "delivery_city", "delivery_area",
            "delivery_latitude", "delivery_longitude", "location_source",
            "location_accuracy", "location_captured_at",
            "subtotal", "total",
        ]
        read_only_fields = ["id", "status"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Cart is empty.")
        return items

    def validate(self, attrs):
        latitude = attrs.get("delivery_latitude")
        longitude = attrs.get("delivery_longitude")
        if (latitude is None) != (longitude is None):
            raise serializers.ValidationError("Both delivery latitude and longitude are required.")
        if latitude is not None and attrs.get("location_source") not in {"current_location", "manual"}:
            raise serializers.ValidationError({"location_source": "Choose current_location or manual."})
        attrs.setdefault("delivery_address", attrs.get("address", ""))
        attrs.setdefault("delivery_city", attrs.get("city", ""))
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if user:
            validated_data["customer"] = user.customer_profile
        order = Order.objects.create(**validated_data)
        OrderStatusHistory.objects.create(order=order, new_status=order.status, changed_by=user, changed_by_type="customer" if user else "system", note="Order placed")

        for item in items_data:
            try:
                variant = ProductVariant.objects.select_related("product").get(
                    pk=item["variant_id"], is_active=True,
                )
            except ProductVariant.DoesNotExist:
                order.delete()
                raise serializers.ValidationError(
                    {"items": f"Product variant {item['variant_id']} not found."},
                )

            quantity = item["quantity"]
            if variant.stock_quantity < quantity:
                order.delete()
                raise serializers.ValidationError(
                    {"items": f"Not enough stock for {variant.product.name} ({variant})."},
                )

            OrderItem.objects.create(
                order=order,
                product=variant.product,
                variant=variant,
                quantity=quantity,
                unit_price=variant.effective_price,
            )
            variant.stock_quantity -= quantity
            variant.save(update_fields=["stock_quantity"])

        order.recalculate_totals()
        order.save(update_fields=["subtotal", "total"])
        return order


class OrderListSerializer(serializers.ModelSerializer):
    order_items = OrderItemReadSerializer(source="items", many=True, read_only=True)
    can_cancel = serializers.SerializerMethodField()
    cancellation_deadline = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "order_number", "created_at", "status", "order_items", "total", "payment_method", "payment_status", "delivery_address", "delivery_city", "assigned_delivery_boy", "can_cancel", "cancellation_deadline"]

    def get_can_cancel(self, obj):
        return obj.status not in {"delivered", "cancelled", "returned", "rejected"} and obj.created_at >= timezone.now() - timedelta(hours=2)

    def get_cancellation_deadline(self, obj):
        return (obj.created_at + timedelta(hours=2)).isoformat()


class OrderDetailSerializer(OrderListSerializer):
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    delivery_boy = serializers.SerializerMethodField()
    active_delivery_contact = serializers.SerializerMethodField()

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + [
            "full_name", "email", "phone", "address", "city", "delivery_area",
            "delivery_latitude", "delivery_longitude", "notes", "subtotal", "delivery_charge",
            "discount_total", "status_history", "delivery_boy", "active_delivery_contact",
            "cancelled_at", "cancellation_reason", "cancellation_notes",
        ]

    def get_delivery_boy(self, obj):
        return DeliveryBoyOrderSerializer(obj.assigned_delivery_boy).data if obj.assigned_delivery_boy else None

    def get_active_delivery_contact(self, obj):
        if obj.status in {"delivered", "cancelled", "returned", "rejected"} or not obj.assigned_delivery_boy:
            return None
        courier = obj.assigned_delivery_boy
        return {"phone": courier.phone, "whatsapp": courier.whatsapp or courier.phone}


class DeliveryLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryBoyLocation
        fields = ["latitude", "longitude", "accuracy", "is_online"]

    def validate(self, attrs):
        if not (-90 <= attrs["latitude"] <= 90 and -180 <= attrs["longitude"] <= 180):
            raise serializers.ValidationError("Latitude or longitude is outside its valid range.")
        return attrs


# ---------------------------------------------------------------------------
# Stock Alerts
# ---------------------------------------------------------------------------

class StockAlertSerializer(serializers.ModelSerializer):
    """Used for both creating and reading stock alert records."""

    class Meta:
        model = StockAlert
        fields = ["id", "product", "variant", "email"]
        read_only_fields = ["id"]

    def validate(self, data):
        email = data.get("email", "").strip().lower()
        variant = data.get("variant")
        product = data.get("product")

        # Check for a duplicate un-notified alert for this email + variant combo
        qs = StockAlert.objects.filter(email=email, notified=False)
        if variant:
            qs = qs.filter(variant=variant)
        else:
            qs = qs.filter(variant__isnull=True, product=product)

        if qs.exists():
            raise serializers.ValidationError(
                "You are already on the notify list for this item."
            )

        data["email"] = email
        return data


# ---------------------------------------------------------------------------
# Hero Slides
# ---------------------------------------------------------------------------

class HeroSlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroSlide
        fields = [
            "id", "badge", "headline", "sub",
            "cta_label", "cta_href",
            "bg_image", "accent_color",
            "display_order",
        ]
