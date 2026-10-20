# Regla: pruebas y validación

## Nombre
Pruebas de comportamiento y validación antes de entregar.

## Alcance
Cambios en cálculos financieros del frontend, generación/filtrado de datos, endpoints y contratos de respuesta.

## Justificación
- `frontend/src/lib/financial-utils.test.ts` comprueba KPIs, agregación mensual y formateadores.
- `backend/tests/test_routes.py` comprueba la generación de movimientos, filtros, rutas B2B/B2C, resúmenes, categorías, comparación y alertas.
- `frontend/package.json` declara `npm test`, `npm run lint` y `npm run build`; el build ejecuta `tsc -b && vite build`.

## Guía específica
1. Si cambias cálculos o formato financiero, añade o adapta pruebas en `financial-utils.test.ts`.
2. Si cambias endpoints, filtros, campos o respuestas, añade o adapta pruebas en `backend/tests/test_routes.py`.
3. Si cambias `generate_mock_movements`, verifica los supuestos cubiertos por tests: 360 registros, orden cronológico y límites inclusivos de fechas.
4. Ejecuta las validaciones pertinentes. Para frontend: `npm test`, `npm run lint` y `npm run build` desde `frontend/`. Para backend: `pytest` desde `backend/`.
5. Informa qué comandos se ejecutaron y sus resultados; si no se ejecutaron, indícalo claramente en vez de afirmar que pasaron.
