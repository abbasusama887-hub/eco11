import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.urls import reverse
from django.utils.text import slugify


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def category_image_path(instance, filename):
    ext = filename.split(".")[-1]
    return f"categories/{uuid.uuid4().hex}.{ext}"


def brand_logo_path(instance, filename):
    ext = filename.split(".")[-1]
    return f"brands/{uuid.uuid4().hex}.{ext}"


def product_image_path(instance, filename):
    ext = filename.split(".")[-1]
    product = instance.product if hasattr(instance, "product") else instance
    return f"products/{product.slug}/{uuid.uuid4().hex}.{ext}"


class TimeStampedModel(models.Model):
    """Abstract base carrying created/updated timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Catalog taxonomy
# ---------------------------------------------------------------------------

class Category(TimeStampedModel):
    """Shoe categories, e.g. Running, Casual, Sports, Sandals. Supports
    a single level of sub-categories via `parent`."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, related_name="children",
        on_delete=models.SET_NULL,
    )
    image = models.ImageField(upload_to=category_image_path, blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name if not self.parent else f"{self.parent.name} → {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def product_count(self):
        return self.products.filter(is_active=True).count()


class Brand(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    logo = models.ImageField(upload_to=brand_logo_path, blank=True, null=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Size(models.Model):
    """Reusable shoe size, e.g. UK 8, EU 42, US 9."""

    SYSTEM_CHOICES = [
        ("UK", "UK"),
        ("US", "US"),
        ("EU", "EU"),
    ]

    system = models.CharField(max_length=3, choices=SYSTEM_CHOICES, default="UK")
    value = models.CharField(max_length=10, help_text="e.g. 6, 7.5, 10")
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["system", "display_order"]
        unique_together = ("system", "value")

    def __str__(self):
        return f"{self.system} {self.value}"


class Color(models.Model):
    name = models.CharField(max_length=50, unique=True)
    hex_code = models.CharField(
        max_length=7, default="#000000",
        help_text="Hex color code, e.g. #FF0000",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class Product(TimeStampedModel):
    GENDER_CHOICES = [
        ("men", "Men"),
        ("women", "Women"),
        ("kids", "Kids"),
        ("unisex", "Unisex"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    sku = models.CharField(
        "SKU", max_length=50, unique=True,
        help_text="Base stock keeping unit for this product.",
    )
    brand = models.ForeignKey(
        Brand, related_name="products", on_delete=models.PROTECT,
    )
    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.PROTECT,
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="unisex")

    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)

    material = models.CharField(max_length=150, blank=True, help_text="e.g. Leather, Mesh, Canvas")
    sole_type = models.CharField(max_length=150, blank=True, help_text="e.g. Rubber, EVA, Foam")
    style_code = models.CharField(max_length=50, blank=True)

    price = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Regular selling price.",
    )
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Optional discounted price. Must be lower than price.",
    )
    cost_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Internal cost price, used for margin reporting (not shown to customers).",
    )
    tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Percentage tax applied at checkout, e.g. 5.00 for 5%.",
    )

    thumbnail = models.ImageField(
        upload_to=product_image_path, blank=True, null=True,
        help_text="Main image shown in listings.",
    )

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)

    weight_grams = models.PositiveIntegerField(blank=True, null=True)

    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)

    views_count = models.PositiveIntegerField(default=0, editable=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["status", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base_slug}-{counter}"
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("product-detail", kwargs={"slug": self.slug})

    @property
    def current_price(self):
        return self.discount_price if self.discount_price else self.price

    @property
    def discount_percent(self):
        if self.discount_price and self.price:
            return round((1 - (self.discount_price / self.price)) * 100)
        return 0

    @property
    def total_stock(self):
        return sum(v.stock_quantity for v in self.variants.all())

    @property
    def is_in_stock(self):
        return self.total_stock > 0

    @property
    def average_rating(self):
        approved = self.reviews.filter(is_approved=True)
        if not approved.exists():
            return None
        return round(sum(r.rating for r in approved) / approved.count(), 1)


class ProductImage(models.Model):
    """Extra gallery images for a product (beyond the main thumbnail)."""

    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to=product_image_path)
    alt_text = models.CharField(max_length=150, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"Image for {self.product.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_primary:
            ProductImage.objects.filter(product=self.product).exclude(pk=self.pk).update(is_primary=False)


class ProductVariant(models.Model):
    """A purchasable size/color combination of a product, with its own
    stock level and optional price override."""

    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    size = models.ForeignKey(Size, related_name="variants", on_delete=models.PROTECT)
    color = models.ForeignKey(Color, related_name="variants", on_delete=models.PROTECT)
    variant_sku = models.CharField(max_length=60, unique=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    price_override = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Leave blank to use the product's base price.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["size__display_order", "color__name"]
        unique_together = ("product", "size", "color")

    def __str__(self):
        return f"{self.product.name} — {self.size} / {self.color}"

    def save(self, *args, **kwargs):
        if not self.variant_sku:
            self.variant_sku = f"{self.product.sku}-{self.size.system}{self.size.value}-{self.color.name}".upper().replace(" ", "")
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        return self.price_override or self.product.current_price

    @property
    def stock_status(self):
        if self.stock_quantity <= 0:
            return "out_of_stock"
        if self.stock_quantity <= self.low_stock_threshold:
            return "low_stock"
        return "in_stock"


class ProductAttribute(models.Model):
    """Free-form technical specification row, e.g. 'Closure Type: Lace-up'."""

    product = models.ForeignKey(Product, related_name="attributes", on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.name}: {self.value}"


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

class Review(TimeStampedModel):
    product = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=100)
    customer_email = models.EmailField(blank=True)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    title = models.CharField(max_length=150, blank=True)
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)
    is_verified_purchase = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ — {self.product.name} by {self.customer_name}"


