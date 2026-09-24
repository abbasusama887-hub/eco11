"""
Django settings for config project.
"""

import mimetypes
import os
from decimal import Decimal
from pathlib import Path

from django.urls import reverse_lazy
from dotenv import load_dotenv

# Windows' mimetypes module reads image types from the Windows Registry,
# which is notoriously unreliable — it often returns the wrong (or no)
# Content-Type for extensions like .jpg/.jfif. A wrong Content-Type on
# /media/ files makes Next.js's <Image> optimizer reject them with a
# 400 "invalid image" error. Force the correct types explicitly so this
# never depends on the OS's registry, on any platform.
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/jpeg", ".jfif")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/gif", ".gif")

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")



# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-8_jabww^_6fq$5*)8zm&nl&b4v^#y)^%=jr#in9&!e*-55f04y",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = [
    h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()
]


# Application definition

INSTALLED_APPS = [
    # Must come BEFORE django.contrib.admin to override the admin UI
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",

    # Local
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    'whitenoise.middleware.WhiteNoiseMiddleware',
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# Uses Supabase Postgres when SUPABASE_DB_* env vars are set (see .env.example),
# otherwise falls back to local sqlite so the project still runs out of the box.

if os.getenv("SUPABASE_DB_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("SUPABASE_DB_NAME", "postgres"),
            "USER": os.getenv("SUPABASE_DB_USER", "postgres"),
            "PASSWORD": os.getenv("SUPABASE_DB_PASSWORD", ""),
            "HOST": os.getenv("SUPABASE_DB_HOST"),
            "PORT": os.getenv("SUPABASE_DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static & media files

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

if os.getenv("SUPABASE_STORAGE_ENDPOINT"):
    STORAGES = {
        "default": {
            "BACKEND": "storage_backends.s3.SupabasePublicStorage",
            
            "OPTIONS": {
    "bucket_name": os.getenv("SUPABASE_STORAGE_BUCKET", "media"),
    "endpoint_url": os.getenv("SUPABASE_STORAGE_ENDPOINT"),
    "access_key": os.getenv("SUPABASE_STORAGE_ACCESS_KEY", ""),
    "secret_key": os.getenv("SUPABASE_STORAGE_SECRET_KEY", ""),
    "region_name": os.getenv("SUPABASE_STORAGE_REGION", "ap-northeast-2"),
    "querystring_auth": False,
    "file_overwrite": False,
},
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Django REST Framework

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# Delivery assignment policy. Override these in the environment for production.
DELIVERY_LOCATION_MAX_AGE_MINUTES = int(os.getenv("DELIVERY_LOCATION_MAX_AGE_MINUTES", "15"))
DELIVERY_MAX_ACTIVE_ORDERS = int(os.getenv("DELIVERY_MAX_ACTIVE_ORDERS", "3"))
DELIVERY_MAX_ASSIGNMENT_RADIUS_KM = float(os.getenv("DELIVERY_MAX_ASSIGNMENT_RADIUS_KM", "20"))
FREE_SHIPPING_THRESHOLD = Decimal(os.getenv("FREE_SHIPPING_THRESHOLD", "5000"))
STANDARD_SHIPPING_FEE = Decimal(os.getenv("STANDARD_SHIPPING_FEE", "250"))


# CORS — allow the Next.js frontend to call the API

CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",") if o.strip()
]


# Unfold — Tailwind CSS based professional admin theme
# Every option below controls something visible on the admin UI.
# Full option list: https://unfoldadmin.com/docs/configuration/settings/

UNFOLD = {
    "SITE_TITLE": "NDPS Admin",
    "SITE_HEADER": "NDPS Store",
    "SITE_SYMBOL": "storefront",  # Material icon shown next to the site name
    "STYLES": ["/static/api/admin/custom_admin.css"],
    "SCRIPTS": ["/static/api/admin/custom_admin.js"],
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "SHOW_BACK_BUTTON": True,

    # Sidebar navigation — grouped sections with Material icon names
    # Full icon list: https://fonts.google.com/icons
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Catalog",
                "separator": True,
                "items": [
                    {
                        "title": "Products",
                        "icon": "inventory_2",
                        "link": reverse_lazy("admin:api_product_changelist"),
                    },
                    {
                        "title": "Categories",
                        "icon": "category",
                        "link": reverse_lazy("admin:api_category_changelist"),
                    },
                    {
                        "title": "Brands",
                        "icon": "storefront",
                        "link": reverse_lazy("admin:api_brand_changelist"),
                    },
                    {
                        "title": "Variants (size/color/stock)",
                        "icon": "checkroom",
                        "link": reverse_lazy("admin:api_productvariant_changelist"),
                    },
                    {
                        "title": "Sizes",
                        "icon": "straighten",
                        "link": reverse_lazy("admin:api_size_changelist"),
                    },
                    {
                        "title": "Colors",
                        "icon": "palette",
                        "link": reverse_lazy("admin:api_color_changelist"),
                    },
                    {
                        "title": "Tags",
                        "icon": "sell",
                        "link": reverse_lazy("admin:api_tag_changelist"),
                    },
                ],
            },
            {
                "title": "Marketing",
                "separator": True,
                "items": [
                    {
                        "title": "Hero Slides",
                        "icon": "slideshow",
                        "link": reverse_lazy("admin:api_heroslide_changelist"),
                    },
                    {
                        "title": "Reviews",
                        "icon": "star",
                        "link": reverse_lazy("admin:api_review_changelist"),
                    },
                    {
                        "title": "Coupons",
                        "icon": "percent",
                        "link": reverse_lazy("admin:api_coupon_changelist"),
                    },
                    {
                        "title": "Stock Alerts",
                        "icon": "notifications",
                        "link": reverse_lazy("admin:api_stockalert_changelist"),
                    },
                ],
            },
            {
                "title": "Commerce",
                "separator": True,
                "items": [
                    {
                        "title": "Orders",
                        "icon": "shopping_bag",
                        "link": reverse_lazy("admin:api_order_changelist"),
                    },
                    {
                        "title": "Customers",
                        "icon": "group",
                        "link": reverse_lazy("admin:api_customer_changelist"),
                    },
                    {
                        "title": "Delivery Boys",
                        "icon": "delivery_dining",
                        "link": reverse_lazy("admin:api_deliveryboy_changelist"),
                    },
                    {
                        "title": "Delivery Assignments",
                        "icon": "route",
                        "link": reverse_lazy("admin:api_orderdeliveryassignment_changelist"),
                    },
                ],
            },
            {
                "title": "Access",
                "separator": True,
                "items": [
                    {
                        "title": "Users",
                        "icon": "person",
                        "link": reverse_lazy("admin:auth_user_changelist"),
                    },
                    {
                        "title": "Groups",
                        "icon": "group",
                        "link": reverse_lazy("admin:auth_group_changelist"),
                    },
                ],
            },
        ],
    },
}


# Email

MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}