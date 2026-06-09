# BOSS – Actions Tracker

Internal operations platform built on the **BOSS → Actions** Airtable table. Full bidirectional sync: every create, edit, and delete from the web app writes directly to Airtable and reflects instantly.

## Architecture

```
Browser (Next.js 15)
    ↕ REST API
PostgreSQL (local mirror, fast reads)
    ↕ Bidirectional Sync Service
Airtable BOSS → Actions (source of truth)
```

**Every write goes Airtable-first.** Creating an action? It hits the Airtable API, gets an Airtable record ID, then mirrors into the local DB. Editing status? Same — patches Airtable, then updates local. The pull sync (`POST /api/sync`) is a reconciliation tool, not the primary data path.

## Features

- **Actions Table View** — sortable, filterable, searchable across all 2,248+ records
- **Kanban Board** — drag to change status (NOW → Priority → Queue → …)
- **Action Drawer** — full edit panel: title, status, type, due date, WBS, context tags, brief, business terms, place/period of performance, comments, activity log
- **Dashboard** — KPI cards, status pie chart, type bar chart, recent activity feed
- **Team View** — workload per member, overdue counts
- **Projects View** — Folio-based project tracking with progress bars
- **Reports** — monthly creation chart, status/type distributions, CSV export
- **Sync Page** — manual trigger, sync history, architecture diagram

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, TanStack Query |
| UI | Radix UI primitives, Framer Motion, Lucide Icons, Recharts |
| Backend | Next.js Route Handlers (Server) |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Airtable | Official `airtable` npm package — bidirectional |
| Auth | Better Auth |
| Deploy | Railway |

## Setup

### 1. Clone & install
```bash
git clone https://github.com/anthonyrunbusinessrun/actionstracker
cd actionstracker
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
# Fill in:
# DATABASE_URL — your PostgreSQL connection string
# AIRTABLE_API_KEY — your Airtable Personal Access Token
# BETTER_AUTH_SECRET — random 32-char string (openssl rand -base64 32)
# NEXT_PUBLIC_APP_URL — your domain (https://... or http://localhost:3000)
```

### 3. Database setup
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Initial sync
Start the dev server and hit the Sync page, or:
```bash
curl -X POST http://localhost:3000/api/sync
```
This pulls all 2,248+ actions from your BOSS Airtable into the local DB.

### 5. Dev server
```bash
npm run dev
# → http://localhost:3000  (redirects to /dashboard)
```

## Railway Deployment

1. Push this repo to GitHub
2. Create new Railway project → "Deploy from GitHub repo"
3. Add a PostgreSQL service to the project
4. Set environment variables in Railway dashboard:
   - `DATABASE_URL` — copy from Railway PostgreSQL service
   - `AIRTABLE_API_KEY` — your PAT from airtable.com/account
   - `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` — your Railway domain (https://actionstracker-production.up.railway.app)
5. Set build command: `npm run build`
6. Set start command: `npm start`
7. Add a pre-deploy command in `railway.toml`: `npx prisma generate && npx prisma migrate deploy`

### railway.toml (already included)
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
```

## Airtable Field Map

| Field | Airtable ID | Type | Writable |
|-------|-------------|------|----------|
| Code | fldZC7jJD4mOucCoe | Formula | ✗ |
| Task Title | fldpYdXBBZuNcV75X | Text | ✓ |
| Status | fldWInQJwHjQXq7xc | Single Select | ✓ |
| Type | fldiyl75JVc9K4xkg | Single Select | ✓ |
| Accrue (Due) | fld0vMW0hc4QLFrdh | Date | ✓ |
| Brief | fld602VDqZGTQdDOI | Rich Text | ✓ |
| Start | fldczExYnHX1emjFk | DateTime | ✓ |
| End | fld1nVCrdPmzvru6L | DateTime | ✓ |
| WBS | fldi70zV66ZtSmUag | Text | ✓ |
| Stage | fldDmVJF0asFWDrrk | Text | ✓ |
| Context | fldZAqphRTMG7ohh8 | Multi-Select | ✓ |
| Business Terms | fldtA39f46McDL0MP | Rich Text | ✓ |
| Place of Perform | fldS4yQx5Kqb6ph9v | Text | ✓ |
| Period of Perform | fldh7mfvnGjh9QSRA | Text | ✓ |
| Sort | fldmi2RJKYTCrx9U2 | Number | ✓ |
| Folio | fldqnbxv4BJmjTIfv | Record Links | ✗ |
| Asn (Assignees) | fld1p5CjF0B7GZx9l | Record Links | ✗ |

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/actions` | List actions (filtered, paginated) |
| POST | `/api/actions` | Create action → writes to Airtable first |
| GET | `/api/actions/[id]` | Get single action with full details |
| PATCH | `/api/actions/[id]` | Update fields → writes to Airtable first |
| DELETE | `/api/actions/[id]` | Delete → removes from Airtable, soft-archives locally |
| POST | `/api/sync` | Pull-sync all records from Airtable |
| GET | `/api/sync` | Sync status & history |
| GET | `/api/dashboard` | Aggregated KPI stats |
| GET | `/api/team` | Team members with action counts |
| GET | `/api/projects` | Folios with linked actions |