# ---------------------------------------------------------------------------
# Promotions
# ---------------------------------------------------------------------------

class Coupon(TimeStampedModel):
    DISCOUNT_TYPE_CHOICES = [
        ("percent", "Percentage"),
        ("fixed", "Fixed amount"),
    ]

    code = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=255, blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default="percent")
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    applicable_categories = models.ManyToManyField(Category, blank=True, related_name="coupons")
    applicable_products = models.ManyToManyField(Product, blank=True, related_name="coupons")

    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(
        blank=True, null=True, help_text="Leave blank for unlimited uses.",
    )
    times_used = models.PositiveIntegerField(default=0, editable=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Hero Slides — admin-managed home-page banner carousel
# ---------------------------------------------------------------------------

def hero_slide_image_path(instance, filename):
    ext = filename.split(".")[-1]
    return f"hero/{uuid.uuid4().hex}.{ext}"


class HeroSlide(TimeStampedModel):
    """One slide in the home-page hero carousel.

    The admin can create, reorder, enable/disable, and set a background
    image for each slide without any frontend deployment.
    """

    badge = models.CharField(
        max_length=60,
        help_text="Small pill label, e.g. 'New Arrivals'.",
    )
    headline = models.CharField(
        max_length=120,
        help_text="Large bold heading shown on the slide.",
    )
    sub = models.CharField(
        max_length=200,
        blank=True,
        help_text="Short supporting sentence beneath the headline.",
    )
    cta_label = models.CharField(
        max_length=40,
        default="Shop Now",
        help_text="Button label, e.g. 'Shop Now'.",
    )
    cta_href = models.CharField(
        max_length=200,
        default="/shop",
        help_text="URL the button links to (relative or absolute).",
    )
    bg_image = models.ImageField(
        upload_to=hero_slide_image_path,
        blank=True,
        null=True,
        help_text="Background image for the slide. Leave blank for a plain colour.",
    )
    accent_color = models.CharField(
        max_length=7,
        default="#2563eb",
        help_text="Hex colour for the badge and CTA button, e.g. #2563eb.",
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Lower numbers appear first in the carousel.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Only active slides are shown on the home page.",
    )

    class Meta:
        ordering = ["display_order", "id"]
        verbose_name = "Hero Slide"
        verbose_name_plural = "Hero Slides"

    def __str__(self):
        status = "✓" if self.is_active else "✗"
        return f"[{status}] {self.badge} — {self.headline[:40]}"


# ---------------------------------------------------------------------------
# Customer profile (one-to-one with Django's built-in User)
# ---------------------------------------------------------------------------

class Customer(TimeStampedModel):
    """Extra profile data for registered storefront customers.

    Django's User model handles email + password. We add phone here
    so customers can log in with either email or phone number.
    """

    user = models.OneToOneField(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )
    phone = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        default="",
        help_text="Mobile number used as an alternative login identifier.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.get_full_name()} <{self.user.email}>"


# ---------------------------------------------------------------------------
# Delivery operations
# ---------------------------------------------------------------------------

class DeliveryBoy(TimeStampedModel):
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other")]
    EMPLOYMENT_STATUS_CHOICES = [
        ("pending", "Pending"), ("active", "Active"), ("suspended", "Suspended"),
        ("inactive", "Inactive"), ("rejected", "Rejected"),
    ]
    VERIFICATION_STATUS_CHOICES = [
        ("pending", "Pending"), ("verified", "Verified"), ("rejected", "Rejected"),
    ]
    VEHICLE_TYPE_CHOICES = [
        ("motorcycle", "Motorcycle"), ("bicycle", "Bicycle"),
        ("car", "Car"), ("other", "Other"),
    ]

    user = models.OneToOneField("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="delivery_boy_profile")
    employee_id = models.CharField(max_length=40, unique=True)
    full_name = models.CharField(max_length=150)
    father_name = models.CharField(max_length=150, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    cnic_number = models.CharField(max_length=30, unique=True)
    cnic_front = models.FileField(upload_to="delivery/cnic/", blank=True)
    cnic_back = models.FileField(upload_to="delivery/cnic/", blank=True)
    profile_photo = models.ImageField(upload_to="delivery/profiles/", blank=True)
    phone = models.CharField(max_length=30, unique=True)
    whatsapp = models.CharField(max_length=30, blank=True)
    email = models.EmailField(unique=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    complete_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    permanent_address = models.CharField(max_length=255, blank=True)
    current_address = models.CharField(max_length=255, blank=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES, blank=True)
    vehicle_registration_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    vehicle_model = models.CharField(max_length=100, blank=True)
    vehicle_color = models.CharField(max_length=50, blank=True)
    vehicle_registration_document = models.FileField(upload_to="delivery/vehicles/", blank=True)
    driving_license_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    driving_license = models.FileField(upload_to="delivery/licenses/", blank=True)
    joining_date = models.DateField(null=True, blank=True)
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS_CHOICES, default="pending")
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="verified_delivery_boys")
    verified_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="created_delivery_boys")
    last_updated_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_delivery_boys")
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["employment_status", "verification_status"]),
            models.Index(fields=["city"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.employee_id})"

    @property
    def is_eligible(self):
        return self.employment_status == "active" and self.verification_status == "verified"


