from django.contrib import admin
from .models import Product, Customer, Order, OrderItem, DailySales


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "price", "stock", "created_at"]
    search_fields = ["name"]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "created_at"]
    search_fields = ["name", "phone"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "product_name", "price", "quantity"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "status", "total", "created_at"]
    list_filter = ["status"]
    inlines = [OrderItemInline]


@admin.register(DailySales)
class DailySalesAdmin(admin.ModelAdmin):
    list_display = ["date", "total_orders", "total_items", "total_amount"]
    search_fields = ["date"]