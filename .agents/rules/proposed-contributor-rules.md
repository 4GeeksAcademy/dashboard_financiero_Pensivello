# Proposed contributor and agent rules

These are proposed rules inferred from concrete repository structure and behavior. They document observed conventions; they do not claim that every pattern is a formal project-wide standard. Each rule cites project evidence.

## Architecture

### ARCH-01 — Keep API contracts aligned across backend and frontend

When changing a financial movement field, enum value, or response shape, update the corresponding backend Pydantic model and frontend TypeScript type, then update affected consumers and tests.

**Project fact:** `backend/app/routes.py` defines `FinancialMovement` and `Literal` types (`OperationType`, `Category`, `BusinessType`); `frontend/src/lib/financial-types.ts` separately defines the corresponding frontend types. `frontend/src/App.tsx` consumes `/api/metrics`.

### ARCH-02 — Verify endpoint-specific query parameters

Do not assume that query parameters supported by one endpoint are supported by another. Confirm the route signature before wiring filters in the UI or reusing a request.

**Project fact:** `get_metrics` for `/api/metrics` declares date, category, and operation filters, while `get_metrics_summary` additionally declares `business_type`; these signatures are in `backend/app/routes.py`.

### ARCH-03 — Keep the existing dashboard data flow explicit

When adding a backend metric or endpoint, connect it deliberately to the frontend; adding a route alone does not change the dashboard.

**Project fact:** `frontend/src/App.tsx` fetches only `/api/metrics`, then calls `computeKPIs` and `computeMonthlyData` from `frontend/src/lib/financial-utils.ts`. Other routes are defined in `backend/app/routes.py`.

### ARCH-04 — Preserve and review the API proxy when changing service names or ports

If changing the backend Compose service name or port, update the Vite proxy target and any related documentation/configuration in the same change.

**Project fact:** `docker-compose.yml` names the backend service `backend` and maps port 8000; `frontend/vite.config.ts` proxies `/api` to `http://backend:8000`.

## Naming

### NAME-01 — Follow the local language pattern for each layer

For new frontend modules, follow the observed kebab-case filenames, PascalCase React component exports, and camelCase utility functions. For backend routes/functions and API field names, follow the observed Python/API snake_case style. Do not rename existing public fields just to enforce a different style.

**Project fact:** `frontend/src/components/dashboard/income-outcome-chart.tsx` exports `IncomeOutcomeChart`; `frontend/src/lib/financial-utils.ts` exports `computeMonthlyData`; `backend/app/routes.py` defines `get_metrics_summary` and fields such as `create_date` and `operation_type`.

### NAME-02 — Preserve established financial vocabulary in API values

When extending operation, category, or business-type values, update the corresponding typed declarations on both sides rather than introducing untyped strings.

**Project fact:** Backend `Literal` aliases in `backend/app/routes.py` and frontend unions in `frontend/src/lib/financial-types.ts` enumerate `income`/`outcome`, categories, and `B2B`/`B2C`.

## Testing

### TEST-01 — Add or adjust tests for changed calculations and API behavior

Changes to financial calculations should be covered in the frontend utility tests; changes to routes, filtering, or response fields should be covered in backend route tests.

**Project fact:** `frontend/src/lib/financial-utils.test.ts` tests KPI calculations, monthly aggregation, and formatters. `backend/tests/test_routes.py` tests filters, B2B/B2C routes, summaries, top categories, comparisons, and alerts.

### TEST-02 — Use the repository's declared frontend validation scripts

Run the relevant `npm` script after frontend changes: `npm test`, `npm run lint`, and/or `npm run build`. Report which commands were run and their results; do not state that validation passed if it was not run.

**Project fact:** These scripts are declared in `frontend/package.json`; `build` runs `tsc -b && vite build`.

### TEST-03 — Check date and seed assumptions when changing mock data

When modifying the mock generator, verify date-range and deterministic-data expectations in tests, and update tests if the behavior intentionally changes.

**Project fact:** `generate_mock_movements(seed=42)` is used by backend routes in `backend/app/routes.py`; `backend/tests/test_routes.py` asserts 360 sorted records and date filter boundaries.

## Documentation

### DOC-01 — Keep run instructions synchronized with Compose and container configuration

If service names, ports, startup commands, or proxy behavior change, update the Spanish and English README instructions to match the actual configuration.

**Project fact:** `README.es.md` and `README.md` document `docker compose up --build` and local URLs; `docker-compose.yml` and both Dockerfiles define service ports and startup commands.

### DOC-02 — Document whether data is mock or persistent

Do not describe dashboard data as database-backed unless persistence is added and configured; update documentation if the data source changes.

**Project fact:** `backend/app/routes.py` generates mock movements with `generate_mock_movements(seed=42)`, and `docker-compose.yml` declares only `frontend` and `backend` services.

## Developer experience (DX)

### DX-01 — Use the configured frontend path alias

For imports from `frontend/src`, use the existing `@/` alias where suitable; if changing it, keep TypeScript and Vite configuration aligned.

**Project fact:** `frontend/tsconfig.app.json` maps `@/*` to `./src/*`; `frontend/vite.config.ts` maps `@` to the same directory.

### DX-02 — Preserve the Docker development proxy workflow

For local development through Compose, keep browser API requests on `/api` so Vite proxies them to the backend. If a different API origin is required, check `VITE_API_BASE_URL` behavior and document the setup.

**Project fact:** `frontend/src/App.tsx` uses `VITE_API_BASE_URL ?? ""`; `frontend/vite.config.ts` proxies `/api` to `backend:8000`; the README documents the proxy default.

### DX-03 — Review the fixed dashboard period when changing generated dates

If changing the mock data date range or switching to live data, replace or validate the fixed header period at the same time.

**Project fact:** `frontend/src/App.tsx` passes the fixed string `2024 - Full Year` to `DashboardHeader`; `backend/app/routes.py` generates dates relative to `date.today()`.
