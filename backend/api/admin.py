from django.contrib import admin, messages
from django.db.models import Sum
from django.utils import timezone
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline

from .models import (
    Brand,
    Category,
    Color,
    Coupon,
    Customer,
    DeliveryBoy,
    DeliveryBoyLocation,
    HeroSlide,
    Order,
    OrderItem,
    OrderDeliveryAssignment,
    OrderStatusHistory,
    Product,
    ProductAttribute,
    ProductImage,
    ProductVariant,
    Review,
    Size,
    StockAlert,
    Tag,
)
from .delivery import assign_order, auto_assign_order

admin.site.site_header = "NDPS Store Administration"
admin.site.site_title = "NDPS Admin"
admin.site.index_title = "Catalog & Store Management"


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------

class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 1
    fields = ("preview", "image", "alt_text", "is_primary", "display_order")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:60px;width:60px;object-fit:cover;'
                'border-radius:6px;" />', obj.image.url,
            )
        return "—"
    preview.short_description = "Preview"


class ProductVariantInline(TabularInline):
    model = ProductVariant
    extra = 1
    fields = (
        "size", "color", "variant_sku", "stock_quantity",
        "low_stock_threshold", "price_override", "is_active",
    )
    readonly_fields = ("variant_sku",)
    autocomplete_fields = ("size", "color")


class ProductAttributeInline(TabularInline):
    model = ProductAttribute
    extra = 1
    fields = ("name", "value", "display_order")


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------

class StockStatusFilter(admin.SimpleListFilter):
    title = "stock status"
    parameter_name = "stock_status"

    def lookups(self, request, model_admin):
        return [
            ("out", "Out of stock"),
            ("low", "Low stock"),
            ("in", "In stock"),
        ]

    def queryset(self, request, queryset):
        ids = []
        value = self.value()
        if not value:
            return queryset
        for product in queryset:
            total = product.total_stock
            low = any(
                0 < v.stock_quantity <= v.low_stock_threshold
                for v in product.variants.all()
            )
            if value == "out" and total == 0:
                ids.append(product.id)
            elif value == "low" and total > 0 and low:
                ids.append(product.id)
            elif value == "in" and total > 0 and not low:
                ids.append(product.id)
        return queryset.filter(id__in=ids)


# ---------------------------------------------------------------------------
# Product admin
# ---------------------------------------------------------------------------

