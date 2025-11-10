# API-GATEWAY (NestJS + GraphQL) — Comprehensive Architectural Guide

> Version: 2025-09-18 • Authoring assistant: GPT-5 Thinking

---

## 0) Scope of this document

This document is a **deep-dive** for developers joining the project. It explains **what the system is**, **how modules interact**, **what each module expects/returns**, and **how to operate, extend, and troubleshoot** the gateway.

It assumes familiarity with **NestJS**, **GraphQL (Apollo Server 4)**, and **TypeScript**.

---

## 1) What this project is

**API-GATEWAY** is a NestJS 11 application that exposes a **GraphQL API** over **HTTP** and **WebSocket (graphql-ws)**. It centralizes:

- **Authentication** (IAM) for both HTTP and WS contexts.
- **Real-time subscriptions** (Live Mode).
- **Historical queries** (Historical Mode).
- **Analytics** endpoints built on top of call records.
- A **Pub/Sub** backbone for pushing events to subscribers.

The codebase follows a **module-per-domain** structure and a **schema-first** GraphQL workflow: `.graphql` files are the contract; types are generated into `src/graphql.ts`.

---

## 2) Tech stack & standards

- **Node**: 20+
- **NestJS**: 11
- **GraphQL**: Apollo Server 4 + `@nestjs/graphql` + `graphql-ws`
- **Schema-first**: `*.graphql` → generated `src/graphql.ts` (via `GraphQLDefinitionsFactory`)
- **Typing**: TypeScript strict, `class-validator` + `class-transformer` if DTOs appear in code
- **Config**: `@nestjs/config`; environment-driven
- **Testing**: Jest; e2e via Supertest (HTTP) and WS test client
- **Code style**: ESLint + Prettier; services hold logic, resolvers remain thin

---

## 3) Repository layout (src/)

```
src/
  main.ts
  app.module.ts
  generate-types.ts
  graphql.ts                 # generated
  modules/
    analytics/
    call-records/
    common/
    historical-mode/
    iam/
    live-mode/
    pub-sub/
```

**Module anatomy (typical):**
```
<domain>/
  <domain>.module.ts
  graphql/ *.graphql
  resolvers/ *.resolver.ts
  services/ *.service.ts
  types/ *.ts
  utils/ *.ts (optional)
  config/ *.ts (optional)
```

---

## 4) Runtime flow (HTTP & WS)

### HTTP
1) Request enters Nest → `AuthenticationMiddleware` attaches `req.userInfo` (if available).  
2) Apollo context factory returns `{ userInfo }` from request.  
3) Resolver calls a Service; Service returns typed data (from `src/graphql.ts`).

### WebSocket (graphql-ws)
1) Client connects with `connectionParams.accessToken`.  
2) `onConnect` runs `IdpTokenService.verifyAsync()` (IAM).  
3) On success, `extra.userInfo` is set and becomes available in GraphQL context for WS operations.  
4) Subscriptions receive events via **PubSubModule**.

**Unified context**: resolvers get a consistent `userInfo` regardless of transport.

---

## 5) GraphQL schema-first workflow

- Author feature schemas in `*.graphql` inside each module.
- Run `generate-types.ts` to sync `src/graphql.ts` (watch mode recommended in dev).  
- Import generated types in resolvers/services (compile-time safety; no drift).

**Conventions:**
- Use **PascalCase** for GraphQL types, **camelCase** for fields.
- Keep inputs as **GraphQL InputTypes** inside `.graphql`. Avoid duplicating them in TS DTOs unless strictly needed for runtime validation.

---

## 6) Cross-cutting concerns

### 6.1 Authentication
- **HTTP**: `AuthenticationMiddleware` populates `req.userInfo`.  
- **WS**: `onConnect` validates `accessToken` and sets `extra.userInfo`.  
- Resolvers should **only** trust `context.userInfo` (never client-supplied ids).

### 6.2 Authorization
- Use **Guards** (e.g., role/scope guard) at resolver or module level.  
- Prefer declarative metadata (`@SetMetadata('roles', ['admin'])`) + central `RolesGuard`.

