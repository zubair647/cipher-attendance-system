# CipherSchools — Mentor Attendance & Teaching Hours Tracker

A working local prototype of Module 1 (of 13–14) from the CipherSchools ops
automation roadmap: mentor check-in/check-out with photo capture, leave
marking, and an admin dashboard for accounts, timetables, attendance
correction, and hours reporting.

Built from `Mentor_Attendance_System_PRD.md` and the `design_handoff_cipher_attendance`
design files. Two apps, one shared local database:

- **Mentor app** — phone-first PWA. Runs at **http://localhost:3000**
- **Admin app** — desktop dashboard. Runs at **http://localhost:3001**

Both read and write the same file: `shared-data/db.json`. There is no real
database, no real authentication security, and no cloud hosting — this is
explicitly a disposable, local-only prototype, per the PRD.

---

## 1. One-time setup (do this once)

**Step 1 — Install Node.js**, if you haven't already:

1. Go to **https://nodejs.org**
2. Click the big green **LTS** download button (it downloads a `.pkg` file)
3. Double-click the downloaded file and click Continue/Install like any normal Mac app
4. Once it finishes, you're done — no need to open Terminal for this part

**Step 2 — Install this project's dependencies.** Open Terminal, then run:

```bash
cd /Users/zubair/Claude/cipher-attendance-system
npm install
```

This downloads everything the app needs. It only takes a minute, and you only
need to do this once (or again later if you delete the `node_modules` folders).

---

## 2. Running it (do this every time)

From the project folder, run:

```bash
cd /Users/zubair/Claude/cipher-attendance-system
npm run dev
```

This does three things automatically:
1. Creates demo data the first time (6 mentors, 2 universities, ~6 weeks of attendance history) — it will **not** overwrite your data on later runs
2. Starts the Mentor app on port 3000
3. Starts the Admin app on port 3001

Leave that Terminal window open while you use the app. When you're done, click
into that Terminal window and press **Ctrl+C** to stop both servers.

Then open in your browser:

- **Mentor app:** http://localhost:3000
- **Admin app:** http://localhost:3001

### Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cipherschools.com` | `admin123` |
| Mentor (any of the 6 seeded mentors) | `aditi.sharma@cipherschools.com` | `mentor123` |

All 6 mentor emails are in `packages/shared/seed.js` if you want the others
(same password for all: `mentor123`).

### About the camera

Check-in/check-out needs your browser's camera permission — your Mac will ask
the first time. It only works over `localhost` (which is what you're using)
or a real HTTPS site, not a plain network IP. If you deny/lose camera access,
the app shows the designed "Camera access is blocked" screen with a **Try
again** button.

### Starting fresh (wiping demo data)

```bash
npm run seed -- --force
```

This resets `shared-data/db.json` back to the original demo data. There's no
undo — only do this if you're OK losing anything you've added.

---

## 3. What's actually implemented

**Mentor app:** login, home/today's status, check-in (camera → preview →
confirm), check-out, mark leave (once-per-day, blocked after check-in),
week strip, month/lifetime hours, camera-denied error screen.

**Admin dashboard:** login, overview (summary cards, daily hours chart,
flagged/needs-attention list), mentor accounts (add, search/filter, reset
password, activate/deactivate), timetables (versioned, never overwritten,
Mon–Fri class counts, optional reference file name), attendance log (filters,
photo preview, CSV export, manual correction of check-in/check-out), reports
(lifetime total, per-month totals, weekly trend with line/bar toggle).

### Decisions made on your behalf (documented as open items in the PRD)

The design files had already resolved these, so the build follows the design:

- **Login identifier is email**, not name.
- **Mentors have an Active/Inactive toggle.** Deactivating blocks login but
  keeps their historical data in reports (their past hours shouldn't
  disappear from a month that already happened).
- **Admin can correct both a missed check-in and a missed check-out**, not
  just check-out.
- **Hours are always computed from the mentor's timetable** (class count ×
  50 minutes for that day), never from the raw check-in-to-check-out clock
  duration — this matches the PRD's Section 5 calculation, which is the
  documented source of truth, and keeps the Attendance Log and the Reports
  rollups always in agreement with each other.

If any of these should go the other way, they're small, isolated changes —
say so and they're quick to flip.

### Known limitations (matches PRD Section 8 — by design, not bugs)

- Data lives in one JSON file (`shared-data/db.json`) — not a real database.
  Delete it (or run `npm run seed -- --force`) and it's gone.
- Passwords are stored in plain text. Fine for a local demo, not for anything
  real.
- Single admin only — no login history, no audit trail beyond "corrected by"
  on attendance edits.
- No timezone handling — uses your Mac's local clock.
- No liveness/anti-spoofing check on the camera capture.
- Two Node processes both write to the same file. Fine for one person
  clicking around; not built for simultaneous multi-admin editing.

---

## 4. Project layout

```
cipher-attendance-system/
├── shared-data/db.json        ← the entire "database" — one JSON file
├── packages/shared/           ← code shared by both apps (hours math, DB
│                                 read/write, design tokens)
├── mentor-app/                 ← Next.js app, port 3000
└── admin-app/                  ← Next.js app, port 3001
```

Each app is an independent Next.js project (its own `package.json`, its own
API routes) wired together with npm workspaces so `npm install` and
`npm run dev` at the root handle both at once. You can also run just one:

```bash
npm run dev:mentor   # only the mentor app, port 3000
npm run dev:admin    # only the admin app, port 3001
```
