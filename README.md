# PayTrack — budget & spending tracker for the app project

A small mobile-first Next.js + MongoDB site so the team can see, on their phones:

- how much budget there is (default **₹5,22,000**)
- how much has been spent
- how much is left
- what the infrastructure costs every month, and how long the money lasts

Only the **admin** sets the budget. Everyone else logs and edits spending.

---

## 1. Run it on your laptop

You need Node.js 20+ (you have 24, that's fine).

```bash
npm install
```

**Terminal 1 — the database** (no MongoDB install needed, data is kept in `.localdb/`):

```bash
npm run db
```

**Terminal 2 — the site:**

```bash
npm run dev
```

Open http://localhost:3000.

`npm run dev` is the development server: it compiles each page the first time you open it, so
the very first click on a page takes a moment. The real speed is the production build:

```bash
npm run build
```

```bash
npm start
```

On this machine that serves the dashboard API in about **10 ms** and a full page in about
**100 ms**.

To empty the database (removes every account and entry, no undo):

```bash
npm run reset
```

`npm run seed` fills in throwaway demo data if you ever want it.

## 2. Accounts

**The admin (host)** is created once. On an empty database the login page turns into a
**setup** screen, and whoever registers there becomes the admin. You can also create it from
the command line:

```bash
npm run create-admin -- --name "Your Name" --email you@example.com --password "your password"
```

Run it again with the same email to reset that account's password.

**Everyone else signs themselves up** at `/signup` (there is a link on the login page). They
pick their name, email, role and password. The team has a fixed number of seats — **3 by
default including the admin** — and once the seats are gone the sign-up page says so. Change
that number in **Admin → Team size**, or free a seat by removing someone.

Sign-up can never create an admin: the role list has no admin option and the server rejects
it. The admin can also add members by hand, within the same seat limit.

## 3. Using a real MongoDB (Atlas)

`.env.local` holds the settings:

```
MONGODB_URI="mongodb://127.0.0.1:27017/paytrack"
AUTH_SECRET="a long random string"
# REDIS_URL="redis://127.0.0.1:6379"
```

There is a commented-out `mongodb+srv://…` line in that file (an Atlas cluster). To use Atlas
instead of the local database, comment the local line and uncomment that one — or paste a
different connection string.

`.env.local` is gitignored, so the password in it is not committed. If that Atlas cluster is
not yours, or you don't know where it came from, change its database-user password in Atlas.

## 4. Speed

- **Caching.** The dashboard totals and settings are cached. Set `REDIS_URL` and the cache
  lives in Redis (shared between servers); leave it unset and it uses an in-process cache, so
  nothing extra has to be installed. Every write clears the cache, so a number is never stale.
- **Indexes** on the fields the queries sort and filter by are created on first connection.
- **The screen updates before the server answers.** Adding, editing or deleting an entry
  changes the list immediately and rolls back if the server refuses.
- **Pages keep their data.** Moving between Home, Spending and Admin paints from cache and
  refreshes in the background instead of showing a spinner each time.

## 5. Who can do what

| Action                            | Admin | Everyone else          |
| --------------------------------- | ----- | ---------------------- |
| See the dashboard                 | ✅    | ✅                     |
| Add spending                      | ✅    | ✅                     |
| Edit or delete an entry           | any   | only their own entries |
| Set the budget and monthly cap    | ✅    | ❌                     |
| Set the team size                 | ✅    | ❌                     |
| Add / disable / remove members    | ✅    | ❌                     |
| Reset someone's password          | ✅    | ❌                     |
| Take and restore backups          | ✅    | ❌                     |
| Set each build stage's status and percent | ✅ | ❌ (view only)   |
| Add / remove subscription renewals | ✅   | ❌ (view only)         |
| Post / remove reminders           | ✅    | ❌ (view + dismiss)    |
| Open the Admin page at all        | ✅    | ❌ (redirected away)   |

The app will not let you delete or demote the last admin, so nobody can lock themselves out.

## 6. Backups

A backup is one document in the `backups` collection holding a copy of everything else —
accounts, settings and spending — so it lives inside the same database. If someone deletes the
wrong row or a bad edit goes in, the admin restores it from **Admin → Backups** without
touching MongoDB.

- One is taken **automatically**, at most once an hour, whenever data changes.
- **Back up now** takes one on demand.
- **Restore** puts a snapshot back — and backs up the current data first, so a restore is
  itself undoable.
- **Download** saves a snapshot as JSON (password hashes are stripped from the download).
- The newest 20 are kept.

## 7. How the numbers are worked out

- **Spent** = the sum of every spending row.
- **Remaining** = budget − spent. It turns red once it goes negative.
- **Monthly cost** = the sum of rows marked *Every month* — your monthly burn rate.
- **Monthly cap** = the limit set in Admin. The dashboard warns when the burn rate goes above it.
- **Runway** = remaining ÷ monthly cost, i.e. roughly how many months the money lasts.
- **This month** = everything dated in the current month.

A row marked *Every month* counts once in "spent" — it is one real charge on one date. Log
next month's charge as a new row. That way "spent" always matches what actually left the
account, and the run rate still tells you what a month costs.

## 8. Putting it online

1. Create a free MongoDB Atlas cluster and copy its connection string.
2. Push this folder to GitHub and import it on Vercel (or run `npm run build && npm start` on
   any Node host).
3. Set the environment variables there: `MONGODB_URI`, `AUTH_SECRET` (a long random string —
   do not reuse the local one), and `REDIS_URL` if you have Redis.
4. Open the site and create the admin account on the setup screen.

## 9. What's inside

```
src/app/(app)/layout.tsx  the signed-in chrome (header + bottom tab bar) — shared by every
                           page below so it stays mounted across navigation instead of
                           remounting on every click
src/app/(app)/dashboard   budget vs spent vs remaining, charts, recent activity
src/app/(app)/expenses    log and manage spending
src/app/(app)/admin       budget, team, backups, build-stage status, subscription reminders
src/app/(app)/progress    the "Status" tab — build stages and progress, view-only
src/app/(app)/settings    appearance and account
src/app/login, /signup    sign in, and members creating their own account
src/app/api/…             JSON API — every route checks the session and the role
src/components/ui         shadcn/ui components (button, card, dialog, select, table…)
src/components/subscription-banner.tsx   the dismissible renewal reminder
src/components/reminder-banner.tsx       the dismissible admin notice
src/components/stage-celebration.tsx     the "stage complete" pop-up
src/lib/data.ts           all the budget maths
src/lib/cache.ts          Redis-or-memory cache
src/lib/backup.ts         snapshots and restore
scripts/local-db.mjs      local MongoDB for development
scripts/create-admin.mjs  make or reset the admin account
scripts/reset.mjs         empty the database
scripts/seed.mjs          optional throwaway demo data
```

## 10. Build status, reminders and renewals

The **Status** tab shows the twelve build stages of the app (Architecture and setup through
Games), each with a status (Not started / In progress / In review / Complete / Blocked) and a
0-100% figure — both set by hand from **Admin → Project status**. Changing the status alone
fills in that status's usual percentage (0 / 50 / 80 / 100 / 35); the percent field can then be
fine-tuned on its own any time. Everyone else only ever views the page — tapping a stage
expands what it actually covers. The overall percentage is the average of every stage, unless
the admin pins it to a specific figure in **Admin → Budget → Overall completion override**.

The moment a stage is marked Complete, everyone gets a celebration — a pop-up with confetti
naming the stage — the next time their browser notices. It's tracked per browser and shown
once per stage, and a stage that was already done before someone's first-ever visit is treated
as the starting line, not news, so it never fires retroactively.

The admin can post free-form **reminders** from **Admin → Reminders** — a message, an optional
amount, an optional target date ("need ₹50,000 for the next stage by the 10th") — which shows
as a dismissible banner at the top of every page until someone closes it or the admin deletes
it. Separately, **Admin → Upcoming subscriptions** tracks recurring renewals (a domain,
hosting, the Play Console): a title, a due date, and an optional amount. Starting 30 days out,
a reminder for the soonest one appears at the top of every page; closing it only hides that
day's reminder, so it comes back tomorrow if it's still due.

The UI is [shadcn/ui](https://ui.shadcn.com) on Tailwind v4, built mobile-first: a bottom tab
bar and a thumb-reachable add button on phones, a top bar and tables on wider screens, and it
follows the phone's light/dark setting.

Sessions are a signed JWT in an httpOnly cookie and are re-checked against the database on
every request, so removing or disabling someone cuts them off immediately. Passwords are
hashed with bcrypt. Every amount, date, role and category coming from the browser is
re-checked on the server.
#   p a y t r a c k  
 