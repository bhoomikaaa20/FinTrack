# FinTrack Cloud

**A personal finance tracker that helps you see where your money goes, stay within your monthly budgets, and keep every receipt in one place.**

FinTrack Cloud is a full-stack web app for managing your own money. You log your income and expenses, attach receipts, set a spending limit for each category, and the dashboard shows how you're doing this month and over the last six months.

Built end-to-end in **TypeScript**: React 19 + TanStack Start on the frontend, Node.js + Express 5 + MongoDB on the backend.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Table of contents

- [Why I built this](#why-i-built-this)
- [What it does](#what-it-does)
- [How you use it](#how-you-use-it)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Viewing your data in MongoDB Compass](#viewing-your-data-in-mongodb-compass)
- [Admin access](#admin-access)
- [API reference](#api-reference)
- [Security & privacy](#security--privacy)
- [Challenges & how I solved them](#challenges--how-i-solved-them)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)

---

## Why I built this

Keeping track of personal spending is harder than it should be:

- **You only notice overspending after it's happened.** Bank statements tell you at the end of the month that you spent too much on food, when it's too late to change anything.
- **Receipts get lost.** They end up in your inbox, your camera roll or a drawer, separate from the payments they belong to.
- **Spreadsheets take effort.** You have to build your own formulas and charts, and they don't warn you about anything.
- **Unusual payments blend in.** One very large payment looks the same as a coffee in a long list.

## What it does

| The problem | How FinTrack Cloud helps |
| ----------- | ------------------------ |
| Not knowing where your money goes | A dashboard showing total income, expenses and balance, a 6-month income vs expenses chart, and a breakdown of spending by category |
| Overspending without noticing | Set a **monthly budget per category** (e.g. Food: $400). Progress bars show how much you've used, and you get an **instant warning** the moment an expense takes you over the limit |
| Lost receipts | Attach a photo or PDF receipt to any transaction. Receipts are private to your account |
| Large payments slipping by | Any transaction over **$50,000** is automatically flagged **HIGH** so it stands out |
| Finding old transactions | Search by category or note, filter by type, status and date range, and sort by date or amount |
| Getting data out | Export your filtered transactions to **CSV** for taxes, a spreadsheet or your accountant |

### Feature list

- **Account:** sign up, sign in, update your name, change your password
- **Transactions:** add, **edit** and delete income or expenses, with amount, category, date, note and an optional receipt
- **Receipts:** upload, replace or remove an image or PDF (up to 5 MB) on any transaction
- **Dashboard:** income, expenses, balance, transaction count, 6-month trend, spending by category, budget progress
- **Budgets:** one monthly limit per expense category; green → amber (80% used) → red (over budget)
- **Budget alerts:** a warning appears as soon as a new or edited expense pushes a category over its limit
- **High-value flag:** transactions over $50,000 are marked **HIGH**, and the flag updates if you edit the amount
- **Search, filter, sort and CSV export** on the transactions page
- **Admin panel** for whoever runs the app: number of users and transactions, and promoting or removing other admins

---

## How you use it

1. **Create an account** and sign in.
2. **Add your transactions**: your salary as income, and rent, groceries and so on as expenses. Attach a receipt if you have one.
3. **Set budgets** for the categories you want to keep an eye on, such as Food, Transport or Entertainment.
4. **Check the dashboard** to see your balance, your monthly trend, where most of your money goes, and how close you are to each budget.
5. **Edit or delete** anything you entered wrongly; totals and budgets update automatically.
6. **Export to CSV** whenever you need your records outside the app.

---

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, TanStack Start / Router (file-based routing), Tailwind CSS v4, shadcn/ui (Radix), Sonner toasts, Lucide icons, Vite 7 |
| Backend  | Node.js, Express 5, TypeScript, Mongoose 9 |
| Database | MongoDB |
| Auth     | JWT in an HttpOnly cookie, bcrypt password hashing, user / admin roles |
| Uploads  | Multer (file type and size checks) |
| Security | helmet, express-rate-limit, CORS allow-list, CSRF origin check |

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI["React app<br/>Dashboard · Transactions · Budgets · Profile"]
    end

    subgraph API["Express API"]
        MW["Security middleware<br/>helmet · CORS · CSRF check · rate limit"]
        AUTH["verifyUser<br/>(session cookie + role from DB)"]
        CTRL["Controllers<br/>auth · transactions · budgets · admin"]
        UP["Receipt uploads<br/>(image / PDF, 5 MB)"]
    end

    DB[(MongoDB<br/>users · transactions · budgets)]
    FS[[uploads/<br/>private receipts]]

    UI -- "HTTPS + HttpOnly cookie" --> MW --> AUTH --> CTRL
    CTRL --> DB
    CTRL --> UP --> FS
```

**What happens when you add an expense**

1. You fill in the form and press **Save**; the browser sends the data and receipt along with your session cookie.
2. The API checks who you are and validates every field.
3. The receipt is saved under a random, unguessable filename.
4. The transaction is saved and flagged **HIGH** if it's over $50,000.
5. The API adds up what you've spent in that category this month. If that's over your budget, the response includes a `budget_alert`.
6. The app shows "Transaction saved" and, if needed, an "Over budget" warning.

### Data model

```
User         { name, email, password (hashed), role: "user" | "admin", createdAt }
Transaction  { user, amount, type: "income" | "expense", category, date, description, file_url, status: "normal" | "high" }
Budget       { user, category, limit }   // one per category per user, applies every month
```

Every transaction and budget belongs to one user, and users can only ever see their own data.

---

## Getting started

### Prerequisites
- Node.js 20+
- MongoDB, either installed locally or a free MongoDB Atlas cluster

### 1. Start the API

```bash
cd server
cp .env.example .env      # set MONGO_URI and a long random JWT_SECRET
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

Open http://localhost:8080, create an account and add your first transaction.

### Environment variables

| Variable | Where | Description |
| -------- | ----- | ----------- |
| `MONGO_URI` | server | MongoDB connection string; the last part of the path is the database name |
| `JWT_SECRET` | server | Secret used to sign login sessions (required) |
| `PORT` | server | API port (default `5000`) |
| `CLIENT_URL` | server | Frontend address(es) allowed to call the API (default `http://localhost:8080`) |
| `API_PUBLIC_URL` | server | Public API address used in receipt links (defaults to the request host) |
| `NODE_ENV` | server | `production` turns on secure cookies for HTTPS |
| `VITE_API_URL` | client | Address of the API |

### Scripts

| Location | Command | Purpose |
| -------- | ------- | ------- |
| server | `npm run dev` | Run the API with hot reload |
| server | `npm run build` then `npm start` | Build and run in production |
| server | `npm run typecheck` | Check types |
| server | `npm run make-admin -- <email>` | Give an account admin access |
| client | `npm run dev` | Run the frontend |
| client | `npm run build` | Production build |

---

## Viewing your data in MongoDB Compass

The database name is the last part of your `MONGO_URI`:

| `MONGO_URI` | Database name |
| ----------- | ------------- |
| `mongodb://localhost:27017/fintrack` | `fintrack` |
| `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/fintrack?retryWrites=true` | `fintrack` |
| `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true` | `test` (MongoDB's default) |

Connect Compass with the same URI and open that database. Your data is in the **`users`**, **`transactions`** and **`budgets`** collections.

---

## Admin access

FinTrack Cloud is a personal tracker: every account only sees its own money. The **admin role** is for whoever runs the app, so they can see how many people use it and spot flagged high-value activity.

New accounts are always regular users. The app reads the role from the database on every request, so a change takes effect as soon as the user refreshes the page. There are three ways to make someone an admin:

1. **MongoDB Compass / Atlas** (works in production): in the `users` collection, change the account's `role` from `"user"` to `"admin"`.
2. **Command line:** `cd server && npm run make-admin -- you@example.com`
3. **In the app:** an existing admin opens **Admin → Users** and clicks **Make admin**.

Use option 1 or 2 to create the first admin.

---

## API reference

All responses are JSON. Logged-in routes use the `token` HttpOnly cookie (send requests with `credentials: "include"`).

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | `/api/auth/signup` | public | Create an account `{ name, email, password }` |
| POST | `/api/auth/login` | public | Sign in `{ email, password }` |
| POST | `/api/auth/logout` | public | Sign out |
| GET | `/api/auth/me` | signed in | Current user |
| PATCH | `/api/auth/profile` | signed in | Update `{ name }` |
| PATCH | `/api/auth/password` | signed in | Change password `{ currentPassword, newPassword }` |
| GET | `/api/transactions` | signed in | List your transactions |
| GET | `/api/transactions/:id` | owner | Get one transaction |
| POST | `/api/transactions` | signed in | Add a transaction (multipart: `amount, type, category, date, description, file?`) |
| PUT | `/api/transactions/:id` | owner | Edit (same fields, plus optional `remove_file=true`) |
| DELETE | `/api/transactions/:id` | owner | Delete the transaction and its receipt |
| GET | `/api/budgets` | signed in | Your budgets with this month's spending |
| PUT | `/api/budgets` | signed in | Create or update `{ category, limit }` |
| DELETE | `/api/budgets/:id` | owner | Remove a budget |
| GET | `/uploads/:filename` | owner or admin | View a receipt |
| GET | `/api/admin` | admin | All users and transactions |
| PATCH | `/api/admin/users/:id/role` | admin | Set `{ role: "user" \| "admin" }` |
| GET | `/api/health` | public | Health check |

Adding or editing a transaction returns `budget_alert: { category, limit, spent }` when the expense takes that category over budget, otherwise `null`.

---

## Security & privacy

Financial data is sensitive, so the app protects it by default:

| Risk | Protection |
| ---- | ---------- |
| Someone seeing your transactions | Every query is limited to your own account; other users get "not found" |
| Someone opening your receipts | Receipts are only served to their owner (or an admin), and filenames are random |
| Stolen passwords | Passwords are hashed with bcrypt and the hash is never sent back by the API |
| Password guessing | Sign-in, sign-up and password change are rate-limited (20 failed attempts per 15 minutes) |
| Finding out who has an account | Sign-in shows the same "Invalid email or password" message either way |
| Login bypass via NoSQL injection | All login fields must be plain text before reaching the database |
| Session theft through scripts (XSS) | The session lives in an HttpOnly cookie that JavaScript can't read |
| Requests forged by other sites (CSRF) | SameSite cookies plus an allow-list check on the request's origin |
| Unsafe uploads | Images and PDFs only, 5 MB max |
| Access lingering after a change | Roles are checked against the database on every request, so a removed or deleted account loses access straight away |
| Leaked secrets | `.env` files are git-ignored; `.env.example` lists what's needed |

---

## Challenges & how I solved them

**1. Budget warnings needed to be instant without adding complexity**
*Problem:* A warning is only useful when it appears while you're adding the expense, but notification systems and background jobs would add a lot of moving parts.
*Solution:* After saving an expense, the API runs one MongoDB aggregation for that category and month and returns the result in the same response, so the warning appears straight away with no extra request.

**2. Password hashes were included in API responses**
*Problem:* Sign-up and sign-in returned the full user record, hash included.
*Solution:* The User model strips the password from every JSON response, so no endpoint can leak it, now or in future.

**3. It was possible to sign in without a password**
*Problem:* Sending `{"email": {"$ne": null}}` turned the login lookup into "match any user".
*Solution:* All login fields are checked to be plain strings before they're used in a query.

**4. Receipts were publicly viewable**
*Problem:* Anyone with a receipt's link could open it.
*Solution:* Receipts go through a signed-in route that checks the file belongs to you. Filenames are random, and files are deleted when you delete the transaction or replace the receipt.

**5. The date filter left out the last day**
*Problem:* Comparing full timestamps with plain dates as text dropped transactions on the "to" date.
*Solution:* Only the date part (`YYYY-MM-DD`) is compared, so both ends of the range are included.

**6. Role changes didn't apply until the user signed in again**
*Problem:* The role was stored inside the login token, so changing it in the database did nothing for up to 7 days.
*Solution:* The role is loaded from the database on each request, so a change applies as soon as the page is refreshed.

**7. Keeping the add and edit forms consistent**
*Problem:* Two copies of the same form tend to drift apart.
*Solution:* One shared `TransactionForm` component powers both pages, and one shared validator checks both the create and update requests on the server.

---

## Project structure

```
fintrack-cloud/
├── client/                              # React frontend
│   └── src/
│       ├── routes/                      # One file per page
│       │   ├── index.tsx                #   Landing page
│       │   ├── auth.tsx                 #   Sign in / sign up
│       │   ├── dashboard.tsx            #   Overview, trend, categories, budgets
│       │   ├── transactions.index.tsx   #   List, search, filter, sort, export
│       │   ├── transactions.new.tsx     #   Add a transaction
│       │   ├── transactions.$id.edit.tsx#   Edit a transaction
│       │   ├── budgets.tsx              #   Monthly budgets
│       │   ├── profile.tsx              #   Name and password
│       │   └── admin.tsx                #   Admin panel
│       ├── components/                  # AppShell, TransactionForm, BudgetBar, UI kit
│       └── lib/                         # Auth context, API URL, constants, toasts
└── server/                              # Express API
    └── src/
        ├── config/                      # Environment + database connection
        ├── controllers/                 # auth, transactions, budgets, admin
        ├── middleware/                  # Login check, admin check, uploads
        ├── models/                      # User, Transaction, Budget
        ├── routes/                      # API routes + private receipts
        └── scripts/make-admin.ts        # Give an account admin access
```

---

## Deployment notes

- **API** (Render, Railway, Fly.io or a VPS): set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=https://your-frontend.app` and `API_PUBLIC_URL=https://your-api.app`. HTTPS is required.
- **Frontend** (Cloudflare, Vercel or Netlify): set `VITE_API_URL=https://your-api.app` when building.
- **Receipts** are stored on the API server's disk (`server/uploads`). On hosts that wipe the disk on redeploy, attach persistent storage or move receipts to S3 / Cloudflare R2.

---

## Roadmap

**In progress:** the server side of these is written, but they have no screens yet.
- [ ] **Recurring transactions:** log rent, salary or subscriptions automatically every week or month
- [ ] **Savings goals:** set a target (e.g. "Holiday – $2,000"), add money over time and track progress

**Planned**
- [ ] Monthly insights: this month vs last month, savings rate, top spending category
- [ ] Multi-currency support
- [ ] Email alerts when you go over budget
- [ ] Receipts in cloud storage (S3 / R2)
- [ ] Mobile navigation menu
- [ ] Automated tests in CI

---

## License

MIT
