# Shop backend — Django (SQLite by default, Supabase optional)

This implements every endpoint the Next.js frontend calls, backed by four
tables (Product, Customer, Order, OrderItem). Verified locally: builds,
migrates, and all endpoints tested end-to-end (register → order → pay →
admin login → admin order list) before packaging.

## Quick start — no database setup needed

By default this runs on a local `db.sqlite3` file. No Supabase, no
external service — just to get frontend and backend talking to each
other first.

```bash
cd backend
python3 -m venv venv
venv\Scripts\activate        # Windows — or: source venv/bin/activate on Mac/Linux
pip install -r requirements.txt

python manage.py migrate           # creates all 4 tables in db.sqlite3
python manage.py createsuperuser   # this becomes your OWNER login
python manage.py runserver 127.0.0.1:8000
```

The `createsuperuser` account is what you log in with on `/admin/login`
in the frontend — the API only issues tokens to staff users.

Then in a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` for the customer flow, `http://localhost:3000/admin/login`
for the owner side.

## Switching to Supabase later

1. Go to supabase.com → New project. Note the database password you set.
2. **Settings → Database → Connection string → URI** — copy the
   **Transaction pooler** URI (port 6543).
3. `cp .env.example .env`, then paste that URI into `DATABASE_URL` and
   set `DJANGO_SECRET_KEY` to any random string.
4. Delete `db.sqlite3` and re-run `python manage.py migrate` — this
   recreates the same 4 tables in Supabase instead of locally.
5. Re-run `createsuperuser` (Supabase starts with an empty `auth_user`
   table — your old sqlite superuser doesn't carry over).

## Tables created

| Table        | Purpose                                                     |
|--------------|---------------------------------------------------------------|
| `shop_product`   | Catalog: name, description, price, stock, image           |
| `shop_customer`  | Registered customers: name, phone (unique)                |
| `shop_order`     | One per checkout: customer, status, total, payment_method |
| `shop_orderitem` | Line items per order, with product name/price snapshotted |

Snapshotting `product_name`/`price` onto each `OrderItem` means past
orders stay accurate even if you rename or reprice a product later.

## Endpoints (all under `/api/`)

| Method | Path                     | Auth        | Notes |
|--------|--------------------------|-------------|-------|
| GET    | `/products/`             | none        | Public catalog |
| POST   | `/customers/register/`   | none        | `{ name, phone }`, upserts by phone |
| POST   | `/orders/`                | none        | `{ customer_id, items }`, validates stock, computes total server-side |
| POST   | `/orders/<id>/pay/`       | none        | `{ method }`, marks paid (stub — see below) |
| POST   | `/admin/login/`           | none        | `{ username, password }`, staff-only, returns `{ token }` (JWT) |
| GET    | `/admin/orders/`          | Bearer token| Full order list with items + customer name |

## Adding products / seeing orders quickly

Django admin is live at `http://127.0.0.1:8000/admin/` — log in with the
same superuser account to add products, edit stock, or browse orders
without touching the frontend.

## Not yet built (say the word if you want these added)
- Real payment gateway integration — `/orders/<id>/pay/` currently trusts
  the client and marks the order paid immediately. Fine for testing,
  not for real money.
- Order status transitions beyond pending/paid (shipped, cancelled) from
  the owner side.
- Rate limiting / throttling on the public endpoints.