@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = (
        "thumb", "name", "sku", "brand", "category", "gender",
        "price_display", "stock_badge", "status_badge", "is_featured", "is_active",
        "pending_alerts_count",
    )
    list_display_links = ("thumb", "name")
    list_filter = (
        StockStatusFilter, "status", "is_active", "is_featured", "is_new_arrival",
        "gender", "brand", "category",
    )
    search_fields = ("name", "sku", "style_code", "brand__name", "category__name")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("brand", "category", "tags")
    readonly_fields = ("views_count", "created_at", "updated_at", "total_stock_display")
    list_per_page = 25
    save_on_top = True
    inlines = [ProductImageInline, ProductVariantInline, ProductAttributeInline]
    actions = [
        "mark_active", "mark_inactive", "mark_featured", "unmark_featured",
        "publish_products", "move_to_draft",
    ]

    fieldsets = (
        ("Basic Information", {
            "fields": (
                ("name", "slug"),
                ("sku", "style_code"),
                ("brand", "category"),
                "tags",
                "gender",
                "short_description",
                "description",
            ),
        }),
        ("Materials & Build", {
            "fields": (("material", "sole_type"), "weight_grams"),
            "classes": ("collapse",),
        }),
        ("Pricing", {
            "fields": (("price", "discount_price"), ("cost_price", "tax_rate")),
        }),
        ("Media", {
            "fields": ("thumbnail",),
        }),
        ("Visibility & Status", {
            "fields": (
                "status", ("is_active", "is_featured", "is_new_arrival"),
            ),
        }),
        ("SEO", {
            "fields": ("meta_title", "meta_description"),
            "classes": ("collapse",),
        }),
        ("Stats", {
            "fields": ("total_stock_display", "views_count", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("brand", "category").prefetch_related("variants")

    def thumb(self, obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="height:44px;width:44px;object-fit:cover;'
                'border-radius:6px;" />', obj.thumbnail.url,
            )
        return "—"
    thumb.short_description = ""

    def price_display(self, obj):
        if obj.discount_price:
            return format_html(
                '<span style="text-decoration:line-through;color:#999;">Rs {}</span> '
                '<b style="color:#2e7d32;">Rs {}</b>',
                obj.price, obj.discount_price,
            )
        return f"Rs {obj.price}"
    price_display.short_description = "Price"

    def stock_badge(self, obj):
        total = obj.total_stock
        if total == 0:
            color, label = "#e53935", "Out of stock"
        elif any(
            0 < v.stock_quantity <= v.low_stock_threshold
            for v in obj.variants.all()
        ):
            color, label = "#fb8c00", f"Low ({total})"
        else:
            color, label = "#2e7d32", f"In stock ({total})"
        return format_html(
            '<span style="color:white;background:{};padding:2px 8px;'
            'border-radius:10px;font-size:11px;">{}</span>', color, label,
        )
    stock_badge.short_description = "Stock"

    def status_badge(self, obj):
        colors = {"draft": "#9e9e9e", "published": "#2e7d32", "archived": "#616161"}
        return format_html(
            '<span style="color:white;background:{};padding:2px 8px;'
            'border-radius:10px;font-size:11px;">{}</span>',
            colors.get(obj.status, "#9e9e9e"), obj.get_status_display(),
        )
    status_badge.short_description = "Status"

    def total_stock_display(self, obj):
        return obj.total_stock
    total_stock_display.short_description = "Total stock across variants"

    def pending_alerts_count(self, obj):
        count = obj.stock_alerts.filter(notified=False).count()
        return count if count else "—"
    pending_alerts_count.short_description = "Waiting (alerts)"

    @admin.action(description="Mark selected products as active")
    def mark_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} product(s) marked active.", messages.SUCCESS)

    @admin.action(description="Mark selected products as inactive")
    def mark_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} product(s) marked inactive.", messages.SUCCESS)

    @admin.action(description="Mark selected products as featured")
    def mark_featured(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} product(s) marked featured.", messages.SUCCESS)

    @admin.action(description="Remove featured flag from selected products")
    def unmark_featured(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f"{updated} product(s) un-featured.", messages.SUCCESS)

    @admin.action(description="Publish selected products")
    def publish_products(self, request, queryset):
        updated = queryset.update(status="published")
        self.message_user(request, f"{updated} product(s) published.", messages.SUCCESS)

    @admin.action(description="Move selected products to draft")
    def move_to_draft(self, request, queryset):
        updated = queryset.update(status="draft")
        self.message_user(request, f"{updated} product(s) moved to draft.", messages.SUCCESS)


# ---------------------------------------------------------------------------
# Taxonomy admins
# ---------------------------------------------------------------------------

@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ("thumb", "name", "parent", "product_count", "is_active", "display_order")
    list_display_links = ("thumb", "name")
    list_filter = ("is_active", "parent")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "name")

    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:36px;width:36px;object-fit:cover;border-radius:6px;" />', obj.image.url)
        return "—"
    thumb.short_description = ""


@admin.register(Brand)
class BrandAdmin(ModelAdmin):
    list_display = ("logo_thumb", "name", "website", "is_active")
    list_display_links = ("logo_thumb", "name")
    search_fields = ("name",)
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}

    def logo_thumb(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height:32px;width:32px;object-fit:contain;" />', obj.logo.url)
        return "—"
    logo_thumb.short_description = ""


@admin.register(Size)
class SizeAdmin(ModelAdmin):
    list_display = ("system", "value", "display_order")
    list_filter = ("system",)
    search_fields = ("value",)
    ordering = ("system", "display_order")


@admin.register(Color)
class ColorAdmin(ModelAdmin):
    list_display = ("swatch", "name", "hex_code")
    search_fields = ("name",)

    def swatch(self, obj):
        return format_html(
            '<span style="display:inline-block;height:18px;width:18px;'
            'border-radius:50%;background:{};border:1px solid #ccc;"></span>',
            obj.hex_code,
        )
    swatch.short_description = ""


@admin.register(Tag)
class TagAdmin(ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = ("product", "customer_name", "stars", "is_approved", "is_verified_purchase", "created_at")
    list_filter = ("is_approved", "is_verified_purchase", "rating")
    search_fields = ("product__name", "customer_name", "customer_email", "comment")
    autocomplete_fields = ("product",)
    actions = ["approve_reviews", "reject_reviews"]
    list_per_page = 30

    def stars(self, obj):
        return format_html("{}", "★" * obj.rating + "☆" * (5 - obj.rating))
    stars.short_description = "Rating"

    @admin.action(description="Approve selected reviews")
    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} review(s) approved.", messages.SUCCESS)

    @admin.action(description="Reject / unapprove selected reviews")
    def reject_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f"{updated} review(s) rejected.", messages.SUCCESS)