### 6.3 Error handling
- Throw `ApolloError` or Nest `HttpException` with sanitized messages.  
- Log details server-side; return stable error codes to clients.

### 6.4 Observability
- Structured logs (`pino`) with request-id correlation across HTTP/WS.  
- Metrics: request durations, subscription counts, resolver timings.

---

## 7) Module-by-module deep dive

Below each module section includes: **Purpose**, **Inputs**, **Outputs**, **Interactions**, **Resolvers/Services**, **Operational notes**, and **Extensibility**.

### 7.1 iam/ (Identity & Access Management)

**Purpose**  
Provide authentication for HTTP and WS, and a consistent `userInfo` in context.

**Key Service**  
`IdpTokenService.verifyAsync(token) → Promise<UserInfo>`

**Inputs**  
- `accessToken` (JWT/JWS from client).  
- Optional configuration: public key / JWKS URL (`IDP_PUBLIC_KEY`, `IDP_JWKS_URL`).

**Outputs**  
- `UserInfo` (claims: `sub`, `email`, `roles`, `permissions`, …).

**Interactions**  
- **WS `onConnect`** uses `IdpTokenService` to validate token.  
- **HTTP `AuthenticationMiddleware`** may use the same service or a lightweight verifier.

**Resolvers/Services**  
- Guards read `context.userInfo` to enforce access control.

**Operational notes**  
- Fail-fast on invalid tokens.  
- Consider token cache (short TTL) to avoid repeated remote JWKS calls.

**Extensibility**  
- Swap IdP provider (Auth0, Cognito, custom) behind the same `IdpTokenService` interface.

---

### 7.2 pub-sub/ (Subscriptions backbone)

**Purpose**  
Provide a Pub/Sub abstraction for GraphQL subscriptions.

**Inputs**  
- Events emitted by domain services (e.g., `callRecordCreated`).

**Outputs**  
- Async iterators for GraphQL resolvers: `pubSub.asyncIterator('EVENT')`.

**Interactions**  
- Used by **live-mode**, **call-records**, and analytics subscriptions.  
- Implementation can be **in-memory** (dev) or **Redis/Rabbit** (prod).

**Operational notes**  
- For production, prefer Redis PubSub adapter.  
- Ensure backpressure or event TTLs if publishers outpace subscribers.

**Extensibility**  
- Provide a provider token (e.g., `PUBSUB_DRIVER`) to swap engines without changing resolvers.

---

### 7.3 call-records/ (Domain: call records CRUD & events)

**Purpose**  
Expose GraphQL operations to create/update/notify **call records**, plus subscriptions for changes.

**Example GraphQL (indicative)**
```graphql
type CallRecord {{
  id: ID!
  agent: Agent!
  patient: Patient!
  sentiment: Sentiment
  ratings: [Rating!]!
  recordingUrl: String
  transcription: String
  createdAt: DateTime!
  updatedAt: DateTime!
}}

input CreateCallRecordInput {{
  agent: AgentAsInput!
  patient: PatientAsInput!
  sentiment: SentimentAsInput
  ratings: [RatingAsInput!]
  recordingUrl: String
  transcription: String
}}
```

**Inputs**  
- `CreateCallRecordInput`, `UpdateCallRecordInput`.  
- Notifications: `NotifyCallRecordCreatedInput`, `NotifyCallRecordUpdatedInput`.

**Outputs**  
- `CallRecord`, `FreshCallRecord`, `TerminatedCallRecordsPage`, `Meta` (for pagination).

**Interactions**  
- Publishes events to **pub-sub** on create/update.  
- Consumed by **live-mode** (streaming updates) and **analytics** (aggregations).

**Resolvers/Services**  
- Resolver parses inputs and calls `CallRecordsService`.  
- Service handles validations and persistence (or delegates to another microservice).

**Operational notes**  
- Enforce idempotency on `notify*` endpoints if events may be retried.  
- Validate payload sizes (e.g., long transcriptions).

**Extensibility**  
- Add indices/filters to pagination types for better historical querying.
- Introduce field resolvers (lazy) for heavy subfields (e.g., transcription).

---

### 7.4 live-mode/ (Real-time streaming)

**Purpose**  
Serve subscriptions/queries for **live** data (e.g., call updates in-flight).

