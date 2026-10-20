# Regla: documentación y experiencia de desarrollo

## Nombre
Documentación ejecutable y flujo local de desarrollo.

## Alcance
Cambios de instrucciones de ejecución, servicios, puertos, proxy, alias de imports, origen de datos o periodo visible del dashboard.

## Justificación
- `README.es.md` y `README.md` documentan `docker compose up --build` y URLs locales.
- `docker-compose.yml` y `frontend/Dockerfile`/`backend/Dockerfile` establecen servicios y puertos.
- `frontend/tsconfig.app.json` asigna `@/*` a `./src/*`; `frontend/vite.config.ts` configura el mismo alias.
- `frontend/src/App.tsx` usa `VITE_API_BASE_URL ?? ""`, muestra el periodo fijo `2024 - Full Year` y consulta `/api/metrics`.
- `backend/app/routes.py` genera fechas basadas en `date.today()`.

## Guía específica
1. Si cambia el modo de arranque, servicio, puerto o proxy, actualiza los README español e inglés y alinea lo documentado con Compose y Dockerfiles.
2. Conserva sincronizados el alias `@/` de TypeScript y Vite si se modifica su destino.
3. En el desarrollo local, mantén coherente el uso de `/api`, el proxy Vite y `VITE_API_BASE_URL`; documenta cualquier requisito adicional.
4. Si el rango o fuente de datos cambia, revisa el periodo fijo que `App.tsx` pasa a `DashboardHeader`.
5. Describe los datos como mock mientras las rutas sigan llamando a `generate_mock_movements` y no exista almacenamiento configurado.
