from django.urls import path

from .views import (
    AdminChangeCredentialsView,
    AdminUserCreateView,
    ProductListView,
    CustomerRegisterView,
    OrderCreateView,
    OrderPayView,
    AdminLoginView,
    AdminOtpVerifyView,
    AdminOrderListView,
    AdminOrderDoneView,
    AdminDashboardView,
)


urlpatterns = [

    # PRODUCTS

    path(
        "products/",
        ProductListView.as_view(),
        name="products"
    ),


    # CUSTOMER

    path(
        "customers/register/",
        CustomerRegisterView.as_view(),
        name="customer-register"
    ),


    # ORDERS

    path(
        "orders/",
        OrderCreateView.as_view(),
        name="order-create"
    ),

    path(
        "orders/<int:order_id>/pay/",
        OrderPayView.as_view(),
        name="order-pay"
    ),


    # ADMIN

    path(
        "admin/login/",
        AdminLoginView.as_view(),
        name="admin-login"
    ),

    path(
        "admin/verify-otp/",
        AdminOtpVerifyView.as_view(),
        name="admin-verify-otp"
    ),
    
    path(
    "admin/change-credentials/",
    AdminChangeCredentialsView.as_view(),
    name="admin-change-credentials"
),
    path(
        "admin/orders/",
        AdminOrderListView.as_view(),
        name="admin-orders"
    ),

    path(
        "admin/orders/<int:order_id>/done/",
        AdminOrderDoneView.as_view(),
        name="admin-order-done"
    ),

    path(
        "admin/dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard"
    ),

    # ADMIN USER MANAGEMENT

    path(
        "admin/create-user/",
        AdminUserCreateView.as_view(),
        name="admin-create-user"
    ),
]