# Verificación y resumen del proyecto

Registro breve de comprobaciones basadas en los archivos del repositorio y de commits efectivamente ejecutados. Mantener este archivo actualizado cuando haya nuevas verificaciones o commits.

## Correcciones y evidencia del 2026-11-03

Entorno: Codespaces Linux; imagen `dashboard-frontend-check`, target
`production`, Nginx en `http://localhost:8080`, API mock local de Compose en
`http://localhost:8000`. No es un despliegue externo ni una validación de un
backend productivo: el backend de Compose conserva debugpy y recarga.

| Comprobacion | Resultado | Evidencia ejecutada |
|---|---|---|
| Ubicacion de las cinco skills | PASS | `mv .agents/skills .skills`; cinco `SKILL.md` directos en `.skills/*/`; ruta anterior ausente. Referencias de AGENTS, README, skill de despliegue y memoria actualizadas. |
| Build frontend de produccion | PASS | `docker build --target production -t dashboard-frontend-check ./frontend`; incluye `tsc -b && vite build`. |
| Compose | PASS | `docker compose config --quiet`. |
| Sintaxis Nginx generada | PASS | `docker exec dashboard-production-audit nginx -t`: syntax is ok / test is successful. |
| Salud de API | PASS | `GET http://localhost:8000/health`: 200, `application/json`. |
| HTML y fallback SPA | PASS | `GET http://localhost:8080/` y `/comparison`: 200, `text/html`. |
| Proxy de produccion | PASS | Desde `http://localhost:8080`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/alerts?threshold=0.3` y `/api/metrics/summary?business_type=B2B`: 200 y `application/json`; movimientos contiene 360 registros. |
| Conservacion de query | PASS | `/api/metrics?start_date=1900-01-01&end_date=1900-01-02` devuelve `[]`, comprobado mediante `assert.deepEqual`. |
| Formato de cambios | PASS | `git diff --check`. |
| Teclado | PASS en alcance | Chromium en escritorio y movil: Tab/Shift+Tab recorren ambas vistas sin trampas; Enter/Espacio cambian vista y abren/cierran tablas; foco visible de 2px incluido calendario nativo; flechas en graficos mantienen foco. ArrowUp dos veces actualiza umbral a 0.32 sin perder foco. ArrowRight desplaza ambas tablas B2B/B2C en movil. |
| ARIA | PASS en alcance | Cuatro auditorias axe sin infracciones; referencias aria-labelledby/describedby/controls existentes, nombres de controles y graficos comprobados en DOM y arbol accesible. Captura del arbol en el informe JSON. |
| Alt y alternativas | PASS en alcance | Cero elementos img renderizados, por lo que alt de img no aplica. Los SVG expuestos como imagen/aplicacion tienen nombre; graficos con descripciones y tablas de datos alternativas. No equivale a una prueba con lector de pantalla fisico. |
| Contraste WCAG AA | PASS en muestras | Texto/ejes/leyendas >=5.18:1; bordes de campos >=3.90:1; foco/tarjeta 15.84:1; series graficas >=5.11:1. Los nodos de contraste incompletos de axe se revisaron mediante colores computados y fondo solido de tarjeta; ver detalle abajo. |
| Axe y Chromium | PASS en alcance | Chromium 156.0.8078.4, Playwright 1.64.1, axe-core 4.14.0. Resumen y Comparativa a 1440x1000 y 390x844: cero infracciones automaticas. Informe y dos capturas en `artifacts/accessibility/`. |
| Lint y pruebas frontend | PASS | `docker run --rm dashboard-frontend-build-check npm run lint`; `docker run --rm dashboard-frontend-build-check npm test`: 3 archivos, 12 pruebas aprobadas. No se crearon pruebas nuevas. |

### Causa y reproduccion del proxy

El primer smoke test reprodujo el timeout. Una peticion directa desde el
contenedor a `http://host.docker.internal:8000/health` devolvio 200, mientras
Nginx registro `recv() failed (111: Connection refused) while resolving,
resolver: 127.0.0.11:53`. El resolver forzado de `proxy_pass` con variable no
utilizaba la entrada de `/etc/hosts` creada por `--add-host`.

Se utiliza ahora la plantilla nativa de la imagen Nginx con `API_UPSTREAM`
(predeterminado `backend:8000`) y resolucion del sistema al arrancar. La ruta
y la query se conservan. El backend debe ser resoluble antes de arrancar
Nginx; si cambia su IP, reiniciar o recargar Nginx.

