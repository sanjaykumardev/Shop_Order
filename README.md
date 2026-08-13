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

## Deploying to production (step by step)

Architecture: **Next.js frontend → Vercel**, **Django API → Render**
(Vercel cannot run Django; the Postgres database is already on Supabase).

> Plan: GitHub repo → Render backend → Vercel frontend.
> Do these in order — the frontend needs the backend URL, so deploy
> the backend first.

---

### Step 1 — Create the GitHub repository

1. Go to https://github.com/new
2. **Repository name**: `Shop-Itmes`
3. Choose **Public** or **Private** (either works).
4. **Do NOT** check "Add a README", ".gitignore", or "license" (this repo
   already has them).
5. Click **Create repository**.
6. Copy your repo URL — it looks like
   `https://github.com/YOUR_USERNAME/Shop-Itmes.git`.

### Step 2 — Push this project to GitHub

Open a terminal in this project folder (`D:\DEVELOPER\Shop-Itmes`) and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Shop-Itmes.git
git push -u origin main
```

Enter your GitHub username and a **Personal Access Token** when prompted
(not your normal password). If you don't have a token:
https://github.com/settings/tokens → **Generate new token (classic)** →
tick `repo` scope → copy the token and paste it as the password.

Refresh your GitHub repo page — all files should be there.

---

### Step 3 — Deploy the backend to Render

1. Go to https://render.com and sign up / log in.
2. Click **New +** → **Blueprint** → select your `Shop-Itmes` repository.
3. Render reads `backend/render.yaml` and creates a web service called
   `shop-backend`. Click **Apply**.
4. While it builds, open the service and go to the **Environment** tab.
   Add these two variables (the other two are auto-generated):

   | Variable                  | Value |
   |---------------------------|-------|
   | `DATABASE_URL`            | your Supabase connection string |
   | `CORS_ALLOWED_ORIGINS`    | `https://YOUR_PROJECT.vercel.app` (you'll get this in Step 5 — you can add it later and Render redeploys automatically) |

   **Where to find the Supabase connection string:**
   - Supabase dashboard → your project → **Settings** → **Database** →
     **Connection string** → copy the **URI** (port 5432) and paste it as
     `DATABASE_URL`.

5. Render runs `migrate` automatically during the build, so the Supabase
   tables are created on first deploy.
6. After the service shows **Live**, click **Shell** in the Render service
   and create your owner account:
   ```bash
   python manage.py createsuperuser
   ```
   Answer the prompts (username, email, password). This is your login for
   `/admin/login`.
   - If your Supabase DB already has an admin user (`fanboy` from the
     starter data) but you don't know its password, reset it instead:
     ```bash
     python manage.py changepassword fanboy
     ```
7. Copy your backend URL — it looks like
   `https://shop-backend.onrender.com`.
8. **Test it:** open `https://shop-backend.onrender.com/api/products/` in
   a browser — you should see the 11 products as JSON.

---

### Step 4 — Set your frontend backend URL

In `frontend/lib/api.ts` the API base is controlled by an env var. For
production it must point at your Render URL, so the frontend build needs:

```
NEXT_PUBLIC_API_BASE=https://shop-backend.onrender.com/api
```

(You set this on Vercel in Step 5 — no code changes needed.)

---

### Step 5 — Deploy the frontend to Vercel

1. Go to https://vercel.com and log in with GitHub.
2. **Add New** → **Project** → import your `Shop-Itmes` repository.
   (You may need to "Import" → grant Vercel access to the repo first.)
3. Vercel auto-detects **Next.js**. Leave framework/preset as is.
4. Click **Environment Variables** and add one:

   | Key                     | Value |
   |-------------------------|-------|
   | `NEXT_PUBLIC_API_BASE`  | `https://shop-backend.onrender.com/api` |

5. Click **Deploy**. Wait for the build to finish (it takes ~1 minute).
6. You get a URL like `https://shop-xxxx.vercel.app`.

---

### Step 6 — Wire CORS and test everything

1. Go back to **Render** → service → **Environment** and confirm
   `CORS_ALLOWED_ORIGINS` includes your Vercel URL:
   `https://shop-xxxx.vercel.app`. (Save → it auto-redeploys.)
2. Open your Vercel URL:
   - `/` → redirects to `/register` → register → browse products →
     add to cart → checkout → pay.
   - `/admin/login` → log in with the superuser you created in Step 3.
3. If products show a broken image, make sure the Render URL is reachable:
   open `https://shop-backend.onrender.com/api/products/` — image fields
   contain full URLs served by the backend.

---

### What to check if something breaks

- **Frontend can't load products** → `NEXT_PUBLIC_API_BASE` missing or
  wrong on Vercel; or the Render service isn't Live.
- **CORS error in the browser** → `CORS_ALLOWED_ORIGINS` on Render doesn't
  include your exact Vercel URL.
- **`AllowsHost` error from Django** → your backend domain isn't in
  `ALLOWED_HOSTS`. `*.onrender.com` is allowed by default; a custom domain
  must be added.
- **Login fails** → reset the admin password via Render Shell
  (`python manage.py changepassword <username>`).

### Extra notes

- Product images ship inside the repo (`backend/media/`) and are served by
  the backend at `/media/...`. New images uploaded via Django admin live on
  Render's disk and are lost on redeploy unless you back them up — for a
  real store, move uploads to Supabase Storage.
- `*.vercel.app` preview URLs are allowed by CORS automatically. For a
  custom frontend domain, add it to `CORS_ALLOWED_ORIGINS` on Render and
  `ALLOWED_HOSTS` if you use a custom backend domain.
