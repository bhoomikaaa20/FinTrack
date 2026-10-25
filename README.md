# FinTrack Cloud

**A full-stack personal finance tracker with budgets, receipt storage, high-value transaction monitoring and an admin console.**

Built with **React 19 + TanStack Start** on the frontend and **Node.js + Express 5 + MongoDB** on the backend, written end-to-end in **TypeScript**.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Table of contents

- [The problem](#the-problem)
- [The solution](#the-solution)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Admin access](#admin-access)
- [Viewing the data in MongoDB Compass](#viewing-the-data-in-mongodb-compass)
- [API reference](#api-reference)
- [Security](#security)
- [Engineering challenges & how they were solved](#engineering-challenges--how-they-were-solved)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)

---

## The problem

Most people and small teams track money in spreadsheets or banking apps that:

- **scatter information.** Receipts live in email or photo galleries and are disconnected from the transactions they prove.
- **only show the past.** You find out you overspent on food *after* the month ends, not when it happens.
- **don't flag risk.** A single unusually large payment looks the same as a coffee.
- **have no oversight layer.** In a shared or team setting, nobody can review activity across accounts.

## The solution

FinTrack Cloud puts all of this in one secure web app:

| Problem | How FinTrack solves it |
| ------- | ---------------------- |
| Receipts are scattered | Attach an image or PDF receipt to any transaction; it is stored privately and only the owner (or an admin) can open it |
| Overspending is noticed too late | Set **monthly budgets per category**. You get an **instant alert** the moment a new expense pushes a category over its limit, plus progress bars on the dashboard |
| Large payments go unnoticed | Every transaction over **$50,000** is automatically flagged `HIGH` and surfaced in the admin console |
| No overview | The dashboard shows income, expenses, balance, a 6-month trend and a spending-by-category breakdown |
| No oversight | Admins see all users, all transactions and every high-value flag, and can promote or demote other admins |
| Data stuck in the app | Filter by date, type, status or keyword and **export to CSV** for accounting |

---

## Features

### For users
- **Authentication:** sign up, sign in and sign out with a secure HttpOnly cookie session (7 days)
- **Transactions:** create, **edit**, delete (with confirmation); amount, type, category, date, note and optional receipt
- **Receipts:** upload, replace or remove images or PDFs (max 5 MB), viewable only by their owner
- **Search, filter and sort:** keyword search across category and notes, filter by type, status and date range, sort by date or amount
- **CSV export** of the current filtered view
- **Dashboard:** total income, expenses, balance, high-value count, 6-month income-vs-expense chart, spending by category, budget progress
- **Budgets:** monthly limit per expense category, with live "spent / limit" progress (green, then amber at 80%, then red when over) and a toast warning when a new expense goes over budget
- **High-value flagging:** automatic `HIGH` badge for amounts over $50,000 (re-evaluated when you edit)
- **Profile:** update your display name and change your password (current password required)

### For admins
- System-wide stats: users, transactions, high-value flags
- Tabs for **high-value transactions**, **all transactions** and **users**
- **Role management:** promote a user to admin or demote one with a single click (admins can't demote themselves, which prevents lockouts)

---

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, TanStack Start / Router (file-based routing, SSR), Tailwind CSS v4, shadcn/ui (Radix primitives), Sonner toasts, Lucide icons, Vite 7 |
| Backend  | Node.js, Express 5, TypeScript, Mongoose 9 |
| Database | MongoDB |
| Auth     | JWT stored in an HttpOnly cookie, bcrypt password hashing, role-based access control |
| Uploads  | Multer (disk storage, type and size validation) |
| Security | helmet, express-rate-limit, CORS allow-list, Origin-based CSRF check |

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI["React + TanStack Router<br/>(Dashboard, Transactions, Budgets, Profile, Admin)"]
    end

    subgraph API["Express API (Node.js)"]
        MW["helmet · CORS · CSRF origin check<br/>rate limiter · JSON error handler"]
        AUTH["verifyUser<br/>(JWT + role loaded from DB)"]
        CTRL["Controllers<br/>auth · transactions · budgets · admin"]
        UP["Multer uploads<br/>(images / PDF, 5 MB)"]
    end

    DB[(MongoDB<br/>users · transactions · budgets)]
    FS[[uploads/ folder<br/>private receipts]]

    UI -- "fetch (credentials: include)<br/>HttpOnly cookie" --> MW --> AUTH --> CTRL
    CTRL --> DB
    CTRL --> UP --> FS
    UI -- "GET /uploads/:file (owner or admin only)" --> AUTH
```

**Request flow example: adding an expense**

1. The user submits the form; the browser sends `multipart/form-data` with the auth cookie.
2. `verifyUser` validates the JWT, then **loads the user's current role from MongoDB**.
3. Multer validates and stores the receipt under a random filename.
4. The controller validates every field, flags the expense `HIGH` if it's over $50k, and saves it.
5. The controller aggregates this month's spend for that category; if it exceeds the budget, the response includes `budget_alert`.
6. The UI shows a success toast and, if needed, an "Over budget" warning.

### Data model

```
User         { name, email (unique), password (bcrypt hash), role: "user" | "admin", createdAt }
Transaction  { user → User, amount, type: "income" | "expense", category, date, description, file_url, status: "normal" | "high" }
Budget       { user → User, category, limit }   // unique per (user, category)
```

---

## Getting started

### Prerequisites
- Node.js 20+
- MongoDB, either local (`mongodb://localhost:27017`) or a free MongoDB Atlas cluster

### 1. Start the API

```bash
cd server
cp .env.example .env      # then edit: MONGO_URI and a long random JWT_SECRET
npm install
npm run dev               # → http://localhost:5000  (health check: /api/health)
```

### 2. Start the frontend

```bash
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm install
npm run dev               # → http://localhost:8080
```

Open http://localhost:8080, create an account, and start adding transactions.

### Environment variables

| Variable | Where | Description |
| -------- | ----- | ----------- |
| `MONGO_URI` | server | MongoDB connection string. The path segment is the database name |
| `JWT_SECRET` | server | Secret used to sign session tokens (required) |
| `PORT` | server | API port (default `5000`) |
| `CLIENT_URL` | server | Allowed frontend origin(s), comma-separated (default `http://localhost:8080`) |
| `API_PUBLIC_URL` | server | Public base URL used in receipt links (defaults to the request host) |
| `NODE_ENV` | server | `production` enables `Secure` + `SameSite=None` cookies |
| `VITE_API_URL` | client | Base URL of the API |

### Scripts

| Location | Command | Purpose |
| -------- | ------- | ------- |
| server | `npm run dev` | API with hot reload |
| server | `npm run build` then `npm start` | Compile to `dist/` and run in production |
| server | `npm run typecheck` | Type-check without emitting |
| server | `npm run make-admin -- <email>` | Promote a user to admin from the CLI |
| client | `npm run dev` | Frontend dev server |
| client | `npm run build` | Production build |

---

## Admin access

Every new account is a regular `user`. The role is **read from the database on every request**, so a change takes effect immediately; the user just refreshes the page. There's no need to sign out or redeploy.

There are three ways to make someone an admin:

1. **MongoDB Compass / Atlas UI** (works in production): open the `users` collection, find the user, change `role` from `"user"` to `"admin"`, and save.
2. **CLI:** `cd server && npm run make-admin -- someone@example.com`
3. **From the app:** an existing admin opens **Admin → Users** and clicks **Make admin**.

Option 1 or 2 is how you create the very first admin; after that, admins can manage roles from the UI.

---

## Viewing the data in MongoDB Compass

The database name is the last part of your `MONGO_URI`:

| `MONGO_URI` | Database name |
| ----------- | ------------- |
| `mongodb://localhost:27017/fintrack` | `fintrack` |
| `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/fintrack?retryWrites=true` | `fintrack` |
| `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true` (no name) | `test` (MongoDB's default) |

Connect Compass with the same URI (without the database part, or with it), open that database, and you'll see three collections: **`users`**, **`transactions`** and **`budgets`**.

---

## API reference

All responses are JSON. Authenticated routes rely on the `token` HttpOnly cookie (send requests with `credentials: "include"`).

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | `/api/auth/signup` | public, rate-limited | Create an account `{ name, email, password }` |
| POST | `/api/auth/login` | public, rate-limited | Sign in `{ email, password }` |
| POST | `/api/auth/logout` | public | Clear the session cookie |
| GET | `/api/auth/me` | user | Current user and roles |
| PATCH | `/api/auth/profile` | user | Update `{ name }` |
| PATCH | `/api/auth/password` | user, rate-limited | Change password `{ currentPassword, newPassword }` |
| GET | `/api/transactions` | user | List your transactions |
| GET | `/api/transactions/:id` | owner | Get one transaction |
| POST | `/api/transactions` | user | Create (multipart: `amount, type, category, date, description, file?`) |
| PUT | `/api/transactions/:id` | owner | Update (same fields, plus optional `remove_file=true`) |
| DELETE | `/api/transactions/:id` | owner | Delete the transaction and its receipt |
| GET | `/api/budgets` | user | Your budgets with this month's spend |
| PUT | `/api/budgets` | user | Create or update `{ category, limit }` |
| DELETE | `/api/budgets/:id` | owner | Remove a budget |
| GET | `/uploads/:filename` | owner or admin | Download a receipt |
| GET | `/api/admin` | admin | All users and transactions |
| PATCH | `/api/admin/users/:id/role` | admin | Set `{ role: "user" \| "admin" }` |
| GET | `/api/health` | public | Health check |

Create and update responses include `budget_alert: { category, limit, spent } | null`.

---

## Security

| Threat | Mitigation |
| ------ | ---------- |
| Leaking password hashes | The Mongoose `toJSON` transform strips `password` from every response |
| NoSQL operator injection (`{"email": {"$ne": null}}`) | All credential and body fields must be strings before they reach a query |
| Brute-force login | `express-rate-limit`: 20 failed attempts per 15 min per IP on signup, login and password change |
| Account enumeration | The same "Invalid email or password" message for unknown users and wrong passwords |
| XSS stealing the session | The JWT lives in an **HttpOnly** cookie (not readable by JavaScript) |
| CSRF | `SameSite` cookie, plus an Origin allow-list check on every non-GET request |
| Stale privileges | The role is loaded from the DB on each request, so demoted or deleted users lose access instantly |
| Accessing others' data | Every query is scoped to `user: req.user.id`; admin routes require `role === "admin"` |
| Malicious or huge uploads | Images or PDF only, 5 MB max, random server-generated filenames, path-traversal checks |
| Public receipts | `/uploads` is an authenticated route that checks ownership |
| Misc. headers | `helmet` (HSTS, no-sniff, frame-guard, etc.); CORS limited to `CLIENT_URL` |
| Secrets in git | `.env` is git-ignored; `.env.example` documents the required keys |

---

## Engineering challenges & how they were solved

**1. Role changes didn't take effect until the user logged in again**
*Problem:* The role was stored inside the JWT, so promoting someone in the database did nothing for up to 7 days.
*Solution:* `verifyUser` now verifies the token for identity only and loads the **current role from MongoDB** on each request. A role edited in Compass applies on the next page load, and deleted users are locked out immediately.

**2. Password hashes were being returned by the API**
*Problem:* Signup and login responded with the raw Mongoose document, bcrypt hash included.
*Solution:* A schema-level `toJSON` transform removes `password` everywhere, so no future endpoint can leak it by accident.

**3. Login could be bypassed with a NoSQL injection**
*Problem:* `User.findOne({ email })` with `email = {"$ne": null}` matched the first user.
*Solution:* Strict `typeof === "string"` validation on all auth inputs before querying.

**4. Receipts were publicly downloadable**
*Problem:* `/uploads` was served by `express.static`, so anyone with the URL could view someone's financial documents.
*Solution:* Uploads go through an authenticated route that looks up the owning transaction and only serves the file to its owner or an admin. Filenames are random, and files are deleted when their transaction is deleted or the receipt is replaced.

**5. The "to" date filter skipped the last day**
*Problem:* Comparing `"2026-10-25T00:00:00.000Z" > "2026-10-25"` as strings excluded transactions on the end date.
*Solution:* Compare only the `YYYY-MM-DD` part.

**6. Budget alerts needed to be instant without adding complexity**
*Problem:* Users want to know *when* they overspend, but a websocket/notification system would be overkill.
*Solution:* After saving an expense, the API runs a single MongoDB aggregation for that month and category and returns `budget_alert` in the same response. That gives an instant warning with no extra request and no background jobs.

**7. Edit and create forms drifting apart**
*Problem:* Duplicated form code tends to diverge.
*Solution:* One shared `TransactionForm` component powers both the *New* and *Edit* pages, and one shared server-side validator powers both the create and update endpoints.

---

## Project structure

```
fintrack-cloud/
├── client/                         # React + TanStack Start frontend
│   └── src/
│       ├── routes/                 # File-based routes
│       │   ├── index.tsx           #   Landing page
│       │   ├── auth.tsx            #   Sign in / sign up
│       │   ├── dashboard.tsx       #   Stats, trend, category breakdown, budgets
│       │   ├── transactions.index.tsx      # List, filter, sort, export
│       │   ├── transactions.new.tsx        # Create
│       │   ├── transactions.$id.edit.tsx   # Edit
│       │   ├── budgets.tsx         #   Monthly budgets
│       │   ├── profile.tsx         #   Name and password
│       │   └── admin.tsx           #   Admin console
│       ├── components/             # AppShell, TransactionForm, BudgetBar, shadcn/ui
│       └── lib/                    # auth context, API URL, constants, toasts
└── server/                         # Express API
    └── src/
        ├── config/                 # env + MongoDB connection
        ├── controllers/            # auth, transaction, budget, admin
        ├── middleware/             # verifyUser, isAdmin, uploads
        ├── models/                 # User, Transaction, Budget
        ├── routes/                 # REST routes + protected /uploads
        └── scripts/make-admin.ts   # CLI to promote a user
```

---

## Deployment notes

- **API** (Render, Railway, Fly.io or a VPS): set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=https://your-frontend.app` and `API_PUBLIC_URL=https://your-api.app`. HTTPS is required because cookies are `Secure; SameSite=None`.
- **Frontend** (Cloudflare, Vercel or Netlify): set `VITE_API_URL=https://your-api.app` at build time.
- **Receipts** are stored on the API server's disk (`server/uploads`). On hosts with ephemeral filesystems, attach a persistent volume or move to object storage (see the roadmap).

---

## Roadmap

- [ ] Object storage for receipts (S3 / Cloudflare R2)
- [ ] Recurring transactions (rent, salary)
- [ ] Multi-currency support
- [ ] Email notifications for budget overruns and high-value activity
- [ ] Automated test suite in CI (API integration tests)
- [ ] Mobile navigation menu

---

## License

MIT. Free to use for learning and as a portfolio reference.
