from rest_framework import serializers
import os
from .models import Product, Customer, Order, OrderItem


class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "stock",
            "image",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "name", "phone"]


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField()
    items = OrderItemInputSerializer(many=True)


class OrderItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderItem
        fields = [
            "product_name",
            "quantity",
            "price",
            "image",
        ]


class OrderSerializer(serializers.ModelSerializer):

    """Used for the admin order list — includes customer name/phone and items."""

    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer_name",
            "customer_phone",
            "status",
            "payment_method",
            "total",
            "created_at",
            "items",
        ]