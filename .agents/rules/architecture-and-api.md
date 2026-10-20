# Regla: arquitectura y contratos de API

## Nombre
Arquitectura y contratos entre frontend y backend.

## Alcance
Cambios en endpoints, parámetros, modelos/respuestas, tipos financieros y flujo de datos del dashboard.

## Justificación
- `backend/app/routes.py` define los modelos Pydantic, los valores admitidos y las rutas de la API.
- `frontend/src/lib/financial-types.ts` vuelve a declarar los tipos usados por la interfaz.
- `frontend/src/App.tsx` consume `/api/metrics`, calcula KPIs y datos mensuales, y compone el dashboard.
- `docker-compose.yml` llama `backend` al servicio de API; `frontend/vite.config.ts` proxyea `/api` a `http://backend:8000`.

## Guía específica
1. Al cambiar un campo o valor de API, sincroniza el modelo Pydantic, el tipo TypeScript, los consumidores y las pruebas relacionadas.
2. Comprueba la firma del endpoint exacto antes de usar filtros; no asumas que todos aceptan los mismos parámetros. Por ejemplo, `get_metrics_summary` acepta `business_type`, pero `get_metrics` no lo declara.
3. Al añadir una ruta o métrica, conecta explícitamente la petición, transformación y presentación frontend; una ruta nueva no se integra sola.
4. Si cambias nombre o puerto del servicio backend, revisa el proxy de Vite, Compose y README en español e inglés.
5. No describas los datos como persistentes ni de base de datos mientras `generate_mock_movements(seed=42)` siga siendo la fuente y Compose no tenga un servicio de persistencia.
