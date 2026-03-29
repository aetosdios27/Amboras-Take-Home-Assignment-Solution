# Amboras Store Analytics Dashboard

Analytics dashboard for Amboras store owners. Surfaces revenue (today/week/month), conversion funnel stages, top 10 products by revenue, and a live activity feed.

> **Heads up:** This uses in-memory TypeORM repositories and mock header-based auth. No real database, no real JWT. The architecture is production-shaped but the plumbing is simulated.

---

## Stack

| Layer | Choice |
|---|---|
| Backend | NestJS (TypeScript) |
| Frontend | Next.js (TypeScript) |
| ORM / DB | TypeORM — in-memory repositories |
| Runtime | Bun |
| API style | REST |

---

## Setup

### Prerequisites
- Bun v1.0+
- Node.js v18+ (for tooling compatibility)

### Backend
```bash
cd backend
bun install
cp .env.example .env
```

The `.env` is wired for a real PostgreSQL connection that isn't used yet. Leave defaults as-is for local dev.

Seed the in-memory store before starting the server — without this, all API responses return empty:
```bash
bun run src/seed.ts
```

Start the dev server:
```bash
bun run start:dev
# → http://localhost:3001
```

### Frontend
```bash
cd ../frontend
bun install
cp .env.example .env.local
```

Set the backend URL in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the dev server:
```bash
bun run dev
# → http://localhost:3000
```

---

## Architecture Decisions

### 1. Pre-aggregated metrics over raw event queries

**Decision:** Revenue, conversion, and product metrics are served from two pre-aggregated entities — `DailyStoreMetricsEntity` and `DailyProductMetricsEntity`. The API sums these per requested range (today / week / month) at query time rather than scanning the raw event log.

**Why:** At ~10,000 events/minute, querying raw events inline would blow the < 2s load target. Daily roll-ups keep aggregate queries fast and predictable regardless of event volume.

**Tradeoffs:**
- Metrics reflect data as of the last completed roll-up, not the current moment. There's inherent lag.
- Requires a reliable background job to run daily aggregations. If that job fails silently, dashboards go stale.
- The roll-up process itself isn't implemented here — it's assumed as a precondition.

---

### 2. Hybrid: batch aggregates + direct queries for activity feed

**Decision:** Aggregate metrics go through pre-aggregated tables (batch). The recent activity feed queries `EventEntity` directly, ordered by `timestamp DESC`, scoped to `storeId`.

**Why:** The activity feed needs to show what just happened — batching it would defeat the purpose. Aggregates don't need to be live; the activity feed does.

**Tradeoffs:**
- True real-time aggregates (e.g. revenue updating on every purchase) would need Kafka Streams, Flink, or an in-memory aggregation layer like Redis. That's out of scope here.
- The direct event query won't hold up past tens of millions of rows without table partitioning or a dedicated time-series store (InfluxDB, TimescaleDB). At scale, this is the first thing that breaks.

---

### 3. Client-side data fetching in Next.js

**Decision:** All dashboard data is fetched client-side via `useEffect` + `Promise.all`. No SSR, no RSC data fetching. Skeleton loaders cover the loading state.

**Why:** The dashboard is interactive and user-specific — SSR provides minimal benefit here. Client-side fetching makes it straightforward to add polling, WebSocket updates, or user-driven filtering later without architectural changes.

**Tradeoffs:**
- First paint is a skeleton shell with no data. On slow connections this is noticeable.
- Not suitable for public-facing or SEO-sensitive pages — irrelevant for an internal dashboard.
- As the dashboard grows (more filters, cross-widget state), `useState` per component won't scale. A proper state manager (Zustand, Jotai) should replace it before the component tree gets deep.

---

### 4. Multi-tenancy via `storeId` scoping

**Decision:** Every data access operation filters by `storeId`. The `MockAuthGuard` extracts `storeId` from the `x-store-id` request header and injects it via the `@CurrentUser()` decorator.

**Why:** Hard data isolation between tenants is non-negotiable. Scoping at the query level means there's no path where tenant A's data leaks to tenant B, regardless of what the API layer does above it.

**Tradeoffs:**
- The current auth is trivially spoofable — any client can set arbitrary headers. This is intentional for local dev but must be replaced before any real deployment.
- A production system needs JWT or session-based auth where `storeId` is embedded in a verified token, not passed raw in a header.

---

## Performance Notes

**What's implemented:**
- Aggregate queries hit pre-aggregated tables, not raw events
- Backend uses `Promise.all` where independent queries can run in parallel
- Frontend fetches overview, top products, and activity concurrently
- Skeleton loaders prevent blank-screen loading states

**What's not implemented but would matter at scale:**
- **Redis caching** for aggregate data — these change at most once per aggregation cycle, so caching them for 5–60 minutes would cut DB load dramatically
- **Database indexes** on `storeId`, `date`, and `productId` — assumed to exist, not validated
- **Table partitioning** by `storeId` and/or `date` for the events table
- **Connection pooling** configuration for the PostgreSQL layer

---

## Known Limitations

| Area | Reality |
|---|---|
| Database | In-memory only. All data is gone on restart. |
| Auth | Mock headers. Trivially spoofable. |
| Aggregation | No roll-up job implemented. Seed data is static. |
| Real-time | Metrics don't update until page refresh. |
| Error handling | Basic — API failures surface as empty states, not actionable errors. |
| Tests | None. |
| Observability | None. No structured logging, no metrics, no alerting. |
| Input validation | Minimal. Not hardened against malformed requests. |

---

## What's Missing for Production

- Replace `MockAuthGuard` with JWT — `storeId` must come from a verified token, not a header
- Swap in-memory repositories for real PostgreSQL with migrations
- Implement the daily aggregation background job (cron or queue-based)
- Redis caching layer for aggregate API responses
- WebSocket or SSE for live activity feed updates
- Structured logging (Winston or Pino) + monitoring (Prometheus/Grafana)
- Test coverage: unit on aggregation logic, integration on API endpoints, E2E on critical flows
- Custom date range support for all analytics views

---

## TODO
```
// TODO: replace MockAuthGuard with JWT-based auth
// TODO: swap in-memory repos with real PostgreSQL + TypeORM migrations
// TODO: implement daily aggregation cron job
// TODO: add Redis caching for /overview and /top-products endpoints
// TODO: add WebSocket/SSE support for activity feed
// TODO: add video walkthrough link
```
