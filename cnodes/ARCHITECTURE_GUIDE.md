# API-GATEWAY (NestJS + GraphQL) — Architectural Guide

> Version: 2025-09-18 • Authoring assistant: GPT-5 Thinking

---

## 1) What this project is

**API-GATEWAY** is a NestJS 11 application that exposes a **GraphQL API** (Apollo Server 4) with **HTTP** and **WebSocket (graphql-ws)** transport. It centralizes authentication, real‑time subscriptions, and analytics endpoints for call records. The codebase follows a **module-per-domain** structure and a **schema‑first** GraphQL workflow (types are generated from `.graphql` files to `src/graphql.ts`).

High‑level responsibilities:

- **Gateway** for client apps (UI, services) via GraphQL.
- **Authentication** (IAM) for both HTTP and WebSocket contexts.
- **Real‑time** streaming (Live Mode) and **Historical** queries (Historical Mode).
- **Analytics** facades for charts/carousels based on call‑record data.
- **Pub/Sub** backbone for GraphQL subscriptions.

---

## 2) Tech stack & conventions

- **Runtime**: Node 20+, NestJS 11
- **Transport**: Apollo Server 4, `graphql-ws` (subscriptions)
- **Schema strategy**: **schema-first** → `.graphql` → generated `src/graphql.ts` (watch)
- **Typing**: TypeScript (strict), `class-validator` + `class-transformer` for DTOs
- **Config**: `@nestjs/config` (env-based), `process.env.PORT` fallback 4000
- **Testing**: Jest 30 (unit), Supertest (e2e placeholder)
- **Lint/Format**: ESLint 9 + Prettier 3

**Coding style (recommended):**

- One **Nest module per domain** (`*.module.ts`), with `resolvers/`, `services/`, `types/`, `config/` subfolders.
- Keep **pure logic** in services, minimal logic in resolvers.
- DTOs and inputs defined in `.graphql`; reuse generated types from `src/graphql.ts`.
- **Guards/Middleware** only for cross‑cutting (auth, logging, rate limiting).

---

## 3) Repository layout (src/)

```
src/
  app.module.ts              # Root composition: GraphQL, WS, middleware, domain modules
  main.ts                    # Bootstrap (NestFactory), PORT, listen
  generate-types.ts          # GraphQLDefinitionsFactory (watch → src/graphql.ts)
  graphql.ts                 # Auto‑generated types from *.graphql

  modules/
    analytics/               # Analytics facade & schemas (charts/carousel)
    call-records/            # Call record domain (schema, resolvers, services)
    common/                  # Cross‑cutting utilities (types, helpers)
    historical-mode/         # Historical queries
    iam/                     # Identity/Access (IdP integration, auth)
    live-mode/               # Live streaming / subscriptions
    pub-sub/                 # PubSub service for GraphQL subscriptions
```

**Module anatomy (typical):**
```
<domain>/
  <domain>.module.ts
  graphql/ *.graphql
  resolvers/ *.resolver.ts
  services/ *.service.ts
  types/ *.ts
  dto/ *.ts   (optional, if needed in code; inputs live in .graphql)
  utils/ *.ts (optional)
  config/ *.ts (optional)
```

---

## 4) Runtime flow (HTTP & WS)

### HTTP (queries/mutations)
1. **Request** hits Nest → `AuthenticationMiddleware` (adds `req.userInfo` if present).
2. Apollo GraphQL resolves `context` → returns `{ userInfo }` from `req`.
3. **Resolver** delegates to **Service** → returns typed result (generated types).

### WebSocket (subscriptions)
1. Client connects via **graphql-ws** with `connectionParams.accessToken`.
2. `onConnect` (configured in `app.module.ts`) calls **IdpTokenService.verifyAsync()**.
3. On success, writes `extra.userInfo` into WS context → resolvers get `{ userInfo }`.
4. **PubSubModule** dispatches events to subscribed clients.

**Unified context**: resolvers always receive `{ userInfo }`, regardless of transport.

---

## 5) GraphQL schema-first workflow

- Define schema in `*.graphql` per feature.
- Run `generate-types.ts` (watch) to generate **classes/interfaces** into `src/graphql.ts`.
- Import the generated types in resolvers/services for compile‑time safety.
- Keep resolvers lean: map `args` → service calls → map back to GraphQL types.

**Command (example):**
```bash
npm run gen-types    # underlying: node ./dist/generate-types.js (after build)
```

---

## 6) Domain breakdown (brief)

### 6.1 analytics/
- **Purpose**: Provide GraphQL endpoints for analytics (charts & carousel).
- **Structure**: `charts/*/*.graphql`, `carousel/*/*.graphql`, `common/dto/*.graphql`.
- **Notes**: Each chart exposes inputs (`range`, `granularity`, `pagination`) and typed outputs for UI. Keep this module **stateless** and delegate heavy lifting to a data layer (service or external analytics API).

### 6.2 call-records/
- **Purpose**: CRUD/notifications on call records; base schema `graphql/call-records.graphql`.
- **Resolvers**: mutations for create/update/notify; subscriptions for created/updated events.
- **Services**: orchestrate domain logic; avoid DB coupling here if gateway delegates to another microservice.

### 6.3 live-mode/
- **Purpose**: Real‑time streaming (subscriptions, live feeds).
- **GraphQL**: `graphql/live-mode.graphql` — streaming queries/subscriptions.
- **Rec**: Ensure backpressure or buffering in PubSub to prevent memory growth.