Comandos de la topologia que paso el smoke test:

```bash
docker compose up -d backend
docker build --target production -t dashboard-frontend-check ./frontend
docker run -d --name dashboard-production-audit -p 8080:80 \
	--add-host host.docker.internal:host-gateway \
	-e API_UPSTREAM=host.docker.internal:8000 dashboard-frontend-check
docker exec dashboard-production-audit nginx -t
curl --fail --max-time 10 -i http://localhost:8000/health
curl --fail --max-time 10 -i http://localhost:8080/api/metrics
curl --fail --max-time 10 -i \
	'http://localhost:8080/api/metrics?start_date=1900-01-01&end_date=1900-01-02'
```

Las respuestas se comprobaron con Node `fetch`, limite de 10 segundos y
`node:assert/strict`: HTTP 200, tipo de contenido, JSON parseable, 360 registros
y rango vacio. La red compartida con `API_UPSTREAM=backend:8000` no se probo.
No se ejecutaron suites backend: no se modifico el backend. Lint y pruebas
frontend se ejecutaron una vez; el build final de produccion vuelve a validar
TypeScript tras los ajustes CSS.

### Accesibilidad: continuacion autorizada y evidencia

Tras el bloqueo inicial por bibliotecas ausentes, se completo Chromium con
`libdrm2`, `libdrm-common` y `libxi6`, extraidos solo en `/tmp/dashboard-audit`.
No se instalaron dependencias de auditoria en el proyecto ni paquetes del
sistema con privilegios.

- [Informe generado](artifacts/accessibility/report.json): fecha UTC,
  versiones, viewports, reglas aprobadas, nodos incompletos, colores sRGB,
  ratios, referencias ARIA, arbol accesible y recorrido de teclado por vista.
- [Resumen en escritorio](artifacts/accessibility/desktop-overview.png).
- [Comparativa en movil](artifacts/accessibility/mobile-comparison.png).

Defectos reproducidos y corregidos:

1. `key={threshold}` remontaba el input y dejaba el foco en body con ArrowUp.
	Se elimino la clave; ArrowUp repetido conserva foco y actualiza 0.30 a 0.32.
2. Bordes de campos con 1.21:1 frente a tarjeta y 1.30:1 frente a fondo.
	Se ajusto `--input` oscuro; ratios finales 3.90:1 y 4.15:1.
3. Ejes SVG resolvian `--color-muted-foreground` del tema raiz claro.
	Ahora usan `--muted-foreground` del tema activo y alcanzan 5.18:1.
4. El boton interno de calendario no activaba `:focus-visible` en el input.
	Se anadio `input[type="date"]:focus-within`, conservando contorno de 2px.
	`color-scheme: dark` hace perceptible el icono del calendario nativo.

Procedimiento ejecutado con Playwright/Chromium sobre la imagen de produccion:

1. Abrir la URL local, esperar los datos y auditar Resumen con las tablas
	alternativas desplegadas; navegar a Comparativa y auditar su contenido.
	Repetir a 1440x1000 y 390x844 con tags WCAG A/AA 2.0, 2.1 y 2.2 de axe.
2. Inspeccionar IDs referenciados por ARIA y nombres/alternativas de SVG en el
	DOM; guardar `locator('main').ariaSnapshot()` en el informe.
3. Recorrer ambas vistas con Tab hasta regresar al primer boton. Comprobar
	contorno solido >=2px y elemento dentro del viewport en cada parada.
	Activar navegacion y summary con Enter/Espacio y regresar con Shift+Tab.
4. Probar flechas de los graficos, ArrowUp repetido en umbral y ArrowRight
	en regiones B2B/B2C a ancho movil; comprobar foco, valor y scrollLeft.
5. Convertir colores OKLCH computados a sRGB con canvas de Chromium, calcular
	luminancia relativa WCAG y comparar contra el fondo solido de tarjeta.
	Texto >=4.5:1; foco, limites de controles y series >=3:1.

| Muestra | Ratio final |
|---|---|
| Texto principal / fondo | 16.89:1 |
| Texto secundario, ejes y leyenda / tarjeta | 5.18:1 |
| Borde input / fondo y tarjeta | 4.15:1 / 3.90:1 |
| Contorno de foco / tarjeta | 15.84:1 |
| Series ingresos, egresos y beneficio / tarjeta | 5.11:1 / 6.05:1 / 6.38:1 |

