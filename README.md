# Amboras Store Analytics Dashboard

Analytics dashboard for Amboras store owners. Shows revenue (today/week/month), conversion funnel, top 10 products by revenue, and a recent activity feed.

> **What's real vs. fake:** The architecture, API structure, aggregation logic, and multi-tenancy patterns are production-intentioned. The database is in-memory (data resets on restart), and auth is mock headers (trivially spoofable). Both are called out explicitly wherever they matter.

---

## Stack

| Layer | Choice | Rejected |
|---|---|---|
| Backend | NestJS (TypeScript) | Express — NestJS gives DI, guards, and decorators out of the box, which matters for clean multi-tenancy |
| Frontend | Next.js (TypeScript) | CRA / Vite SPA — Next.js gives us SSR as a future option without a rewrite |
| ORM | TypeORM (in-memory repos) | Prisma — TypeORM's repository pattern maps more naturally to the service-layer architecture used here |
| Runtime | Bun | npm/yarn — faster installs and script execution; no meaningful tradeoff at this scale |
| API | REST | GraphQL — unnecessary for a fixed set of dashboard queries with no nested/variable data shapes |

---

## Setup

**Prerequisites:** Bun v1.0+, Node.js v18+
```bash
git clone git@github.com:aetosdios27/Amboras-Take-Home-Assignment-Solution.git
cd Amboras-Take-Home-Assignment-Solution
```

### Backend
```bash
cd backend
bun install
cp .env.example .env
# Fill in .env with your values
bun run src/seed.ts    # required — populates in-memory store; skip this and every endpoint returns empty
bun run start:dev      # → http://localhost:3001
```

`.env` is pre-wired for PostgreSQL but the in-memory repos intercept all persistence calls. Leave defaults as-is for local dev.

### Frontend
```bash
cd ../frontend
bun install
cp .env.example .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:3001
bun run dev            # → http://localhost:3000
```

If you see skeleton loaders on first paint and then data populates, it's working.

---

## Architecture Decisions

### 1. Pre-aggregated daily metrics over runtime event aggregation

**Chose:** `DailyStoreMetricsEntity` and `DailyProductMetricsEntity` — pre-rolled daily summaries queried and summed at request time per range (today / week / month).

**Rejected:** Querying `EventEntity` directly for aggregates (e.g. `SUM(revenue) WHERE date >= X GROUP BY product`).

**Why it matters to the store owner:** A store owner opens their dashboard first thing in the morning to decide what to promote, what's underperforming, and whether yesterday was good or bad. If that page takes 6 seconds to load, they stop trusting it. The < 2s target isn't arbitrary — it's the difference between a tool people open daily and one they stop using.

**Concrete tradeoff:** At 10,000 events/minute, a 30-day revenue query on raw events scans ~432M rows. With pre-aggregated daily rows, the same query scans at most 30 rows per store. That's the difference between a ~4-6s query and a ~5ms query on Postgres without heroic indexing.

**What we gave up:** Metrics reflect data as of the last completed roll-up. A purchase made at 11:58pm may not appear until tomorrow's aggregation runs. For a daily-summary dashboard, this is acceptable. For a "last 5 minutes" view, it isn't.

**At 100M+ events:** The daily roll-up job becomes the critical path. You'd shard the aggregation by `storeId`, run it on a read replica, and consider Materialized Views or a columnar store (ClickHouse, BigQuery) to replace the roll-up entirely.

**What's missing:** The roll-up job itself isn't implemented. Seed data stands in for it. In production this would be a cron job or queue-based worker.

---

### 2. Direct query for activity feed vs. batching it

**Chose:** Query `EventEntity` directly — `ORDER BY timestamp DESC LIMIT N WHERE storeId = ?`

**Rejected:** Pre-aggregating or caching the activity feed the same way as metrics.

**Why:** The activity feed serves a different user need than the metrics. Metrics answer "how am I doing overall?" — the feed answers "what just happened?" A store owner seeing a spike in the revenue chart wants to immediately scan the feed to understand why. Batching the feed introduces the same lag as the metrics, which breaks that use case.

**Concrete tradeoff:** Direct queries are fast now (milliseconds at seed-data scale) and become a liability later. At ~10M events per store, an unindexed `timestamp DESC` scan gets slow. At ~100M events, it breaks without partitioning.

**Edge case handled:** Feed is scoped strictly to `storeId` — no cross-tenant event leakage even on direct queries.

**Edge case not handled:** No pagination or cursor. The feed returns the latest N events and stops. A high-volume store generating 10 events/second will make this feel stale within seconds without a WebSocket push.

**At 100M+ events:** Partition the events table by `(storeId, date)`. For true real-time, move the feed to a dedicated event stream (Kafka topic per store) consumed via SSE or WebSocket. Direct DB queries for a live feed don't survive at scale.

---

### 3. Client-side fetching over SSR