**GraphQL (indicative)**  
- `subscription callRecordCreated`  
- `subscription callRecordUpdated`  
- `query freshCallRecords` (short window of recent records)

**Inputs**  
- Authentication via WS `onConnect`.  
- Optional filters (agent id, time window).

**Outputs**  
- Event streams (`CallRecordCreatedEventData`, `CallRecordUpdatedEventData`).

**Interactions**  
- Subscribes to **pub-sub** events emitted by `call-records`.  
- May expose lightweight materialized views for quick polling.

**Operational notes**  
- Consider buffer sizes for slow clients.  
- Use keep-alives and heartbeat timeouts.

**Extensibility**  
- Add stream partitioning (by tenant/agent) to reduce noisy broadcasts.

---

### 7.5 historical-mode/ (Historical queries)

**Purpose**  
Provide paginated queries across historical call records.

**GraphQL (indicative)**  
- `query terminatedCallRecordsPage(params: QueryParameters!): TerminatedCallRecordsPage!`  
- Common inputs: `Range`, `Pagination`, `Granularity` (if reused from analytics).

**Inputs**  
- Date ranges, page/size, filters (agent, outcome, …).

**Outputs**  
- Page result + `Meta` (total count, nextCursor, etc.).

**Interactions**  
- Reads from persistent store or external service.  
- Base dataset for **analytics** aggregations.

**Operational notes**  
- Enforce upper bounds on ranges.  
- Prefer cursor-based pagination for stability.

**Extensibility**  
- Add compound filters; expose sorting options; precompute view tables if needed.

---

### 7.6 analytics/ (Charts & carousel)

**Purpose**  
Expose **analytics views** (charts & carousels) over call-record data.

**Structure**  
- `charts/ai-operation-breakdown/ai-operation-breakdown.graphql`  
- `charts/call-frequency-outcome/call-frequency-outcome.graphql`  
- `charts/call-volume/call-volume.graphql`  
- `charts/handling-overview/handling-overview.graphql`  
- `charts/median-call-duration/median-call-duration.graphql`  
- `carousel/agent-call-time/agent-call-time.graphql`  
- `common/dto/{granularity.graphql, pagination.graphql, range.graphql}`

**Inputs**  
- `range`, `granularity`, `pagination` (reused across charts).  
- Optional filters by agent/team/outcome.

**Outputs**  
- Typed chart series and metadata tailored to UI widgets.

**Interactions**  
- Consumes **historical-mode** datasets and **live-mode** deltas for near-real-time updates (optional).  
- May aggregate in services or delegate to an external analytics backend.

**Operational notes**  
- Bound queries by time and size.  
- Cache popular queries (in-memory/Redis) keyed by input shape.

**Extensibility**  
- To add a chart: create `charts/<feature>/<feature>.graphql`, add resolver/service pair using generated types, register in module.

---

### 7.7 common/ (Shared utilities)

**Purpose**  
Shared helpers/types used across modules.

**Examples**  
- `type-utils/*`  
- Re-exported index to avoid deep relative imports.

**Operational notes**  
- Keep minimal and dependency-free.  
- Avoid circular dependencies by layering: `common` must not import domain modules.

---

## 8) Detailed context behavior

```ts
// Pseudocode of context factory
GraphQLModule.forRootAsync({
  useFactory: () => ({
    driver: ApolloDriver,
    subscriptions: {
      'graphql-ws': {
        onConnect: async (ctx) => {
          const token = ctx.connectionParams?.accessToken;
          const userInfo = await IdpTokenService.verifyAsync(token);
          if (!userInfo) return false;
          ctx.extra.userInfo = userInfo;
          return true;
        },
      },
    },
    context: ({
      req, extra
    }) => ({ userInfo: extra?.userInfo ?? req?.userInfo })
  })
})
```

**Resolver contract**  
- `context.userInfo` is **always** present for authorized operations.  
- Enforce authorization inside resolvers or via guards.

---

## 9) Security & compliance

- **Do** validate tokens at WS connect and on each HTTP request (middleware).  
- **Do** sanitize error messages; log sensitive info only server-side.  
- **Do** implement depth/complexity limits to mitigate expensive GraphQL queries.  
- **Don't** trust client-provided ids/roles; use `context.userInfo`.

