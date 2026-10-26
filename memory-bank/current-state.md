# Estado actual comprobable

Estado redactado tras revisar el código y configuración del repositorio el **2026-10-20**. “Disponible en código” no significa que se haya probado en un entorno ejecutándose.

## Qué está implementado en código

- ✅ El frontend monta el dashboard React desde `frontend/src/main.tsx` y `frontend/src/App.tsx`.
- ✅ El dashboard solicita movimientos desde `/api/metrics`, obtiene los límites de fechas desde `/api/metrics/facets` y alertas desde `/api/metrics/alerts`; permite filtrar por fechas y configurar umbral de anomalías, calcula KPIs/series y muestra estados de carga, error y vacío (`frontend/src/App.tsx`, `frontend/src/components/dashboard/alerts-table.tsx`).
- ✅ La navegación local de `App.tsx` presenta Resumen y Comparativa B2B vs B2C. La comparativa usa top cinco categorías de ingreso y summary mensual segmentados por grupo, comparte las fechas y muestra tablas paralelas más un gráfico de ingresos totales (`frontend/src/App.tsx`, `frontend/src/components/dashboard/business-comparison-page.tsx`).
- ✅ FastAPI define `/health` y rutas `/api/metrics` para movimientos, facets, resumen, categorías principales, comparación, alertas y segmentos B2B/B2C (`backend/app/main.py`, `backend/app/routes.py`).
- ✅ El backend genera 360 movimientos mock con semilla `42`; una prueba comprueba cantidad y orden cronológico (`backend/app/routes.py`, `backend/tests/test_routes.py`).
- ✅ Hay pruebas de utilidades financieras frontend y pruebas de rutas backend (`frontend/src/lib/financial-utils.test.ts`, `backend/tests/test_routes.py`).
- ✅ Compose define `frontend` y `backend`; los README documentan `docker compose up --build` (`docker-compose.yml`, `README.es.md`, `README.md`).

## Gaps observables en el código actual

Estos puntos describen diferencias o límites del código revisado; no se presentan como compromisos de roadmap.

- ✅ Los metadatos estáticos describen el dashboard como demostración y desaconsejan su indexación (`frontend/index.html`).
- ✅ La decisión SEO prioriza evitar que una SPA de métricas mock y contenido principalmente interactivo se presente como una página de información financiera indexable. No se añaden sitemap ni URL canónica porque no hay un dominio de producción ni páginas públicas estables documentadas (`frontend/index.html`, `backend/app/routes.py`).
- ✅ El rastreo SEO de la URL temporal de vista previa `app.github.dev` (2026-10-26) recibió una redirección a `github.dev/pf-signin` y analizó la página de inicio de sesión de GitHub, no el frontend. Por ello, sus hallazgos de título, H1, descripción y canonical no son evidencia sobre los metadatos de esta aplicación; la vista previa no resultó públicamente rastreable desde ese crawler.
- ✅ Se añadió una skill local `deployment-readiness` porque faltaba un flujo repetible para diferenciar builds de despliegue verificado: Compose usa Vite en desarrollo, el backend arranca con `debugpy`/`--reload` y la imagen estática de producción solo cubre el frontend. Las skills comunitarias instaladas consultadas cubren SEO, rendimiento y accesibilidad, no la coherencia de este stack Docker específico (`.agents/skills/deployment-readiness/SKILL.md`, `docker-compose.yml`, `frontend/Dockerfile`, `backend/Dockerfile`).
- ✅ `frontend/src/App.tsx` consulta `/api/metrics`, `/api/metrics/facets` y `/api/metrics/alerts`; la página comparativa consume además `/api/metrics/categories/top` y `/api/metrics/summary` (`frontend/src/components/dashboard/business-comparison-page.tsx`).
- ✅ La API soporta más filtros y análisis de los que aparecen en el dashboard actual (como resumen, comparación, alertas y B2B/B2C), según las rutas en `backend/app/routes.py` frente a `frontend/src/App.tsx`.
- ✅ Los datos proceden de un generador mock y no hay servicio ni configuración de persistencia en `docker-compose.yml` (`backend/app/routes.py`, `docker-compose.yml`).
- ✅ El periodo del encabezado es fijo (`2024 - Full Year`) mientras la generación de datos depende de `date.today()` (`frontend/src/App.tsx`, `backend/app/routes.py`).
- ✅ CORS permite todos los orígenes en `backend/app/main.py`; se registra como configuración actual, sin afirmar que sea apropiada para producción.
- ❓ No se encontró una prueba de integración end-to-end que recorra navegador → proxy → API en los archivos de pruebas revisados (`frontend/src/lib/financial-utils.test.ts`, `backend/tests/test_routes.py`). La ausencia se limita al conjunto de archivos inspeccionados.

## Verificaciones pendientes, no roadmap

- ❓ No se ejecutaron pruebas, lint o builds al crear este banco de memoria; no se conoce por este documento si pasan actualmente. Los scripts frontend están declarados en `frontend/package.json`; backend usa Pytest y tiene `backend/tests/test_routes.py`.
- ❓ No se verificó mediante ejecución que Docker construya y levante correctamente todos los servicios.
- ❓ No se definieron prioridades futuras, fechas ni roadmap; cualquier prioridad de producto requiere confirmación explícita del equipo.
