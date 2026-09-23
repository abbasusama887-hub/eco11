from datetime import timedelta
from decimal import Decimal

from django import template
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.utils import timezone

from api.models import Customer, Order, Product, Review, StockAlert

register = template.Library()


@register.simple_tag
def dashboard_data():
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue_qs = Order.objects.exclude(status="cancelled")
    revenue = revenue_qs.aggregate(total=Sum("total"))["total"] or Decimal("0")
    recent_orders = Order.objects.order_by("-created_at")[:6]
    monthly_revenue = []

    for offset in range(5, -1, -1):
        month = (month_start - timedelta(days=offset * 31)).replace(day=1)
        next_month = (month.replace(day=28) + timedelta(days=4)).replace(day=1)
        value = (
            revenue_qs.filter(created_at__gte=month, created_at__lt=next_month)
            .aggregate(total=Sum("total"))["total"]
            or Decimal("0")
        )
        monthly_revenue.append({
            "label": month.strftime("%b"),
            "value": value,
        })

    max_revenue = max((item["value"] for item in monthly_revenue), default=Decimal("0"))
    for item in monthly_revenue:
        item["height"] = int((item["value"] / max_revenue) * 100) if max_revenue else 0

    user_model = get_user_model()
    return {
        "today": now.strftime("%A, %B %d, %Y"),
        "products": Product.objects.count(),
        "customers": Customer.objects.count(),
        "users": user_model.objects.filter(is_active=True).count(),
        "orders": Order.objects.count(),
        "revenue": revenue,
        "reviews_pending": Review.objects.filter(is_approved=False).count(),
        "stock_alerts": StockAlert.objects.filter(notified=False).count(),
        "monthly_revenue": monthly_revenue,
        "recent_orders": recent_orders,
    }
