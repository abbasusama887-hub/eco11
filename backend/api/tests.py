from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .delivery import auto_assign_order, haversine_km
from .models import Brand, Category, Color, Customer, DeliveryBoy, DeliveryBoyLocation, Order, OrderStatusHistory, Product, ProductVariant, Size


@override_settings(DELIVERY_MAX_ASSIGNMENT_RADIUS_KM=20, DELIVERY_LOCATION_MAX_AGE_MINUTES=15)
class DeliveryAssignmentTests(TestCase):
	def setUp(self):
		self.admin = get_user_model().objects.create_user(username="admin", password="test-pass")
		self.order = Order.objects.create(
			full_name="Customer", phone="03000000000", address="Model Town", city="Lahore",
			delivery_latitude=Decimal("31.469700"), delivery_longitude=Decimal("74.272800"),
			location_source="manual",
		)

	def create_courier(self, employee_id, latitude, longitude, online=True):
		courier = DeliveryBoy.objects.create(
			employee_id=employee_id, full_name=employee_id, cnic_number=f"CNIC-{employee_id}",
			phone=f"03{employee_id[-8:]}", email=f"{employee_id}@example.com",
			employment_status="active", verification_status="verified",
		)
		DeliveryBoyLocation.objects.create(
			delivery_boy=courier, latitude=latitude, longitude=longitude, is_online=online,
		)
		return courier

	def test_haversine_uses_geographic_distance(self):
		self.assertLess(haversine_km(31.4697, 74.2728, 31.4700, 74.2740), 1)

	def test_auto_assignment_selects_nearest_eligible_courier(self):
		nearest = self.create_courier("DB-NEAR", "31.470000", "74.274000")
		self.create_courier("DB-FAR", "31.490000", "74.300000")

		assignment = auto_assign_order(self.order, self.admin)

		self.assertEqual(assignment.delivery_boy, nearest)
		self.assertEqual(self.order.refresh_from_db(), None)
		self.assertEqual(self.order.assigned_delivery_boy, nearest)

	def test_offline_nearest_courier_is_excluded(self):
		self.create_courier("DB-OFFLINE", "31.470000", "74.274000", online=False)
		available = self.create_courier("DB-AVAILABLE", "31.480000", "74.280000")

		assignment = auto_assign_order(self.order, self.admin)

		self.assertEqual(assignment.delivery_boy, available)


class CustomerOrderSecurityTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.user_a = get_user_model().objects.create_user(username="user-a", password="test-pass", email="a@example.com")
		self.user_b = get_user_model().objects.create_user(username="user-b", password="test-pass", email="b@example.com")
		Customer.objects.create(user=self.user_a, phone="03000000001")
		Customer.objects.create(user=self.user_b, phone="03000000002")
		self.order = Order.objects.create(customer=self.user_a.customer_profile, full_name="A", phone="03000000001", address="A", city="Lahore")

	def authenticate(self, user):
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.create(user=user).key}")

	def test_other_customer_cannot_read_order(self):
		self.authenticate(self.user_b)
		response = self.client.get(f"/api/orders/{self.order.id}/")
		self.assertEqual(response.status_code, 404)

	def test_customer_can_cancel_within_two_hours(self):
		self.authenticate(self.user_a)
		response = self.client.post(f"/api/orders/{self.order.id}/cancel/", {"reason": "Changed my mind"}, format="json")
		self.assertEqual(response.status_code, 200)
		self.order.refresh_from_db()
		self.assertEqual(self.order.status, "cancelled")
		self.assertEqual(self.order.cancellation_source, "customer")

	def test_customer_cannot_cancel_after_two_hours(self):
		Order.objects.filter(pk=self.order.pk).update(created_at=timezone.now() - timedelta(hours=2, minutes=1))
		self.authenticate(self.user_a)
		response = self.client.post(f"/api/orders/{self.order.id}/cancel/", {"reason": "Changed my mind"}, format="json")
		self.assertEqual(response.status_code, 400)

	def test_checkout_creates_order_status_history(self):
		brand = Brand.objects.create(name="Test Brand")
		category = Category.objects.create(name="Test Category", slug="test-category")
		size = Size.objects.create(system="UK", value="8")
		color = Color.objects.create(name="Test Black", hex_code="#000000")
		product = Product.objects.create(name="Test Product", sku="TEST-SKU", brand=brand, category=category, price=100)
		variant = ProductVariant.objects.create(product=product, size=size, color=color, stock_quantity=1)
		response = self.client.post("/api/orders/", {
			"full_name": "Checkout Customer", "email": "checkout@example.com",
			"phone": "03000000003", "address": "Checkout Street", "city": "Lahore",
			"delivery_latitude": 31.4697, "delivery_longitude": 74.2728,
			"location_source": "manual", "payment_method": "cod",
			"items": [{"variant_id": variant.id, "quantity": 1}],
		}, format="json")
		self.assertEqual(response.status_code, 201)
		order = Order.objects.get(pk=response.data["id"])
		self.assertTrue(OrderStatusHistory.objects.filter(order=order, new_status="pending").exists())

	def test_authenticated_checkout_order_appears_in_my_orders(self):
		brand = Brand.objects.create(name="Member Brand")
		category = Category.objects.create(name="Member Category", slug="member-category")
		size = Size.objects.create(system="UK", value="9")
		color = Color.objects.create(name="Member Black", hex_code="#111111")
		product = Product.objects.create(name="Member Product", sku="MEMBER-SKU", brand=brand, category=category, price=100)
		variant = ProductVariant.objects.create(product=product, size=size, color=color, stock_quantity=1)
		self.authenticate(self.user_a)
		response = self.client.post("/api/orders/", {
			"full_name": "A", "email": "a@example.com", "phone": "03000000001",
			"address": "A", "city": "Lahore", "delivery_latitude": 31.4697,
			"delivery_longitude": 74.2728, "location_source": "manual", "payment_method": "cod",
			"items": [{"variant_id": variant.id, "quantity": 1}],
		}, format="json")
		self.assertEqual(response.status_code, 201)
		orders = self.client.get("/api/orders/mine/")
		order_ids = [item["id"] for item in orders.data["results"]]
		self.assertIn(response.data["id"], order_ids)