class DeliveryBoyLocation(TimeStampedModel):
    delivery_boy = models.OneToOneField(DeliveryBoy, on_delete=models.CASCADE, related_name="current_location")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    accuracy = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_online = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["is_online", "last_seen_at"])]


class OrderDeliveryAssignment(TimeStampedModel):
    ASSIGNMENT_TYPES = [("manual", "Manual"), ("automatic", "Automatic")]
    STATUS_CHOICES = [("active", "Active"), ("completed", "Completed"), ("unassigned", "Unassigned")]
    order = models.ForeignKey("Order", on_delete=models.CASCADE, related_name="delivery_assignments")
    delivery_boy = models.ForeignKey(DeliveryBoy, on_delete=models.PROTECT, related_name="assignments")
    assigned_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="delivery_assignments_made")
    assignment_type = models.CharField(max_length=10, choices=ASSIGNMENT_TYPES)
    assigned_at = models.DateTimeField(auto_now_add=True)
    unassigned_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="active")
    distance_at_assignment = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-assigned_at"]
        indexes = [models.Index(fields=["order", "status"])]


# ---------------------------------------------------------------------------
# Stock Alerts — back-in-stock notification requests
# ---------------------------------------------------------------------------

class StockAlert(TimeStampedModel):
    """A shopper's request to be notified when a product/variant is restocked.

    - ``product``  is always required.
    - ``variant``  is optional: if set the alert is for a specific size/colour;
                   if None it covers any variant of that product coming back.
    - ``email``    is where the notification goes.
    - ``notified`` is flipped to True once the email has been dispatched so
                   we don't spam the same address for subsequent restocks.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_alerts",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="stock_alerts",
        null=True,
        blank=True,
        help_text="Leave blank to alert on any variant restocking.",
    )
    email = models.EmailField(help_text="Email address to notify.")
    notified = models.BooleanField(
        default=False,
        help_text="Set to True once the notification email has been sent.",
    )

    class Meta:
        ordering = ["-created_at"]
        # One pending alert per email+variant combo is enough
        unique_together = ("email", "variant", "notified")

    def __str__(self):
        target = str(self.variant) if self.variant else self.product.name
        status = "✓ notified" if self.notified else "pending"
        return f"{self.email} → {target} [{status}]"


# ---------------------------------------------------------------------------
# Orders (guest checkout — no customer account required)
# ---------------------------------------------------------------------------

class Order(TimeStampedModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("processing", "Processing"),
        ("packed", "Packed"),
        ("assigned", "Delivery Boy Assigned"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("rejected", "Rejected"),
        ("returned", "Returned"),
    ]

    order_number = models.CharField(max_length=20, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")

    full_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    delivery_address = models.CharField(max_length=255, blank=True)
    delivery_city = models.CharField(max_length=100, blank=True)
    delivery_area = models.CharField(max_length=100, blank=True)
    delivery_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_source = models.CharField(max_length=20, choices=[("current_location", "Current location"), ("manual", "Manual")], blank=True)
    location_accuracy = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    location_captured_at = models.DateTimeField(null=True, blank=True)
    assigned_delivery_boy = models.ForeignKey(DeliveryBoy, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_orders")
    assignment_status = models.CharField(max_length=20, default="unassigned")
    assigned_at = models.DateTimeField(null=True, blank=True)
    assigned_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="orders_assigned")
    notes = models.TextField(blank=True)
    payment_method = models.CharField(max_length=30, default="cod")
    payment_status = models.CharField(max_length=20, default="pending")
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=120, blank=True)
    cancellation_notes = models.TextField(blank=True)
    cancelled_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="cancelled_orders")
    cancellation_source = models.CharField(max_length=20, blank=True)

    coupon = models.ForeignKey(
        Coupon, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders",
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number or f"Order #{self.pk}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"NDPS-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        self.subtotal = sum(item.line_total for item in self.items.all())
        self.total = max(self.subtotal + self.delivery_charge - self.discount_total, 0)


class OrderStatusHistory(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="order_status_changes")
    changed_by_type = models.CharField(max_length=20, default="system")
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["created_at", "id"]


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="order_items", on_delete=models.PROTECT)
    variant = models.ForeignKey(
        ProductVariant, related_name="order_items", on_delete=models.PROTECT,
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Price at the time of order (snapshot — protects against later price changes).",
    )

    def __str__(self):
        return f"{self.quantity} × {self.product.name} ({self.variant})"

    @property
    def line_total(self):
        return self.unit_price * self.quantity
