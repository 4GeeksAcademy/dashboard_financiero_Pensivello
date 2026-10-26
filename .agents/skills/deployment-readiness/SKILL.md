---
name: deployment-readiness
description: "Audit or prepare this repository for deployment. Use for Docker/Compose release checks, production readiness, frontend/backend connectivity, health checks, deployment smoke tests, or debugging a failed deployment."
argument-hint: "Target environment (local, staging, production) and whether to audit or implement fixes"
---

# Deployment Readiness

## Objective

Determine whether the frontend and FastAPI backend in this repository can be
built, connected, and served in the requested target environment. Report
evidence and blockers; do not equate a successful image build with a successful
deployment.

This is a repository-specific workflow. The current Compose setup runs Vite in
development mode, the backend Dockerfile starts Uvicorn with `debugpy` and
`--reload`, and the frontend also has a static Nginx production target. Treat
these as separate deployment modes, not as an already configured production
stack.

## When to Use

- Preparing or reviewing a release or deployment for this dashboard.
- Checking Dockerfiles, Compose configuration, runtime networking, environment
  variables, or health and smoke checks.
- Diagnosing why the deployed dashboard cannot load the API or static assets.
- Reviewing deployment-specific changes before they are shipped.

Do not use this skill for SEO audits, generic frontend performance work, or
business/API feature changes unless they directly block deployment.

## Inputs

Collect or infer these inputs from the request and current workspace. Ask only
for missing information that prevents the requested work.

| Input | Required | Expected values |
|---|---|---|
| Target environment | Yes | `local`, `staging`, or `production` |
| Work mode | Yes | `audit` or `implement fixes` |
| Deployment topology | When applicable | Compose, separate containers, or named hosting platform |
| Public/base URL | Optional | URL to run HTTP checks against |
| Backend service address | When not using the repository default | Host and port reachable from the frontend runtime |
| Deployment approval | Required before a live release | Explicit confirmation to deploy; default is no live deployment |

Never request, print, or store secret values. Refer to secret variable names
only. Do not assume a hosting vendor, public domain, TLS termination, database,
or environment-specific configuration that is not present in the repository
or provided by the user.

## Procedure

1. **Read project guidance and source configuration.** Review applicable files
   in `.agents/rules/`, `.agents/skills/`, and `memory-bank/`. Inspect the
   relevant Dockerfiles, `docker-compose.yml`, frontend proxy/Nginx settings,
   backend health route, environment examples, and documented run commands.
2. **Map the requested deployment path.** State which image targets and
   services are used. Verify that the frontend's `/api/` proxy resolves to the
   intended backend from inside its container/network. Check that frontend
   build-time configuration is not being mistaken for runtime configuration.
3. **Run proportionate validations.** Use the existing repository commands
   where applicable:
   - `docker compose config --quiet`
   - `docker build --target production -t dashboard-frontend-check ./frontend`
   - `docker build --target development -t dashboard-frontend-dev-check ./frontend`
   - Frontend checks: `cd frontend && npm run build && npm run lint`
   - Backend checks: run `pytest` from `backend/` when backend code or API
     behavior is in scope.
   Do not repeat a failed check unchanged. Do not run the entire test suite
   unless scope or existing project rules require it.
4. **Smoke-test runtime behavior when feasible.** Start only the needed local
   containers or use the supplied URL. Verify frontend `/` and a client-side
   route return successful HTML, static assets load, backend `/health`
   responds successfully, and the frontend's `/api/metrics` request reaches
   the intended backend. Record the tested URL, status, and topology. Stop
   temporary containers started for the checks.
5. **Identify production blockers.** Flag development servers, reload/debug
   ports, missing production orchestration or health checks, unresolved
   service-name/network assumptions, missing required configuration, and
   untested runtime behavior. Distinguish confirmed failures from items not
   verified. Do not recommend SEO or scaling changes unless they block the
   deployment goal.
6. **Implement only when requested.** Make focused fixes that preserve local
   development. Update both README language versions if startup, target,
   services, ports, proxy, or configuration requirements change. Do not
   deploy, push images, modify cloud resources, or trigger a release without
   explicit approval.

## Expected Output

Return a concise deployment-readiness report with:

1. **Target and topology** — what was evaluated and where.
2. **Checks and evidence** — a table with check, result (`PASS`, `FAIL`, or
   `NOT RUN`), and observable evidence/command.
3. **Blockers and risks** — ranked, with confirmed vs unverified clearly
   labeled.
4. **Changes made** — files changed, or “none” for an audit-only request.
5. **Next action** — the smallest required step; never say it is deployed unless
   a deployment was actually performed and verified.

## Acceptance Criteria

A task using this skill is complete only when:

- The report names the target environment and deployment topology (or marks
  them unknown).
- Every claimed passing check has command output or HTTP evidence; unrun checks
  are explicitly marked `NOT RUN`.
- Docker Compose parses when it is part of the target deployment.
- The applicable frontend/backend build and test checks are reported accurately.
- Runtime API reachability is tested from the deployed frontend path when
  feasible; otherwise, that limitation is a blocker or unverified risk.
- Development-only behavior is not presented as production-ready without an
  explicit rationale and evidence.
- No secret values are exposed, and no live deployment occurs without approval.
- Related startup/configuration documentation is kept synchronized if code or
  deployment behavior changes.
