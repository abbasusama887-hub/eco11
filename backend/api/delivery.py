import math
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import DeliveryBoy, DeliveryBoyLocation, Order, OrderDeliveryAssignment


def haversine_km(latitude_a, longitude_a, latitude_b, longitude_b):
    """Return great-circle distance in kilometres."""
    radius = 6371.0
    lat_a, lon_a, lat_b, lon_b = map(math.radians, map(float, (latitude_a, longitude_a, latitude_b, longitude_b)))
    delta_lat = lat_b - lat_a
    delta_lon = lon_b - lon_a
    value = math.sin(delta_lat / 2) ** 2 + math.cos(lat_a) * math.cos(lat_b) * math.sin(delta_lon / 2) ** 2
    return radius * 2 * math.asin(math.sqrt(value))


def eligible_delivery_boys(order):
    if order.delivery_latitude is None or order.delivery_longitude is None:
        return []

    max_age = timezone.now() - timedelta(minutes=getattr(settings, "DELIVERY_LOCATION_MAX_AGE_MINUTES", 15))
    maximum_orders = getattr(settings, "DELIVERY_MAX_ACTIVE_ORDERS", 3)
    radius = getattr(settings, "DELIVERY_MAX_ASSIGNMENT_RADIUS_KM", 20)
    results = []
    queryset = DeliveryBoy.objects.filter(
        employment_status="active",
        verification_status="verified",
        current_location__is_online=True,
        current_location__last_seen_at__gte=max_age,
    ).select_related("current_location").distinct()

    for delivery_boy in queryset:
        active_orders = delivery_boy.assigned_orders.filter(
            assignment_status="assigned",
            status__in=["assigned", "out_for_delivery"],
        ).count()
        if active_orders >= maximum_orders:
            continue
        location = delivery_boy.current_location
        distance = haversine_km(
            location.latitude,
            location.longitude,
            order.delivery_latitude,
            order.delivery_longitude,
        )
        if distance <= radius:
            results.append({"delivery_boy": delivery_boy, "distance": distance, "active_orders": active_orders})
    return sorted(results, key=lambda item: item["distance"])


def assign_order(order, delivery_boy, assigned_by=None, assignment_type="manual", distance=None):
    if not delivery_boy.is_eligible:
        raise ValidationError("The delivery boy must be verified and active.")
    if order.assignment_status == "assigned" and order.assigned_delivery_boy_id == delivery_boy.id:
        raise ValidationError("This order is already assigned to this delivery boy.")

    maximum_orders = getattr(settings, "DELIVERY_MAX_ACTIVE_ORDERS", 3)
    active_orders = delivery_boy.assigned_orders.filter(
        assignment_status="assigned", status__in=["assigned", "out_for_delivery"],
    ).count()
    if active_orders >= maximum_orders:
        raise ValidationError("This delivery boy has reached the active order limit.")

    with transaction.atomic():
        if order.assigned_delivery_boy_id:
            OrderDeliveryAssignment.objects.filter(
                order=order, status="active",
            ).update(status="unassigned", unassigned_at=timezone.now())
        assignment = OrderDeliveryAssignment.objects.create(
            order=order,
            delivery_boy=delivery_boy,
            assigned_by=assigned_by,
            assignment_type=assignment_type,
            distance_at_assignment=Decimal(str(round(distance, 2))) if distance is not None else None,
        )
        order.assigned_delivery_boy = delivery_boy
        order.assignment_status = "assigned"
        order.status = "assigned"
        order.assigned_at = timezone.now()
        order.assigned_by = assigned_by
        order.save(update_fields=["assigned_delivery_boy", "assignment_status", "status", "assigned_at", "assigned_by", "updated_at"])
    return assignment


def auto_assign_order(order, assigned_by=None):
    if order.assignment_status == "assigned":
        raise ValidationError("This order is already assigned.")
    candidates = eligible_delivery_boys(order)
    if not candidates:
        raise ValidationError("No suitable delivery boy found within the configured delivery radius.")
    candidate = candidates[0]
    return assign_order(
        order,
        candidate["delivery_boy"],
        assigned_by=assigned_by,
        assignment_type="automatic",
        distance=candidate["distance"],
    )


def update_delivery_location(delivery_boy, latitude, longitude, accuracy=None, is_online=True):
    location, _ = DeliveryBoyLocation.objects.update_or_create(
        delivery_boy=delivery_boy,
        defaults={
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "is_online": is_online,
            "last_seen_at": timezone.now(),
        },
    )
    return location
