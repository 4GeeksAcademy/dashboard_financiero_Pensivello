# Overview del producto

## Propósito comprobable

El repositorio implementa un panel web de métricas financieras. El README lo describe como “Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI” (`README.es.md`). El código visible concreta ese alcance de la siguiente forma:

- ✅ El dashboard muestra tarjetas KPI de ingresos, egresos, beneficio y margen de beneficio (`frontend/src/components/dashboard/kpi-row.tsx`).
- ✅ Muestra una serie mensual de ingresos frente a egresos y otra de margen de beneficio (`frontend/src/components/dashboard/income-outcome-chart.tsx`, `frontend/src/components/dashboard/profit-percent-chart.tsx`).
- ✅ Obtiene movimientos de `GET /api/metrics`, el rango de fechas de `/api/metrics/facets` y alertas de `/api/metrics/alerts`; permite filtrar por fechas, configurar el umbral de anomalías y calcula KPIs/agregaciones mensuales en el frontend (`frontend/src/App.tsx`, `frontend/src/lib/financial-utils.ts`, `frontend/src/components/dashboard/alerts-table.tsx`).
- ✅ Incluye una página de comparativa B2B/B2C que, con el mismo rango de fechas, consume las categorías top de ingreso y el summary de ingresos por grupo; presenta las tablas de categorías y un gráfico único de totales (`frontend/src/components/dashboard/business-comparison-page.tsx`, `frontend/src/lib/date-range.ts`).
- ✅ El backend ofrece endpoints para movimientos, resumen agrupado, facets, categorías principales, comparación, alertas y movimientos B2B/B2C (`backend/app/routes.py`).
- ✅ Los movimientos los genera `generate_mock_movements(seed=42)`; no se encontró almacenamiento persistente ni servicio de base de datos en `docker-compose.yml` (`backend/app/routes.py`, `docker-compose.yml`).

## Flujo de ejecución y conexión

1. ✅ `frontend/index.html` carga `frontend/src/main.tsx`; este monta `App` (`frontend/index.html`, `frontend/src/main.tsx`).
2. ✅ `App` solicita `/api/metrics`, convierte la respuesta a KPIs y datos mensuales, y pasa los valores a los componentes (`frontend/src/App.tsx`).
3. ✅ Vite proxyea `/api` a `http://backend:8000`; Compose define el servicio backend con ese nombre (`frontend/vite.config.ts`, `docker-compose.yml`).
4. ✅ Uvicorn carga `app.main:app`; `backend/app/main.py` incluye el router definido en `backend/app/routes.py` (`backend/Dockerfile`, `backend/app/main.py`).

## Límites de lo que se puede afirmar

- No se puede afirmar que se trate de contabilidad oficial, un sistema de facturación, una herramienta de asesoría financiera o un producto multiusuario: esos propósitos no están respaldados por los archivos revisados.
- El dashboard no consume todos los endpoints analíticos disponibles; sus páginas usan movimientos, facets, alertas, top categorías y summary, mientras las rutas restantes no necesariamente tienen un consumidor visible.
- El encabezado pasa el periodo fijo `2024 - Full Year`, mientras que el generador backend calcula las fechas basándose en `date.today()` (`frontend/src/App.tsx`, `backend/app/routes.py`). Este dato se documenta como comportamiento observable, no como promesa de producto.
