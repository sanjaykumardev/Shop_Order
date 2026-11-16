from django.contrib import admin
from .models import Product, Customer, Order, OrderItem, DailySales, AdminOTP


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin configuration for Product model."""
    list_display = ["name", "price", "stock", "created_at"]
    search_fields = ["name"]
    list_editable = ["price", "stock"]
    list_filter = ["created_at"]
    readonly_fields = ["created_at"]
    fieldsets = (
        (None, {"fields": ("name", "description")}),
        ("Pricing & Stock", {
            "fields": ("price", "stock"),
            "description": "Set price and current stock quantity"
        }),
        ("Media", {"fields": ("image",), "description": "Product image (optional)"}),
        ("Timestamps", {"fields": ("created_at",), "classes": ("collapse",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("name", "description", "price", "stock", "image"),
        }),
    )


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """Admin configuration for Customer model."""
    list_display = ["name", "phone", "created_at"]
    search_fields = ["name", "phone"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "product_name", "price", "quantity"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin configuration for Order model."""
    list_display = ["id", "customer", "status", "total", "created_at"]
    list_filter = ["status"]
    inlines = [OrderItemInline]


@admin.register(DailySales)
class DailySalesAdmin(admin.ModelAdmin):
    """Admin configuration for DailySales model."""
    list_display = ["date", "total_orders", "total_items", "total_amount"]
    search_fields = ["date"]


@admin.register(AdminOTP)
class AdminOTPAdmin(admin.ModelAdmin):
    """Admin configuration for AdminOTP model."""
    list_display = ["email", "created_at", "expires_at", "is_used"]
    list_filter = ["is_used"]
    search_fields = ["email"]