# SENTINEL — Global Volunteer Coordination Platform

A production-ready frontend-only SaaS platform for coordinating volunteer responders in emergency situations. Built with React + Vite + Supabase.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5 |
| Database / Auth / Realtime | Supabase (free tier) |
| Maps | Leaflet.js + React-Leaflet + OpenStreetMap |
| Routing | React Router DOM v6 |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Dates | date-fns |
| Styling | Tailwind CSS (CDN) |
| Hosting | Vercel (free tier) |

**No paid APIs. Only 2 env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.**

---

## Microservice Architecture

| Module | File | Tables |
|---|---|---|
| MS-01 Volunteer Service | `src/services/volunteerService.js` | `volunteers` |
| MS-02 Task Service | `src/services/taskService.js` | `tasks` |
| MS-03 Location Service | `src/services/locationService.js` | `locations` |
| MS-04 Notification Service | `src/services/notificationService.js` | `notifications`, `broadcasts` |
| MS-05 Admin Service | `src/services/adminService.js` | `admin_logs` |
| MS-06 API Gateway | `src/services/gateway.js` | (cross-cutting) |

All service calls pass through `gateway.js` which handles:
- Session validation on every request
- Role-based access control (admin vs volunteer)
- In-memory rate limiting (60 req/min per session)
- Automatic audit logging to `admin_logs`

---

## Step-by-Step Setup Guide

### Phase 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → click **"Start your project"** → sign up free with GitHub (no credit card needed)

2. Click **"New Project"** → enter a project name → set a strong password → choose the free region closest to you → click **Create**

3. Wait ~2 minutes for the project to initialize

4. Go to **Settings → API** → copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT string)
   - Paste them somewhere safe — you'll need them shortly

5. Go to **SQL Editor** → click **"New Query"** → paste the entire contents of `SCHEMA.sql` → click **Run**

6. Verify under **Table Editor** that all 6 tables appear:
   - `volunteers`, `tasks`, `locations`, `notifications`, `broadcasts`, `admin_logs`

7. Go to **Authentication → Settings** → under **Email provider** → **disable "Confirm email"** (makes development easier; re-enable for production)

8. Go to **Database → Replication** → scroll to **Tables** → enable realtime for the `notifications` table (for instant in-app alerts)

---

### Phase 2 — Local Development Setup

