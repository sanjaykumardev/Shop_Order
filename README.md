# Shop — full-stack project

- `frontend/` — Next.js 14 (TypeScript, Tailwind). Customer flow (register →
  browse → cart → checkout) and owner flow (admin login → order list).
- `backend/` — Django + DRF. Runs on local SQLite by default — no
  external database needed to get frontend and backend talking to each
  other. Supabase Postgres is a drop-in swap for later (see
  `backend/README.md`).

Both were built and verified together: the frontend builds cleanly
(`npm run build`, 8 static routes), and the backend was smoke-tested
end-to-end against every endpoint (customer registration, order
creation with stock validation, payment, admin login, admin order
list) on a fresh install before packaging.

## Quick start — frontend + backend only, no database setup

**Backend:**
```bash
cd backend
python3 -m venv venv
venv\Scripts\activate        # Windows — or: source venv/bin/activate on Mac/Linux
pip install -r requirements.txt
python manage.py migrate           # creates db.sqlite3 with all 4 tables
python manage.py createsuperuser   # this is your owner login
python manage.py runserver 127.0.0.1:8000
```

**Frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/register` to start
the customer flow. Visit `http://localhost:3000/admin/login` for the
owner side, using the superuser credentials you created above.

## Adding Supabase later

See `backend/README.md` — it's a few env-var changes and a re-run of
`migrate`, nothing in the models/views/frontend needs to change.

## How frontend and backend connect

`frontend/lib/api.ts` has every endpoint URL in one place, pointed at
`http://127.0.0.1:8000/api`. If you deploy the backend elsewhere,
that's the only file to change.

## Deploying to production

Architecture: **Next.js frontend → Vercel**, **Django API → Render**
(Vercel cannot run Django; the Postgres database is Supabase).

### 1. Push the repo to GitHub

```bash
git remote add origin https://github.com/<your-username>/Shop-Itmes.git
git push -u origin main
```

(Or create a repo at github.com/new first, then push.)

### 2. Deploy the backend to Render

1. Render → **New + → Blueprint** → select this repo. `backend/render.yaml`
   is auto-detected and creates the `shop-backend` web service.
2. In the service's **Environment** tab set:
   - `DATABASE_URL` → your Supabase connection string (Settings → Database → URI)
   - `CORS_ALLOWED_ORIGINS` → `https://<your-frontend>.vercel.app`
   - `CSRF_TRUSTED_ORIGINS` → `https://<your-frontend>.vercel.app`
3. Render runs `migrate` on build, so the Supabase schema is created
   automatically (it's already migrated if you ran it locally).
4. Create/reset the owner login with **Render → service → Shell**:
   ```bash
   python manage.py createsuperuser
   ```
   (Your Supabase DB may already have an admin user — `fanboy` from the
   starter data. Reset its password with `python manage.py changepassword fanboy`.)
5. Note the URL, e.g. `https://shop-backend.onrender.com`.

### 3. Deploy the frontend to Vercel

1. Vercel → **Add New → Project** → import this repo. Next.js is
   auto-detected.
2. Under **Environment Variables** add:
   - `NEXT_PUBLIC_API_BASE` → `https://shop-backend.onrender.com/api`
3. Deploy. The shop is live at `https://<your-project>.vercel.app`, admin
   at `/admin/login`.

### Extra notes

- Product images ship inside the repo (`backend/media/`) and are served by
  the backend at `/media/...`. New images uploaded via Django admin live on
  Render's disk and are lost on redeploy unless you back them up — for a
  real store, move uploads to Supabase Storage.
- `*.vercel.app` preview URLs are allowed by CORS automatically. For a
  custom frontend domain, add it to `CORS_ALLOWED_ORIGINS` on Render and
  `ALLOWED_HOSTS` if you use a custom backend domain.