# ---------------------------------------------------------------------------
# Promotions
# ---------------------------------------------------------------------------

@admin.register(Coupon)
class CouponAdmin(ModelAdmin):
    list_display = (
        "code", "discount_type", "discount_value", "usage_progress",
        "valid_from", "valid_to", "is_active",
    )
    list_filter = ("discount_type", "is_active")
    search_fields = ("code", "description")
    filter_horizontal = ("applicable_categories", "applicable_products")
    readonly_fields = ("times_used",)
    date_hierarchy = "valid_from"

    def usage_progress(self, obj):
        if obj.usage_limit:
            return f"{obj.times_used} / {obj.usage_limit}"
        return f"{obj.times_used} / ∞"
    usage_progress.short_description = "Used"


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------

@admin.register(DeliveryBoy)
class DeliveryBoyAdmin(ModelAdmin):
    list_display = ("full_name", "employee_id", "phone", "city", "verification_badge", "employment_badge", "online_status")
    list_filter = ("verification_status", "employment_status", "vehicle_type", "city")
    search_fields = ("full_name", "employee_id", "cnic_number", "phone", "email", "driving_license_number", "vehicle_registration_number")
    readonly_fields = ("created_at", "updated_at", "verified_at", "last_login_at", "created_by", "last_updated_by", "verified_by", "location_summary", "assigned_orders_summary")
    autocomplete_fields = ("user",)
    actions = ("verify_selected", "reject_selected", "activate_selected", "deactivate_selected")
    fieldsets = (
        ("Account and employment", {"fields": (("user", "employee_id"), ("employment_status", "verification_status"), "joining_date", "admin_notes")}),
        ("Personal information", {"fields": (("full_name", "father_name"), ("date_of_birth", "gender"), "cnic_number", ("cnic_front", "cnic_back"), "profile_photo", ("phone", "whatsapp", "email"), ("emergency_contact_name", "emergency_contact_phone"))}),
        ("Addresses", {"fields": ("complete_address", ("city", "province", "postal_code"), "permanent_address", "current_address")}),
        ("Vehicle and license", {"fields": (("vehicle_type", "vehicle_registration_number"), ("vehicle_model", "vehicle_color"), "vehicle_registration_document", ("driving_license_number", "driving_license") )}),
        ("Verification and operations", {"fields": ("verified_by", "verified_at", "location_summary", "assigned_orders_summary", "created_by", "last_updated_by", "last_login_at", "created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.last_updated_by = request.user
        super().save_model(request, obj, form, change)

    def verification_badge(self, obj):
        return format_html('<strong style="color:{}">{}</strong>', "#2e7d32" if obj.verification_status == "verified" else "#fb8c00", obj.get_verification_status_display())
    verification_badge.short_description = "Verification"

    def employment_badge(self, obj):
        return format_html('<strong style="color:{}">{}</strong>', "#2e7d32" if obj.employment_status == "active" else "#e53935", obj.get_employment_status_display())
    employment_badge.short_description = "Employment"

    def online_status(self, obj):
        location = getattr(obj, "current_location", None)
        if not location or not location.is_online:
            return "Offline"
        return f"Online ({location.latitude}, {location.longitude})"
    online_status.short_description = "Current location"

    def location_summary(self, obj):
        return self.online_status(obj)
    location_summary.short_description = "Current location"

    def assigned_orders_summary(self, obj):
        return obj.assigned_orders.filter(assignment_status="assigned").count()
    assigned_orders_summary.short_description = "Active assigned orders"

    @admin.action(description="Verify selected delivery boys")
    def verify_selected(self, request, queryset):
        queryset.update(verification_status="verified", verified_by=request.user, verified_at=timezone.now())

    @admin.action(description="Reject selected delivery boys")
    def reject_selected(self, request, queryset):
        queryset.update(verification_status="rejected", employment_status="rejected", verified_by=request.user, verified_at=timezone.now())

    @admin.action(description="Activate selected delivery boys")
    def activate_selected(self, request, queryset):
        queryset.filter(verification_status="verified").update(employment_status="active")

    @admin.action(description="Deactivate selected delivery boys")
    def deactivate_selected(self, request, queryset):
        queryset.update(employment_status="inactive")


@admin.register(DeliveryBoyLocation)
class DeliveryBoyLocationAdmin(ModelAdmin):
    list_display = ("delivery_boy", "latitude", "longitude", "accuracy", "is_online", "last_seen_at")
    list_filter = ("is_online",)
    search_fields = ("delivery_boy__full_name", "delivery_boy__employee_id")
    autocomplete_fields = ("delivery_boy",)
    readonly_fields = ("created_at", "updated_at", "last_seen_at")


@admin.register(OrderDeliveryAssignment)
class OrderDeliveryAssignmentAdmin(ModelAdmin):
    list_display = ("order", "delivery_boy", "assignment_type", "status", "distance_at_assignment", "assigned_at", "assigned_by")
    list_filter = ("assignment_type", "status")
    search_fields = ("order__order_number", "delivery_boy__full_name", "delivery_boy__employee_id")
    readonly_fields = ("created_at", "updated_at", "assigned_at")
    autocomplete_fields = ("order", "delivery_boy", "assigned_by")

@admin.register(Customer)
class CustomerAdmin(ModelAdmin):
    list_display = ("get_full_name", "get_email", "phone", "created_at")
    search_fields = ("user__first_name", "user__last_name", "user__email", "phone")
    readonly_fields = ("created_at", "updated_at")

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = "Name"

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = "Email"


# ---------------------------------------------------------------------------
# Stock Alerts
# ---------------------------------------------------------------------------

@admin.register(StockAlert)
class StockAlertAdmin(ModelAdmin):
    list_display = ("email", "product", "variant", "notified", "created_at")
    list_filter = ("notified",)
    search_fields = ("email", "product__name", "variant__variant_sku")
    readonly_fields = ("created_at", "updated_at")
    actions = ["mark_notified"]

    @admin.action(description="Mark selected alerts as notified")
    def mark_notified(self, request, queryset):
        updated = queryset.update(notified=True)
        self.message_user(request, f"{updated} alert(s) marked as notified.", messages.SUCCESS)


# ---------------------------------------------------------------------------
# Hero Slides
# ---------------------------------------------------------------------------

@admin.register(HeroSlide)
class HeroSlideAdmin(ModelAdmin):
    list_display = (
        "bg_preview", "badge", "headline", "display_order", "is_active",
    )
    list_display_links = ("bg_preview", "badge", "headline")
    list_editable = ("display_order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("badge", "headline")

    fieldsets = (
        ("Content", {
            "fields": ("badge", "headline", "sub", "cta_label", "cta_href"),
        }),
        ("Visuals", {
            "fields": ("bg_image", "accent_color"),
        }),
        ("Settings", {
            "fields": ("display_order", "is_active"),
        }),
    )

    def bg_preview(self, obj):
        if obj.bg_image:
            return format_html(
                '<img src="{}" style="height:48px;width:96px;object-fit:cover;border-radius:6px;" />',
                obj.bg_image.url,
            )
        return format_html(
            '<span style="display:inline-block;height:48px;width:96px;border-radius:6px;'
            'background:{};"></span>',
            obj.accent_color or "#2563eb",
        )
    bg_preview.short_description = "Preview"


@admin.register(ProductVariant)
class ProductVariantAdmin(ModelAdmin):
    list_display = (
        "product", "size", "color", "variant_sku",
        "stock_quantity", "effective_price_display", "is_active",
    )
    list_filter = ("is_active", "size", "color")
    search_fields = ("product__name", "variant_sku")
    autocomplete_fields = ("product", "size", "color")
    list_editable = ("stock_quantity",)

    def effective_price_display(self, obj):
        return f"Rs {obj.effective_price}"
    effective_price_display.short_description = "Price"


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    fields = ("product", "variant", "quantity", "unit_price", "line_total_display")
    readonly_fields = ("line_total_display",)
    autocomplete_fields = ("product", "variant")

    def line_total_display(self, obj):
        if obj.pk is None or obj.unit_price is None:
            return "—"
        return f"Rs {obj.line_total}"
    line_total_display.short_description = "Line total"


class OrderStatusHistoryInline(TabularInline):
    model = OrderStatusHistory
    extra = 0
    can_delete = False
    fields = ("old_status", "new_status", "changed_by", "changed_by_type", "note", "created_at")
    readonly_fields = fields


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = (
        "order_number", "full_name", "phone", "city",
        "total_display", "status_badge", "assigned_delivery_boy", "assignment_status", "created_at",
    )
    list_filter = ("status", "assignment_status", "location_source", "city")
    search_fields = ("order_number", "full_name", "phone", "email", "assigned_delivery_boy__full_name", "assigned_delivery_boy__employee_id")
    readonly_fields = ("order_number", "subtotal", "discount_total", "total", "created_at", "updated_at", "location_distance_display", "courier_location_display")
    autocomplete_fields = ("assigned_delivery_boy", "coupon")
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    date_hierarchy = "created_at"
    actions = ["mark_confirmed", "mark_shipped", "mark_delivered", "mark_cancelled", "auto_assign_selected"]

    fieldsets = (
        ("Order", {"fields": ("order_number", "status", "created_at", "updated_at")}),
        ("Customer", {"fields": ("full_name", "email", "phone", "address", "city", "notes")}),
        ("Delivery location snapshot", {"fields": (("delivery_address", "delivery_city", "delivery_area"), ("delivery_latitude", "delivery_longitude"), ("location_source", "location_accuracy", "location_captured_at"), "location_distance_display")}),
        ("Delivery assignment", {"fields": ("assigned_delivery_boy", "assignment_status", "assigned_at", "assigned_by", "courier_location_display")}),
        ("Cancellation", {"fields": ("cancelled_at", "cancellation_reason", "cancellation_notes", "cancelled_by", "cancellation_source"), "classes": ("collapse",)}),
        ("Totals", {"fields": ("coupon", "subtotal", "discount_total", "delivery_charge", "total")}),
    )

    def save_model(self, request, obj, form, change):
        previous_id = None
        previous_status = None
        if obj.pk:
            previous = Order.objects.only("assigned_delivery_boy_id", "status").get(pk=obj.pk)
            previous_id = previous.assigned_delivery_boy_id
            previous_status = previous.status
        super().save_model(request, obj, form, change)
        if previous_status and previous_status != obj.status:
            OrderStatusHistory.objects.create(order=obj, old_status=previous_status, new_status=obj.status, changed_by=request.user, changed_by_type="admin")
        if obj.assigned_delivery_boy_id and obj.assigned_delivery_boy_id != previous_id:
            assign_order(obj, obj.assigned_delivery_boy, request.user)

    def courier_location_display(self, obj):
        location = getattr(obj.assigned_delivery_boy, "current_location", None) if obj.assigned_delivery_boy else None
        return f"{location.latitude}, {location.longitude}" if location else "No recent location"
    courier_location_display.short_description = "Delivery boy current location"

    def location_distance_display(self, obj):
        if obj.delivery_latitude is None or obj.delivery_longitude is None:
            return "No coordinates"
        return "Use Auto Assign or the eligible courier list to calculate distance."
    location_distance_display.short_description = "Location matching"

    def total_display(self, obj):
        return f"Rs {obj.total}"
    total_display.short_description = "Total"

    def status_badge(self, obj):
        colors = {
            "pending": "#fb8c00", "confirmed": "#1976d2", "shipped": "#7b1fa2",
            "delivered": "#2e7d32", "cancelled": "#e53935",
        }
        return format_html(
            '<span style="color:white;background:{};padding:2px 8px;'
            'border-radius:10px;font-size:11px;">{}</span>',
            colors.get(obj.status, "#9e9e9e"), obj.get_status_display(),
        )
    status_badge.short_description = "Status"

    @admin.action(description="Mark selected orders as confirmed")
    def mark_confirmed(self, request, queryset):
        updated = queryset.update(status="confirmed")
        self.message_user(request, f"{updated} order(s) confirmed.", messages.SUCCESS)

    @admin.action(description="Mark selected orders as shipped")
    def mark_shipped(self, request, queryset):
        updated = queryset.update(status="out_for_delivery")
        self.message_user(request, f"{updated} order(s) marked out for delivery.", messages.SUCCESS)

    @admin.action(description="Mark selected orders as delivered")
    def mark_delivered(self, request, queryset):
        updated = queryset.update(status="delivered")
        self.message_user(request, f"{updated} order(s) marked delivered.", messages.SUCCESS)

    @admin.action(description="Mark selected orders as cancelled")
    def mark_cancelled(self, request, queryset):
        updated = queryset.update(status="cancelled")
        self.message_user(request, f"{updated} order(s) cancelled.", messages.SUCCESS)

    @admin.action(description="Auto assign nearest eligible delivery boy")
    def auto_assign_selected(self, request, queryset):
        assigned = 0
        for order in queryset.filter(assignment_status="unassigned"):
            try:
                auto_assign_order(order, request.user)
                assigned += 1
            except Exception as exc:
                self.message_user(request, f"{order.order_number}: {exc}", messages.WARNING)
        self.message_user(request, f"{assigned} order(s) assigned.", messages.SUCCESS)