axe conserva 24 nodos `color-contrast` incompletos en Resumen escritorio y
43 en movil con las tablas abiertas: no pudo determinar fondos de nodos SVG
y contenido relacionado. No se ocultan ni se presentan como aprobados por
axe; la revision adicional usa el fondo uniforme y los ratios registrados.
Comparativa no presenta nodos incompletos. No hubo errores JavaScript.

Alcance limitado a estas vistas cargadas y controles: no se certifica
conformidad WCAG completa ni se han recorrido estados de error/vacio, todos
los navegadores, zoom elevado o un lector de pantalla fisico.

## Resumen verificado

- ✅ **Verificada en código:** El proyecto es un dashboard de métricas financieras. El frontend presenta indicadores de ingresos, egresos, beneficio y margen de beneficio, además de gráficos mensuales de ingresos/egresos y margen (`frontend/src/App.tsx`, `frontend/src/components/dashboard/`, `frontend/src/lib/financial-utils.ts`).
- ✅ **Verificada en código:** El backend genera movimientos financieros de ejemplo de forma determinista con `seed=42`; no se encontró una base de datos configurada en los servicios Compose (`backend/app/routes.py`, `docker-compose.yml`).
- ✅ **Verificada en código:** La API declara endpoints para estado, movimientos, facets/opciones de filtros, resumen, categorías principales, comparación, alertas y movimientos B2B/B2C (`backend/app/routes.py`).
- ✅ **Verificada en código:** El dashboard solicita `GET /api/metrics`, calcula KPIs y series mensuales en el frontend y permite filtrar opcionalmente por fechas `start_date` y `end_date` (`frontend/src/App.tsx`, `frontend/src/lib/financial-utils.ts`).
- ✅ **Verificada en código:** El dashboard consulta `/api/metrics/facets` y muestra las fechas mínima y máxima disponibles junto a los inputs de fecha (`frontend/src/App.tsx`, `frontend/src/lib/financial-types.ts`).
- ✅ **Verificada en código:** Bajo los gráficos, el dashboard solicita `/api/metrics/alerts` con umbral configurable y el rango de fechas seleccionado; muestra outcome, media de todos los períodos anteriores disponibles, incremento y estado vacío explícito (`frontend/src/App.tsx`, `frontend/src/components/dashboard/alerts-table.tsx`, `backend/app/routes.py`).
- ✅ **Verificada en código:** Las alertas comparan cada período con el promedio de todos los períodos anteriores disponibles en el historial completo; el endpoint restringe el umbral a `0.01`–`1.0` (`backend/app/routes.py`).
- ✅ **Verificada en código:** La navegación del dashboard incluye una página de comparativa B2B/B2C. La página solicita las cinco categorías de ingreso por grupo y el resumen mensual de ingresos de cada grupo, aplica el rango seleccionado y presenta dos tablas y un gráfico comparativo (`frontend/src/App.tsx`, `frontend/src/components/dashboard/business-comparison-page.tsx`, `backend/app/routes.py`).
- ✅ **Verificada en código:** La página comparativa contrasta las categorías recibidas con las categorías expuestas en facets y calcula el porcentaje sobre los ingresos totales del grupo, no sobre el subtotal de las cinco categorías (`frontend/src/components/dashboard/business-comparison-page.tsx`, `frontend/src/lib/business-comparison.ts`).

## Conexión entre componentes

- ✅ **Verificada en código:** En la carga de la aplicación, `frontend/index.html` carga `src/main.tsx`, que monta el componente `App` (`frontend/index.html`, `frontend/src/main.tsx`).
- ✅ **Verificada en código:** `App.tsx` consulta `/api/metrics/facets` para cargar el rango disponible, `/api/metrics` para obtener movimientos y `/api/metrics/alerts` para alertas; las dos últimas peticiones reciben las fechas seleccionadas cuando existen (`frontend/src/App.tsx`, `frontend/src/lib/date-range.ts`).
- ✅ **Verificada en código:** La página de comparación solicita `/api/metrics/categories/top` y `/api/metrics/summary` para cada grupo B2B/B2C; ambas peticiones llevan fechas opcionales, y categorías se constriñen con las facets disponibles (`frontend/src/components/dashboard/business-comparison-page.tsx`, `frontend/src/lib/date-range.ts`).
- ✅ **Verificada en configuración:** El proxy de Vite reenvía `/api` a `http://backend:8000`, y Compose nombra al servicio API `backend` (`frontend/vite.config.ts`, `docker-compose.yml`).
- ✅ **Verificada en código:** El backend arranca la aplicación FastAPI en `app.main:app`; `main.py` incluye el router implementado en `app/routes.py` (`backend/Dockerfile`, `backend/app/main.py`).
- ❌ **Incorrecta:** Afirmar que los datos provienen de una base de datos; el backend inspeccionado genera datos de muestra y Compose no define servicio de base de datos.
- ❓ **Sin verificar:** La disponibilidad efectiva de los servicios en ejecución no se comprobó en este registro mediante una sesión activa del dashboard.

