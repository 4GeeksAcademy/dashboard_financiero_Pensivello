# Stack tecnológico

## Lenguajes y frameworks

- ✅ **Frontend:** TypeScript y React; punto de entrada Vite, con configuración en `frontend/package.json`, `frontend/vite.config.ts` y `frontend/src/main.tsx`.
- ✅ **Backend:** Python 3.13, FastAPI y Uvicorn, según `backend/Dockerfile`, `backend/requirements.txt` y `backend/app/main.py`.

## Dependencias clave

- ✅ **Frontend de interfaz y gráficos:** `react`, `react-dom` y `recharts` están en `frontend/package.json`; los gráficos actuales importan de `recharts` en `frontend/src/components/dashboard/`.
- ✅ **Estilos y build:** Tailwind CSS con plugin de Vite, `@tailwindcss/vite`, está declarado en `frontend/package.json` y usado en `frontend/vite.config.ts`; estilos de la aplicación están en `frontend/src/index.css`.
- ✅ **Iconos y utilidades UI:** `lucide-react`, `clsx`, `tailwind-merge` y `class-variance-authority` aparecen entre las dependencias frontend (`frontend/package.json`).
- ✅ **Backend/API:** `fastapi` y `uvicorn[standard]` están en `backend/requirements.txt`; `pydantic` se usa para modelos en `backend/app/routes.py` y viene asociado al framework, pero no aparece como línea explícita independiente en requirements.
- ✅ **Depuración y pruebas backend:** `debugpy`, `pytest`, `pytest-cov` y `httpx` están en `backend/requirements.txt`; las pruebas de API usan `TestClient` en `backend/tests/test_routes.py`.
- ✅ **Pruebas frontend:** Vitest y `@vitest/coverage-v8` están en `frontend/package.json`; tests en `frontend/src/lib/financial-utils.test.ts` usan Vitest.
- ✅ **Lint y tipos:** ESLint, TypeScript ESLint y TypeScript aparecen en `frontend/package.json`; configuración de ESLint en `frontend/eslint.config.js`.

## Infraestructura y tooling

- ✅ **Contenedores:** Docker Compose coordina `frontend` y `backend` (`docker-compose.yml`); hay Dockerfile separado por servicio.
- ✅ **Puertos publicados:** frontend `5173`, API `8000` y debug backend `5678` (`docker-compose.yml`).
- ✅ **Proxy de desarrollo:** Vite pasa `/api` al backend `http://backend:8000` (`frontend/vite.config.ts`).
- ✅ **Alias de imports:** `@/` apunta a `frontend/src` en `frontend/tsconfig.app.json` y `frontend/vite.config.ts`.

## Ausencias comprobadas en la configuración revisada

- ✅ No hay servicio de base de datos ni caché en `docker-compose.yml`.
- ✅ No se encontró dependencia frontend para cliente de servidor externa como Axios; la llamada visible usa `fetch` nativo en `frontend/src/App.tsx`.
- ✅ No se encontró configuración de despliegue de producción en los archivos inspeccionados; Dockerfiles usan Vite dev server y Uvicorn con `--reload` (`frontend/Dockerfile`, `backend/Dockerfile`).