**Chose:** Client-side data fetching — `useEffect` + `Promise.all` for concurrent requests, `useState` for loading/error states, skeleton loaders on first paint.

**Rejected:** Next.js SSR (`getServerSideProps`) or React Server Components for data fetching.

**Why:** This dashboard is authenticated, user-specific, and highly interactive. SSR would add latency to the initial HTML response (waiting on API calls server-side) without meaningful benefit — there's nothing to pre-render that's useful before auth resolves. Client-side fetching also makes future additions (polling, WebSocket updates, date range pickers) cheaper to implement.

**Concrete tradeoff:** First paint is a skeleton shell with zero data. On a 3G connection, the user sees bones for 2–3 seconds. For an internal business tool accessed on desktop/broadband, this is acceptable. For a mobile-first product, it wouldn't be.

**Pattern used:** TypeORM repository pattern with a service layer. Controllers are thin — they validate input and call services. Services own all business logic and repository interactions. This keeps controllers testable in isolation and prevents logic from leaking into the HTTP layer.

**State management:** `useState` per component. Works fine at current scope. As soon as cross-widget state is needed (e.g. a date range picker that filters all widgets simultaneously), this needs replacing with Zustand or Jotai. `useContext` would work but gets messy past 2–3 levels.

---

### 4. `storeId` scoping for multi-tenancy

**Chose:** Filter every query by `storeId`, extracted from the `MockAuthGuard` via the `@CurrentUser()` decorator.

**Rejected:** Row-level security at the database layer (Postgres RLS).

**Why:** Application-layer scoping is easier to test, easier to reason about, and doesn't require Postgres-specific schema features. Every repository call explicitly receives `storeId` — there's no ambient trust in the DB session.

**The fake part:** `MockAuthGuard` reads `storeId` from the `x-store-id` request header. Any client can set this to any value and read another store's data. This is intentional for local dev ergonomics but is a complete security hole. In production, `storeId` must come from a verified JWT claim — never a raw header.

**Edge case handled:** `storeId` is validated as present before any query runs. Missing header returns 401, not an empty dataset that silently crosses tenant boundaries.

**Edge case not handled:** No rate limiting per `storeId`. A single tenant could hammer the API and degrade performance for others.

**At 100M+ events:** Application-layer scoping survives fine. The bottleneck becomes query performance, not the scoping pattern itself. Add a composite index on `(storeId, date)` as the first move.

---

## Performance: What's Real vs. Conceptual

**Implemented and working:**
- Aggregate queries hit pre-aggregated tables — not raw events
- Frontend fires overview, top-products, and activity requests concurrently via `Promise.all`; no waterfall
- Skeleton loaders on all data-heavy components — no blank screen flash

**Not implemented (would matter before production):**

| Gap | Impact | Fix |
|---|---|---|
| No Redis caching | Aggregate queries hit DB on every page load | Cache with 5–60min TTL; aggregates only change when roll-up runs |
| No DB indexes validated | Assumed `storeId`, `date`, `productId` are indexed — not confirmed | Add and verify composite indexes before any load testing |
| No connection pooling config | Default TypeORM pool may be too small under concurrent load | Configure `pg` pool size based on expected concurrency |
| No table partitioning | Events table becomes a bottleneck past ~50M rows | Partition by `(storeId, date)` |

---

## Known Limitations

| Area | What's actually true |
|---|---|
| Database | In-memory. Restart = data gone. |
| Auth | Mock headers. Any value accepted. Do not deploy. |
| Roll-up job | Not implemented. Seed data is the stand-in. |
| Real-time | No push. Metrics are stale until refresh. |
| Activity feed | No pagination, no cursor, no WebSocket. Returns latest N and stops. |
| Error states | API failures render as empty widgets, not error messages. Users won't know why data is missing. |
| Tests | None. Aggregation logic and service layer are the highest-priority targets if adding tests. |
| Observability | No structured logging, no metrics endpoint, no alerting. |
| Input validation | Basic. API is not hardened against malformed or adversarial input. |

---

## Production Checklist

- [ ] Replace `MockAuthGuard` with JWT — `storeId` from verified token claim, not header
- [ ] Swap in-memory repos for real PostgreSQL + TypeORM migrations
- [ ] Implement daily aggregation worker (cron or BullMQ queue)
- [ ] Add composite indexes on `(storeId, date)`, `(storeId, productId)`
- [ ] Redis caching on `/overview` and `/top-products` with TTL aligned to roll-up frequency
- [ ] WebSocket or SSE for activity feed
- [ ] Cursor-based pagination on activity feed
- [ ] Structured logging (Pino) + metrics (Prometheus) + dashboards (Grafana)
- [ ] Rate limiting per `storeId`
- [ ] Custom date range support across all analytics views
- [ ] Test coverage: aggregation logic (unit), API endpoints (integration), auth scoping (security)

---