1. Install **Node.js v18+** from [nodejs.org](https://nodejs.org) if not already installed
   ```
   node -v   # should show v18.x or higher
   ```

2. Install **VS Code** from [code.visualstudio.com](https://code.visualstudio.com) if not installed

3. Unzip this project folder and open it in VS Code

4. Open Terminal (`Ctrl + `` ` ``)

5. Install dependencies:
   ```bash
   npm install
   ```

6. Create `.env.local` in the project root:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   Replace with your actual values from Step 4 above.

7. Start the dev server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:5173](http://localhost:5173) — the app should load.

---

### Phase 3 — Test Everything Locally

1. **Register a volunteer account** — go to `/register`, fill in name/email/password

2. **Update your profile** — go to Profile, select skills, set availability to Active

3. **Test the Map** — go to Map page, click "Share My Location", allow browser location access, verify your marker appears

4. **Create an admin account** — register a second account, then:
   - Go to **Supabase → Table Editor → volunteers**
   - Find your user row → click Edit → change `role` from `volunteer` to `admin` → Save

5. **Log in as admin** → verify the Admin section appears in the sidebar

6. **Create a task** — go to Admin → Manage Tasks → New Task → fill in title, location, lat/lng, priority, required skills

7. **Auto-match volunteers** — click the 👤 icon on a task → see matched volunteers → click Assign

8. **Check notification bell** — the assigned volunteer should see a notification. Click the bell → verify it appears

9. **Send emergency broadcast** — go to Admin HQ → Emergency Broadcast → type message → Send. All volunteers receive a 🚨 notification instantly via Supabase Realtime.

10. **Export CSV** — go to Admin → Manage Tasks or Volunteers → click "Export CSV"

---

### Phase 4 — Push to GitHub

1. Go to [github.com](https://github.com) → sign in → click **New Repository**

2. Name it `volunteer-platform` → set to **Public** → **do NOT initialize with README** → click Create

3. In VS Code terminal:
   ```bash
   git init
   git add .
   git commit -m "initial commit: SENTINEL volunteer coordination platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/volunteer-platform.git
   git push -u origin main
   ```

4. Refresh GitHub — verify all files uploaded. **Verify `.env.local` is NOT there** (the `.gitignore` protects it).

---

### Phase 5 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub** (free)

2. Click **"Add New Project"** → click **"Import"** next to your `volunteer-platform` repo

3. Framework preset will auto-detect as **Vite** ✓

4. Under **Environment Variables** → add both:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

5. Click **Deploy** → wait ~2 minutes → copy your live `.vercel.app` URL

6. Go back to **Supabase → Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel URL (e.g. `https://volunteer-platform.vercel.app`)
   - Under **Redirect URLs** add: `https://your-app.vercel.app/**`

7. Test your live URL in the browser — full app should work exactly like local

8. Every future `git push` to `main` will **auto-deploy** to Vercel

---

## Making Someone an Admin

After a user registers, go to:
- Supabase → Table Editor → `volunteers`
- Find their row → click Edit
- Change `role` from `volunteer` to `admin`
- Click Save

They will have admin access on their next page load.

---

## Features

### Volunteer Portal
- Register / Login with Supabase Auth
- Profile management with skill selection (10 skill types)
- Availability toggle (Active / Inactive)
- View and manage assigned tasks
- Accept or reject task assignments
- Mark tasks as completed
- Live map showing all active volunteers (OpenStreetMap, no API key)
- Real-time in-app notifications via Supabase Realtime
- GPS location sharing every 30 seconds

### Admin Panel
- Live dashboard with volunteer/task statistics
- Create tasks with location, priority, required skills
- Auto-match volunteers by skill overlap + GPS proximity
- Override any task assignment
- Send emergency broadcasts to all volunteers
- Command map showing all volunteer locations in real-time
- CSV export for volunteers and tasks
- Full audit log of all platform actions

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

These are the only two variables needed. No other API keys required.

---

## Project Structure

```
volunteer-platform/
├── src/
│   ├── supabaseClient.js       # Supabase client init
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Router + layout
│   ├── index.css               # Global styles
│   ├── services/
│   │   ├── gateway.js          # MS-06: API Gateway (auth, rate limit, logging)
│   │   ├── volunteerService.js # MS-01: Auth, profiles, availability
│   │   ├── taskService.js      # MS-02: CRUD, auto-match
│   │   ├── locationService.js  # MS-03: GPS tracking, map data
│   │   ├── notificationService.js # MS-04: Realtime alerts, broadcasts
│   │   └── adminService.js     # MS-05: Stats, logs, role management
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state, volunteer profile
│   ├── components/
│   │   ├── Navbar.jsx          # Sidebar + mobile drawer
│   │   ├── ProtectedRoute.jsx  # Auth + admin guards
│   │   ├── NotificationBell.jsx # Realtime bell with badge
│   │   └── LoadingSpinner.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Tasks.jsx
│   │   ├── TaskDetail.jsx
│   │   ├── Map.jsx
│   │   ├── Notifications.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminTasks.jsx
│   │       ├── AdminVolunteers.jsx
│   │       └── AdminMap.jsx
│   └── utils/
│       ├── distance.js         # Haversine formula
│       └── csvExport.js        # CSV download utility
├── SCHEMA.sql                  # Complete Supabase SQL schema
├── .env.example                # Template for .env.local
├── .gitignore
├── vercel.json                 # SPA routing config
├── vite.config.js
└── package.json
```
