from decimal import Decimal
import re

from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from datetime import datetime, time

import logging

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import hashers


from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


from .models import Product, Customer, Order, OrderItem, DailySales
from .otp import send_admin_otp, verify_admin_otp
from .serializers import (
    ProductSerializer,
    CustomerSerializer,
    OrderCreateSerializer,
    OrderSerializer,
)

# Indian mobile number: exactly 10 digits, starting 6-9.
PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")


def is_valid_email(value):
    try:
        validate_email(value)
        return True
    except ValidationError:
        return False


class ProductListView(generics.ListAPIView):
    """GET /api/products/ — public product catalog."""

    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class CustomerRegisterView(APIView):
    """POST /api/customers/register/ — { name, phone } -> customer record.

    Re-registering with a phone number already on file updates the name
    and returns the existing customer, rather than erroring, since the
    same person may order more than once.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        if not name or not phone:
            return Response(
                {"detail": "name and phone are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not PHONE_REGEX.match(phone):
            return Response(
                {"detail": "Enter a valid 10-digit mobile number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer, _ = Customer.objects.update_or_create(
            phone=phone, defaults={"name": name}
        )
        return Response(CustomerSerializer(customer).data, status=status.HTTP_200_OK)


class OrderCreateView(APIView):
    """POST /api/orders/ — { customer_id, items: [{product_id, quantity}] }.

    Validates stock, snapshots product name/price onto each order item,
    decrements stock, and computes the total server-side (never trusts a
    client-supplied price).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            customer = Customer.objects.get(id=data["customer_id"])
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

        if not data["items"]:
            return Response({"detail": "Order must have at least one item."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order = Order.objects.create(customer=customer, status="pending")
            total = Decimal("0")

            for item in data["items"]:
                try:
                    product = Product.objects.select_for_update().get(id=item["product_id"])
                except Product.DoesNotExist:
                    transaction.set_rollback(True)
                    return Response(
                        {"detail": f"Product {item['product_id']} not found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                quantity = item["quantity"]
                if product.stock < quantity:
                    transaction.set_rollback(True)
                    return Response(
                        {"detail": f"Not enough stock for {product.name}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    price=product.price,
                    quantity=quantity,
                )
                product.stock -= quantity
                product.save(update_fields=["stock"])
                total += product.price * quantity

            order.total = total
            order.save(update_fields=["total"])

        return Response(
            {"id": order.id, "status": order.status, "total": str(order.total)},
            status=status.HTTP_201_CREATED,
        )


class OrderPayView(APIView):
    """
    POST /api/orders/<order_id>/pay/

    Online payment -> paid
    Cash on delivery -> remains pending
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, order_id):

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        method = request.data.get("method", "").strip().lower()

        order.payment_method = method

        # Cash on Delivery -> order stays pending until the owner delivers.
        # Every other method (upi, online, card, ...) -> paid immediately.
        if method in ("cash_on_delivery", "cod"):
            order.status = "pending"
        else:
            order.status = "paid"

        order.save(update_fields=["status", "payment_method"])

        return Response(
            {
                "id": order.id,
                "status": order.status,
                "payment_method": order.payment_method,
            },
            status=status.HTTP_200_OK,
        )


class AdminLoginView(APIView):
    """POST /api/admin/login/ — simple username/password login, returns JWT."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        user = authenticate(username=username, password=password)

        if user is None or not user.is_staff:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Login successful.",
                "token": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=status.HTTP_200_OK,
        )


class AdminUserCreateView(APIView):
    """POST /api/admin/create-user/ — Create a new admin user with username, email, and password.

    Request body: { username, email, password }
    The new user will have is_staff=True so they can access the admin API.
    A verification email with OTP will be sent to the new user's email.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not username or not email or not password:
            return Response(
                {"detail": "username, email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "A user with this username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.is_staff = True
            user.save(update_fields=["is_staff"])
        except Exception as e:
            return Response(
                {"detail": f"Failed to create user: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Send OTP to the new admin's email for 2-step verification
        try:
            send_admin_otp(email)
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error("Failed to send OTP to new admin %s: %s", email, str(e))
            # User was created but OTP failed - still return success but warn
            return Response(
                {
                    "detail": "User created but failed to send OTP email. Contact shop owner.",
                    "user_id": user.id,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "detail": "User created successfully. OTP sent to your registered email.",
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminOtpVerifyView(APIView):
    """POST /api/admin/verify-otp/ — step 2 of 2.

    { email, otp } -> verifies the one-time code and returns the JWT.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email", "") or "").strip().lower()
        otp = (request.data.get("otp", "") or "").strip()

        if not email or not otp:
            return Response(
                {"detail": "email and otp are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email, is_staff=True).first()
        if user is None:
            return Response(
                {"detail": "Invalid code or expired session."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not verify_admin_otp(user.email, otp):
            return Response(
                {"detail": "Invalid or expired code. Request a new one."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({"token": str(refresh.access_token)})


class AdminChangeCredentialsView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):

        user = request.user

        # Only admin/staff users can change admin credentials
        if not user.is_staff:
            return Response(
                {"detail": "You are not authorized to change admin credentials."},
                status=status.HTTP_403_FORBIDDEN
            )

        current_password = request.data.get("current_password", "")
        new_username = request.data.get("username", "").strip()
        new_password = request.data.get("new_password", "")
        new_email = (request.data.get("email", "") or "").strip()

        # Current password is required
        if not current_password:
            return Response(
                {"detail": "Current password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current password
        if not user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # At least username, email or password must be changed
        if not new_username and not new_password and not new_email:
            return Response(
                {"detail": "Enter a new username, email or new password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Change username
        if new_username:

            if new_username != user.username:

                if User.objects.filter(username=new_username).exclude(
                    id=user.id
                ).exists():

                    return Response(
                        {"detail": "This username is already taken."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                user.username = new_username

        # Change email (must be a real email address)
        if new_email:

            if new_email.lower() != user.email.lower():

                if not is_valid_email(new_email):
                    return Response(
                        {"detail": "Enter a valid email address."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if User.objects.filter(email__iexact=new_email).exclude(
                    id=user.id
                ).exists():

                    return Response(
                        {"detail": "This email is already used by another account."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                user.email = new_email

        # Change password
        if new_password:

            if len(new_password) < 8:
                return Response(
                    {"detail": "New password must contain at least 8 characters."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)

        user.save()

        return Response(
            {
                "detail": "Admin credentials updated successfully."
            },
            status=status.HTTP_200_OK
        )

class AdminOrderListView(generics.ListAPIView):
    """GET /api/admin/orders/ — requires a staff user's Bearer token."""

    queryset = (
        Order.objects
        .select_related("customer")
        .prefetch_related("items")
        .all()
    )

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_staff:
            return Order.objects.none()

        return super().get_queryset()


class AdminOrderDoneView(APIView):
    """
    PATCH /api/admin/orders/<order_id>/done/

    Marks an order as completed and updates the DailySales record.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_id):

        # Check admin/staff permission
        if not request.user.is_staff:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Find the order
        try:
            order = Order.objects.prefetch_related("items").get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

       

        # Change order status
        order.status = "done"
        order.save(update_fields=["status"])

        # Get today's date using Django's configured timezone
        today = timezone.localdate()

        # Calculate number of items in this order
        items_count = sum(
            item.quantity
            for item in order.items.all()
        )

        # Get or create today's sales record
        daily_sales, created = DailySales.objects.get_or_create(
            date=today,
            defaults={
                "total_orders": 0,
                "total_items": 0,
                "total_amount": Decimal("0.00"),
            },
        )

        # Add this completed order to today's totals
        daily_sales.total_orders += 1
        daily_sales.total_items += items_count
        daily_sales.total_amount += order.total

        daily_sales.save(
            update_fields=[
                "total_orders",
                "total_items",
                "total_amount",
            ]
        )

        return Response(
            {
                "id": order.id,
                "status": order.status,
                "daily_sales": {
                    "date": str(daily_sales.date),
                    "total_orders": daily_sales.total_orders,
                    "total_items": daily_sales.total_items,
                    "total_amount": str(daily_sales.total_amount),
                },
            },
            status=status.HTTP_200_OK,
        )


class AdminDashboardView(APIView):
    """
    GET /api/admin/dashboard/

    Returns:
    - selected date
    - daily order count
    - daily sales
    - monthly order count
    - monthly sales
    - all orders for the selected date
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        # -----------------------------------------
        # ADMIN CHECK
        # -----------------------------------------

        if not request.user.is_staff:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # -----------------------------------------
        # SELECTED DATE
        # -----------------------------------------

        date_string = request.query_params.get("date")

        if date_string:
            try:
                selected_date = datetime.strptime(
                    date_string,
                    "%Y-%m-%d"
                ).date()

            except ValueError:
                return Response(
                    {
                        "detail": "Invalid date format. Use YYYY-MM-DD."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            selected_date = timezone.localdate()

        # -----------------------------------------
        # SELECTED DATE ORDERS
        # -----------------------------------------

        start_datetime = timezone.make_aware(
            datetime.combine(
                selected_date,
                time.min
            )
        )

        end_datetime = timezone.make_aware(
            datetime.combine(
                selected_date,
                time.max
            )
        )

        orders = (
            Order.objects
            .filter(
                created_at__gte=start_datetime,
                created_at__lte=end_datetime,
            )
            .select_related("customer")
            .prefetch_related("items")
            .order_by("-created_at")
        )

        # -----------------------------------------
        # DAILY CALCULATION
        # -----------------------------------------

        daily_order_count = orders.count()

        daily_total_sales = sum(
            (order.total for order in orders),
            Decimal("0.00")
        )

        # -----------------------------------------
        # MONTH START
        # -----------------------------------------

        month_start = selected_date.replace(day=1)

        if selected_date.month == 12:
            next_month = selected_date.replace(
                year=selected_date.year + 1,
                month=1,
                day=1,
            )
        else:
            next_month = selected_date.replace(
                month=selected_date.month + 1,
                day=1,
            )

        month_start_datetime = timezone.make_aware(
            datetime.combine(
                month_start,
                time.min
            )
        )

        next_month_datetime = timezone.make_aware(
            datetime.combine(
                next_month,
                time.min
            )
        )

        # -----------------------------------------
        # MONTHLY ORDERS
        # -----------------------------------------

        monthly_orders = (
            Order.objects
            .filter(
                created_at__gte=month_start_datetime,
                created_at__lt=next_month_datetime,
            )
        )

        monthly_order_count = monthly_orders.count()

        monthly_total_sales = sum(
            (
                order.total
                for order in monthly_orders
            ),
            Decimal("0.00")
        )

        # -----------------------------------------
        # SERIALIZE ORDERS
        # -----------------------------------------

        order_data = []

        for order in orders:

            items_data = []

            for item in order.items.all():

                items_data.append(
                    {
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "price": str(item.price),
                    }
                )

            order_data.append(
                {
                    "id": order.id,
                    "customer_name": order.customer.name,
                    "customer_phone": order.customer.phone,
                    "status": order.status,
                    "total": str(order.total),
                    "created_at": order.created_at.isoformat(),
                    "items": items_data,
                }
            )

        # -----------------------------------------
        # RESPONSE
        # -----------------------------------------

        return Response(
            {
                "today": str(timezone.localdate()),

                "selected_date": str(selected_date),

                "daily": {
                    "order_count": daily_order_count,
                    "total_sales": str(
                        daily_total_sales
                    ),
                },

                "monthly": {
                    "order_count": monthly_order_count,
                    "total_sales": str(
                        monthly_total_sales
                    ),
                },

                "orders": order_data,
            },
            status=status.HTTP_200_OK,
        )