---

## 10) Performance & scalability

- Prefer **Redis PubSub** for multi-instance deployments.  
- Apply **dataloader** pattern for nested field resolution.  
- Use **caching** for analytics queries with temporal locality.  
- Limit historical windows and page sizes.

---

## 11) Configuration table (env)

| Key                | Purpose                                  | Default |
|--------------------|------------------------------------------|---------|
| PORT               | HTTP port                                 | 4000    |
| NODE_ENV           | environment                               | dev     |
| IDP_PUBLIC_KEY     | token verification (inline)               | -       |
| IDP_JWKS_URL       | token verification (JWKS endpoint)        | -       |
| PUBSUB_BACKEND     | pubsub driver (memory|redis|rabbit)       | memory  |
| LOG_LEVEL          | logger level (info|debug|warn|error)      | info    |

---

## 12) Build & run

```
npm i
npm run build
npm run gen-types   # keeps src/graphql.ts in sync with *.graphql
npm run start:dev
```

**Sanity checks**  
- HTTP: simple query returns 200; context carries `userInfo` if token provided.  
- WS: connect with `accessToken`; verify subscription receives events.

---

## 13) Testing strategy

- **Unit**: services with mocked deps.  
- **Resolver**: thin; test schema mapping and guards.  
- **e2e**: GraphQL HTTP + WS handshake; one subscription flow.  
- **Contract**: snapshot generated `src/graphql.ts` to detect schema drift.

---

## 14) Operational runbook

- **Health**: expose `/healthz` or GraphQL health resolver.  
- **Logs**: correlate HTTP request-id with WS session id.  
- **Incidents**: throttle subscriptions if fanout spikes; inspect PubSub lag.  
- **Rotation**: rotate IdP keys; cache JWKS with TTL.

---

## 15) Extending the system

- New domain: scaffold `<domain>.module.ts`, create `graphql/*.graphql`, resolvers/services, register module in `AppModule`.  
- New analytics chart: add `charts/<feature>/<feature>.graphql`, service/resolver, type-safe via generated types.  
- New subscription: define payload type in `.graphql`, publish via `pub-sub` service, add resolver field under `Subscription`.

---

## 16) ASCII sequences

**Subscription handshake**
```
Client --(WS connect with accessToken)--> Gateway
Gateway --verify token (IAM)-----------> IdP/JWKS
Gateway <-- userInfo -------------------
Gateway -- context.ready --------------> Resolvers
Resolvers -- pubsub.asyncIterator -----> PubSub
```

**Historical query**
```
Client -- GraphQL Query(range,pagination) --> historical-mode.resolver
historical-mode.service -- fetch/compose --> data source(s)
Resolver <-- typed result ----------------
```

---

## 17) Preprocessing recommendations (for code mining)

- Prefer focusing on `src/` (exclude `dist/`, `*.tsbuildinfo`).  
- Emit `rels[]` from imports/exports with line evidence to power structural graphs.  
- Tag `module.ts`, `*.resolver.ts`, `*.service.ts` with `role` for quick discovery.

---

## 18) Glossary

- **Gateway**: this NestJS app; unifies HTTP/WS and auth.  
- **Schema-first**: GraphQL contract authored in `.graphql` then compiled to TS.  
- **PubSub**: event mechanism for GraphQL subscriptions.  
- **Context**: per-request object passed to resolvers containing `userInfo`.

---

## 19) Appendix — Minimal resolver pattern (example)

```ts
@Resolver(() => AnalyticsChartType)
export class CallVolumeResolver {{
  constructor(private readonly svc: CallVolumeService) {{}};

  @Query(() => CallVolumeResult)
  async callVolume(
    @Args('range') range: RangeInput,
    @Args('granularity') granularity: GranularityInput,
    @Context() ctx: {{
      userInfo: UserInfo
    }},
  ) {{
    authorize(ctx.userInfo, ['analytics:read']);
    return this.svc.execute({{ range, granularity, user: ctx.userInfo }});
  }}
}}
```

---

**End of comprehensive guide.**