### 6.4 historical-mode/
- **Purpose**: Historical queries (pagination, filters).
- **GraphQL**: `graphql/historical-mode.graphql` — typed queries for UI dashboards.
- **Rec**: Enforce date range limits and pagination strategies; watch for N+1 sources.

### 6.5 iam/
- **Purpose**: Authentication/Authorization.
- **Services**: `IdpTokenService.verifyAsync()` used by `onConnect` (WS). Middleware adds `userInfo` for HTTP.
- **Rec**: Split responsibilities: token verification vs claims mapping; plan for role/permission guards.

### 6.6 pub-sub/
- **Purpose**: Pub/Sub engine for subscriptions.
- **Rec**: Use a single configurable provider (in‑memory for dev; Redis or Rabbit for prod). Wrap behind a Nest provider token for swapability.

### 6.7 common/
- **Purpose**: Shared utilities & types.
- **Rec**: Keep small, dependency‑free; avoid circular imports by exporting via an index barrel if needed.

---

## 7) Authentication & authorization

- **AuthN**: Token verified at **WS connect** and passed to HTTP via **middleware**.
- **AuthZ**: Use **guards** per resolver or module (role‑based or scope‑based). Consider `@SetMetadata('roles', [...])` + custom `RolesGuard`.

**Best practice**: Do not rely on client‑supplied fields (like user id) in resolvers; trust only `context.userInfo` claims.

---

## 8) Error handling & logging

- Throw Nest `HttpException`/`ApolloError` flavors in resolvers/services.
- Install `GraphQLExecutionContext` interceptors for **logging** and **error redaction**.
- Prefer structured logs (`pino`) with request id (correlate HTTP and WS).

```ts
// Example (pseudo)
try { /* service call */ }
catch (e) {
  logger.error({ err: e, op: 'analytics.query' });
  throw new ApolloError('ANALYTICS_QUERY_FAILED');
}
```

---

## 9) Configuration (env vars)

- `PORT` (default 4000)
- `NODE_ENV` = development | production | test
- `IDP_PUBLIC_KEY` / `IDP_JWKS_URL` (token verification)
- `PUBSUB_BACKEND` (memory|redis|rabbit)
- `LOG_LEVEL` (info|debug|warn|error)

**Pattern**: `@nestjs/config` + validation schema (e.g., `Joi`) to fail‑fast on bad env.

---

## 10) Build, scripts, and testing

- **Build**: `nest build` → cleans `dist/` by CLI config.
- **Start**: `npm run start:dev` for HMR-like DX; `start:prod` for compiled.
- **Types generation**: `npm run gen-types` (watch uses ts-node in `dist`).
- **Tests**: 
  - Unit: colocate `*.spec.ts` near code.
  - e2e: `test/app.e2e-spec.ts` (expand beyond “Hello World”).

---

## 11) Performance & scalability tips

- **Subscriptions**: Adopt Redis or message broker for horizontal scale.
- **N+1**: Use dataloader pattern for resolving nested fields.
- **Time windows**: Enforce max ranges on historical queries.
- **Serialization**: Ensure `class-transformer` does not leak sensitive fields.

---

## 12) Security checklist

- Validate tokens on WS **onConnect**; disconnect on failure.
- Sanitize inputs (GraphQL inputs are typed, but still validate business constraints).
- Disable Playground in production or protect it behind auth.
- Rate limit or depth/complexity limit GraphQL queries (prevent expensive graphs).

---

## 13) Developer onboarding

1. `npm i`
2. Copy `.env.example` → `.env` and fill required envs.
3. `npm run build && npm run gen-types`
4. `npm run start:dev`
5. Run quick smoke: open GraphQL landing page (local plugin enabled in dev).

**Verify**: HTTP context returns `userInfo` (via middleware); WS connect sends `accessToken` and attaches `extra.userInfo`.

---

## 14) Analytics module — authoring pattern

- Create a folder under `analytics/charts/<feature>/`.
- Define inputs/outputs in `<feature>.graphql`.
- Implement resolver in `resolvers/<feature>.resolver.ts` using types from `src/graphql.ts`.
- Delegate heavy logic to a service (`services/<feature>.service.ts`).

**GraphQL input DTOs** belong in `.graphql` (e.g., `range`, `granularity`), and can be reused across charts via `analytics/common/dto`.

---

## 15) Recommended exclusions for preprocessing

- Exclude `dist/`, `*.tsbuildinfo`, and large logs from preprocessor to keep `Artifacts.ndjson` focused on `src/`.
- Keep `rels[]` lean: only imports/exports with evidence (line numbers).

---

## 16) Future improvements

- Centralized `PubSub` driver config (in‑memory → Redis).
- Global `AccessTokenGuard` (APP_GUARD) with role-based rules.
- Add `complexity` plugin for GraphQL to throttle expensive queries.
- Expand e2e tests for analytics queries and subscriptions handshake.
- Observability: request-id, trace headers, and metrics (Prometheus).

---

## 17) Quick ASCII map

```
[ main.ts ] → [ AppModule ] → [ GraphQLModule(Apollo) + graphql-ws ]
                              ↘ imports: [ analytics, call-records, live-mode, historical-mode, iam, pub-sub ]
HTTP: AuthenticationMiddleware → context(req.userInfo) → resolvers → services
WS:   onConnect(token→IdpTokenService) → context(extra.userInfo) → subscriptions
```

---

## 18) Contacts & IDs

- Root Cognitive Node idea: `cnode:lenguaje-corp/preprocess-to-structure@1.0.0`
- Primary modules: `analytics`, `call-records`, `live-mode`, `historical-mode`, `iam`, `pub-sub`, `common`

---

**End of guide.**
