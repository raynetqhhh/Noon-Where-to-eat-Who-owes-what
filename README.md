# Noon-Where-to-eat-Who-owes-what
Noon is a small web app that helps a group of friends decide where to have lunch and then split the bill fairly. It was built as a weekend venture experiment to test whether a single link can replace the "anywhere is fine" chat and the awkward payment chasing afterwards.

## Tech stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19, React Router 7, Vite, Tailwind CSS v4, lucide icons |
| Backend  | Node.js, Express 5 (MVC + middleware), Zod                  |
| Database | Supabase (PostgreSQL, Auth, Realtime broadcast)             |

## Features

**Public site:** landing page (how it works, features, for eateries, pricing, FAQ), sign up, sign in, password reset, join a lunch by code.

**Lunch room** (`/s/:code`, works for guests and signed-in users):
- Join with just a name (or one tap when signed in); crew members tap their name
- Dietary needs (halal, vegetarian, vegan, no beef, no pork) flag unsuitable places
- Mood filters (light, spicy, comfort…), budget per head, "suits everyone" filter
- One vote and one veto per person, live updates on every phone
- Host controls: decide fairly, pick manually, lock voting, countdown timer, close/reopen
- Fairness-weighted tie-breaker + "been there recently" penalty, with the reason shown
- Lunch clock, keyboard shortcuts (1–9, N, S, ?, Ctrl/⌘+Z) and undo
- Sponsored spots mock-up (clearly labelled, never ranked higher) and group deals

**Bill** (`/s/:code/bill`):
- Item-level split with shared items, discount/voucher, 10% service charge, 9% GST
- Multiple payers; fewest transfers to settle; mark paid (with undo)
- WhatsApp summary and reminders (with PayNow ID), CSV export, shareable summary card

**User portal** (`/app`, signed in):
- Dashboard: owed to you / you owe, active lunches, join by code, recent lunches
- Meal history: search, filter, grouped by month, CSV export
- Payments: running ledger netted per person across lunches, records, reminders, export
- Crews: saved groups with dietary needs, budget, meeting point, fairness board
- Insights: spend by month, cuisines, top places, decision times, streak, fairness boards
- Settings: name, dietary needs, allergies, PayNow ID, theme (light/dark/system), password

Mobile-first (bottom tab bar on phones), dark mode, keyboard accessible, reduced-motion aware.

## Project structure

```
.
├── client/                         # React frontend
│   └── src/
│       ├── api/                    # fetch wrapper + endpoint functions
│       ├── components/
│       │   ├── bill/               # BillEditor, BillSummary, SummaryCard
│       │   ├── layout/             # PublicLayout, PortalLayout, RoomLayout, ProtectedRoute
│       │   ├── session/            # SuggestionCard, HostControls, JoinPanel, LunchClock...
│       │   └── ui/                 # Button, Field, Card, Badge, Modal, Avatar, Bars...
│       ├── context/                # Auth, Theme, Toast
│       ├── hooks/                  # useSession (live), useAsync, useHotkeys, useNow
│       ├── lib/supabase.js         # browser Supabase client (auth + realtime only)
│       ├── pages/
│       │   ├── public/             # Landing, SignIn, SignUp, Join, NotFound
│       │   ├── session/            # SessionPage, BillPage
│       │   └── portal/             # Dashboard, NewLunch, Lunches, Payments, Crews, Insights, Settings
│       └── utils/                  # money, dates, dietary, split preview, share/CSV
│
├── server/                         # Express REST API (MVC)
│   ├── src/
│   │   ├── config/                 # env, Supabase client, constants, sponsored spots
│   │   ├── controllers/            # session, suggestion, vote, bill, me, crew
│   │   ├── middleware/             # auth, loadSession, validate, rateLimiter, errors
│   │   ├── models/                 # all Supabase queries
│   │   ├── routes/
│   │   ├── services/               # split, decision (fairness), insights, session rules
│   │   ├── validators/             # Zod schemas
│   │   └── views/                  # DB rows -> JSON
│   └── tests/                      # node:test unit tests
│
└── supabase/migrations/            # run in order
```

### How auth works

- **Signed-in users:** Supabase Auth in the browser. The access token is sent to the API as
  `Authorization: Bearer <token>`; the API verifies it with Supabase.
- **Guests:** joining a lunch returns a random token, sent back as `X-Participant-Token`.
  Only its SHA-256 hash is stored.
- All tables have Row Level Security on with no policies, so the browser's anon key can't read
  data directly. Only the API (service role key) can.

## Getting started

Requires Node.js 22+.

1. **Install** (from the repo root):
   ```bash
   npm install
   ```
2. **Database:** in your Supabase project's SQL editor, run both files in
   `supabase/migrations/` **in order**.
3. **Environment:**
   - `server/.env`: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (secret)
   - `client/.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public)
4. **Auth settings** (Supabase → Authentication → URL Configuration): set Site URL to
   `http://localhost:5173`. Turn email confirmation off for quick local testing if you like.
5. **Run** (two terminals):
   ```bash
   npm run dev:server   # http://localhost:4000
   npm run dev:client   # http://localhost:5173
   ```
6. **Test:** `npm test`

## API

All routes are prefixed with `/api`.

| Method | Path                                             | Who                     |
| ------ | ------------------------------------------------ | ----------------------- |
| GET    | `/health`, `/sponsored-spots`                    | anyone                  |
| POST   | `/sessions`                                      | anyone (→ host)         |
| GET    | `/sessions/:code`                                | anyone with link        |
| PATCH  | `/sessions/:code`                                | host                    |
| POST   | `/sessions/:code/join`                           | anyone with link        |
| POST   | `/sessions/:code/decision`                       | host                    |
| POST   | `/sessions/:code/suggestions`                    | participant             |
| DELETE | `/sessions/:code/suggestions/:suggestionId`      | suggester / host        |
| PUT    | `/sessions/:code/votes`                          | participant             |
| DELETE | `/sessions/:code/votes/:kind`                    | participant             |
| GET    | `/sessions/:code/bill`                           | anyone with link        |
| PUT    | `/sessions/:code/bill`                           | host                    |
| PATCH  | `/sessions/:code/bill/settlements/:settlementId` | people involved / host  |
| GET    | `/me`, `/me/lunches`, `/me/payments`, `/me/insights` | signed in           |
| PATCH  | `/me`                                            | signed in               |
| CRUD   | `/crews`, `/crews/:crewId/members/:memberId`     | signed in (owner edits) |

Money is always sent and stored as integer cents (`1290` = $12.90).