## Cómo ejecutar

- ✅ **Verificado en README y Compose:** Desde la raíz, iniciar los dos servicios con:

	```bash
	docker compose up --build
	```

- ✅ **Verificado en Compose y documentación:** Frontend en `http://localhost:5173`; backend en `http://localhost:8000`; documentación interactiva FastAPI en `http://localhost:8000/docs`.
- ✅ **Verificado en Dockerfiles:** El contenedor frontend inicia Vite; el backend inicia Uvicorn con recarga y `debugpy` escuchando en el puerto `5678`.
- ✅ **Verificado en README y configuración:** El proxy `/api` sirve como conexión predeterminada en desarrollo; `VITE_API_BASE_URL` permite proporcionar una base alternativa. No se comprobó una configuración de producción.
- ❓ **Sin verificar:** Para el filtro de fechas, las alertas y la página comparativa se ejecutaron desde `frontend/` `npm test`, `npm run lint` y `npm run build`, pero no pudieron ejecutarse porque las dependencias Node no están instaladas (`vitest`, `eslint` y `tsc` no encontrados). `python -m compileall -q app tests` desde `backend/` y `git diff --check` finalizaron sin errores. `pytest` no pudo recolectar pruebas porque falta `fastapi` en el entorno. No se afirma que las suites pasen.

## Historial de commits ejecutados

Historial local observado el **2026-10-20** con `git log --format='%h %s' --all`, ordenado del más reciente al más antiguo. Incluye los commits visibles en las referencias locales en ese momento; no anticipa commits posteriores.

- `0820536` — `creando un memory bank` (HEAD al revisar).
- `c3009ed` — `implementando reglas del repositorio`.
- `b7128d0` — `notas de analisis y propuesta de reglas`.
- `1b3a0b2` — `comprendiendo el handover y verificacion`.
- `56c6e52` — `verificacion de proyecto`.
- `954f812` — `Merge pull request #1 from deimianvasquez/main`.
- `eeece05` — `feat: use Vite API proxy and document frontend env setup`.
- `f0812fa` — `Update Spanish README with corrected link for project initiation instructions.`
- `291f2db` — `.agents folder structure in Readme`.
- `4510e15` — `Enhance documentation for agents and project structure.`
- `cfd18e4` — `Update repo slug`.
- `87e1942` — `Refactor list comprehensions for clarity in movement filtering.`
- `0c07552` — `Add anomaly alerts endpoint based on outcome spikes.`
- `5df15b4` — `Add period-over-period comparison endpoint for net movement.`
- `be510b5` — `Add top categories endpoint for ranked financial drivers.`
- `2b5c237` — `Add period summary endpoint for financial aggregates.`
- `959bc84` — `Add metrics facets endpoint for discoverable filters.`
- `c061621` — `Add operation and category filters to metrics endpoints.`
- `cbd20dc` — `Adapt readmes`.
- `c5dc883` — `Remove extra content in Readme`.
- `04e8d8a` — `AGENTS.md with default guidelines for rules and context.`
- `fb7dd96` — `docs: clarify project objectives and setup steps`.
- `a8d30bf` — `Fix config issues`.
- `9c3e480` — `chore: Ensure dates are generated in the correct order`.
- `e267908` — `Fix: Graphs showing months in right order`.
- `29ebca4` — `Frontend tests`.
- `df43669` — `Backend tests`.
- `91978e0` — `Move endpoints to routes.py`.
- `15ce4c2` — `Initial backend`.
- `7661fa1` — `Frontend from V0 with components and types`.
- `cc691b6` — `.gitignore`.
- `bb0a9c1` — `Initial config`.

> Este cambio actualiza el registro de commits en `verification.md`; su propio commit se añadirá cuando efectivamente se cree, sin anticipar su hash.

## Notas de PR

- ✅ **Verificado en Git:** `954f812` es un commit de merge con título de Pull Request #1.
- ❓ **Sin verificar:** No se revisaron la descripción del PR, comentarios de revisión, aprobaciones ni checks de CI. No inferirlos del mensaje del commit.
