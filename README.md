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
