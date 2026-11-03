# Financial Metrics Dashboard

<!-- hide -->

By [@marcogonzalo](https://github.com/marcogonzalo) and [other contributors](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) at [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_Estas instrucciones están [disponibles en español](./README.es.md)._

**Before you start**: 📗 [Read the instructions](https://4geeks.com/lesson/how-to-start-a-project) on how to start a coding project.

<!-- endhide -->

---

_Financial metrics dashboard with a React + TypeScript frontend and a FastAPI backend._

## Recommended steps

1. Fork this repository to your account.
2. Open your fork in GitHub Codespaces or clone it and run it in your local environment.
3. Run your AI agent to inspect both frontend and backend.
4. Document the proposed rules and memory bank in your fork.
5. Refine and validate the rules until they fit the project's real workflow.

## Expected agents directory structure

```text
./.agents
└─ /rules
   └─ <rule-name>.md
./.skills
   └─ /<skill-name>
      └─ /SKILL.md
```

## How to run locally

```bash
docker compose up --build
```

The frontend uses the Vite proxy for `/api` by default, so no extra environment variables are required in local development or Codespaces.
If you need to target a different backend origin, copy `frontend/.env.example` to `.env` and set `VITE_API_BASE_URL`.

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API documentation: http://localhost:8000/docs

## Production frontend image

The Docker Compose setup above keeps the Vite development server. To build the static production image:

```bash
docker build --target production -t dashboard-frontend ./frontend
docker compose up -d backend
docker run --rm -p 8080:80 --add-host host.docker.internal:host-gateway \
   -e API_UPSTREAM=host.docker.internal:8000 dashboard-frontend
```

The image serves optimized Vite assets with Nginx and supports SPA fallback. `API_UPSTREAM` configures the `/api/` proxy at startup without rebuilding; use `host:port`, without a scheme or path. The example uses the host-published backend port, like the Compose Vite proxy, for environments that block direct container traffic. On a shared Docker network that allows that traffic, use `--network <network>` and omit the variable to keep `backend:8000`. Preserve the `/api` prefix.

Smoke test from another terminal (expect HTTP 200 and JSON, not SPA HTML):

```bash
curl --fail --max-time 10 -i http://localhost:8000/health
curl --fail --max-time 10 -i 'http://localhost:8080/api/metrics?business_type=B2B'
```

The Compose backend retains `debugpy` and `--reload`: this example verifies the production frontend image against the local API, not a fully production-ready deployment.

---

This and many other projects are built by students as part of the [Career Programs](https://4geeksacademy.com/compare-programs) at [4Geeks Academy](https://4geeksacademy.com). By [@marcogonzalo](https://github.com/marcogonzalo) and [other contributors](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors). Find out more about [AI Engineering](https://4geeksacademy.com/en/coding-bootcamps/ai-engineering), [Data Science & Machine Learning](https://4geeksacademy.com/en/coding-bootcamps/data-science-ml), [Cybersecurity](https://4geeksacademy.com/en/coding-bootcamps/cybersecurity) and [Full-Stack Software Developer with AI](https://4geeksacademy.com/en/coding-bootcamps/full-stack-developer).
