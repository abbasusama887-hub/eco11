from django.db import migrations


def link_legacy_orders(apps, schema_editor):
    Order = apps.get_model("api", "Order")
    Customer = apps.get_model("api", "Customer")
    for order in Order.objects.filter(customer__isnull=True):
        customer = Customer.objects.filter(phone=order.phone).first()
        if customer is None and order.email:
            customer = Customer.objects.filter(user__email__iexact=order.email).first()
        if customer is not None:
            order.customer_id = customer.pk
            order.save(update_fields=["customer"])


class Migration(migrations.Migration):
    dependencies = [("api", "0008_order_cancellation_notes_order_cancellation_reason_and_more")]

    operations = [migrations.RunPython(link_legacy_orders, migrations.RunPython.noop)]
