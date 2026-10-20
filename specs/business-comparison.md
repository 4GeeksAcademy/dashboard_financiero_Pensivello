# Especificación: comparación de ingresos B2B y B2C

## Propósito

Añadir una vista del dashboard que permita comparar los ingresos de los grupos B2B y B2C para el rango opcional de fechas compartido con el resumen financiero.

## Resoluciones del contrato (PM wording frente a la API disponible)

| Wording de producto | Contrato observable en la API | Interpretación normativa de esta especificación |
| --- | --- | --- |
| “Cinco categorías principales” por grupo | `GET /api/metrics/categories/top` recibe `operation_type`, `limit` (1–20), fechas y `business_type`, y devuelve una lista de `TopCategoryItem`: `category`, `operation_type`, `total_amount`. La respuesta contiene las categorías encontradas y puede contener menos elementos que `limit`. | Mostrar **hasta cinco** categorías de ingreso que realmente devuelva la API para cada grupo. No rellenar filas ni prometer cinco resultados si hay menos categorías en el período. |
| “Las categorías disponibles para cada grupo deben obtenerse de facets” | `GET /api/metrics/facets` no acepta `business_type`, `operation_type` ni rango de fechas; `MetricsFacets.categories` es una lista global, no una lista por grupo. | Usar `facets.categories` solo como dominio global de categorías reconocidas. La pertenencia, el orden y los importes de las categorías de cada grupo provienen de `/api/metrics/categories/top` con `business_type=B2B` o `B2C` y `operation_type=income`. No describir facets como segmentadas por grupo. |
| “Porcentaje sobre el total del grupo” | El endpoint top devuelve `total_amount` por categoría, no una proporción. `/api/metrics/summary` acepta `group_by`, fechas, `operation_type` y `business_type`; cada elemento contiene `period`, `income`, `outcome`, `net`. | Calcular el denominador como la suma de `income` de todos los períodos devueltos por el summary filtrado a ese grupo y rango. Para cada categoría: `total_amount / suma(income) * 100`. No dividir por la suma del top cinco ni usar `net` u `outcome`. Si el total de ingresos es cero, mostrar `0.0%`. |
| “Un gráfico de ingresos B2B vs B2C” | No existe un endpoint de gráfico/comparativa de ingresos brutos B2B/B2C. `/api/metrics/comparison` devuelve comparación de neto entre períodos y no satisface esta consulta. `/api/metrics/summary` sí puede segmentarse por `business_type` y filtrar `operation_type=income`. | Crear un único gráfico con dos totales, B2B y B2C, agregando los campos `income` de sus summaries filtrados. No utilizar `/api/metrics/comparison`, que informa neto y comparación temporal. |
| “Filtro de rango de fechas” | Tanto `/api/metrics/categories/top` como `/api/metrics/summary` aceptan `start_date` y `end_date` opcionales. El facet de fechas expone `min_date` y `max_date`. | Reutilizar el filtro compartido. Enviar cada extremo no vacío como `YYYY-MM-DD` a las dos consultas por grupo. Si un extremo se omite, mantenerlo omitido y aplicar el rango abierto permitido por la API. |

## Consultas y contratos requeridos

Para cada `business_type` en `B2B`, `B2C`:

1. Solicitar `GET /api/metrics/categories/top` con `operation_type=income`, `limit=5`, `business_type=<grupo>` y las fechas activas. La respuesta es `TopCategoryItem[]`.
2. Solicitar `GET /api/metrics/summary` con `group_by=month`, `operation_type=income`, `business_type=<grupo>` y las mismas fechas. La respuesta es `MetricsSummaryItem[]`; sumar el campo `income` para calcular el ingreso total del grupo dentro del rango.
3. Aplicar facets globales como validación del dominio de `category`; no tratarlas como una consulta de categorías por grupo.

Los nombres de campos de API permanecen en `snake_case`: `business_type`, `operation_type`, `start_date`, `end_date`, `total_amount`, `period`, `income`, `outcome`, `net`.

## Presentación

- La navegación presenta una vista de comparación distinta del resumen principal.
- Dos tablas, una para B2B y otra para B2C, se disponen en paralelo cuando el ancho lo permite.
- Cada tabla muestra categoría, ingreso (`total_amount`) y porcentaje sobre el ingreso total del grupo. La descripción puede exponer también el total del grupo.
- Debajo se muestra un solo gráfico que compara los ingresos totales de B2B y B2C para el rango seleccionado.
- Las cargas, errores y respuestas sin categorías deben ser distinguibles; una respuesta sin categorías muestra un estado vacío, no categorías inventadas.

## Convenciones de petición frontend

Seguir el patrón existente en `frontend/src/App.tsx`: `fetch` nativo, comprobar `response.ok` y rechazar respuestas HTTP no exitosas, decodificar JSON, pasar `AbortSignal` desde un `AbortController` creado en el efecto y evitar actualizar estado tras una cancelación. Mantener la construcción/serialización de query strings en utilidades frontend y usar el `API_BASE_URL` ya definido (`VITE_API_BASE_URL ?? ""`). Las consultas independientes para B2B/B2C y categorías/resumen pueden ejecutarse en paralelo; todos los parámetros deben corresponder a las firmas reales de los endpoints indicados arriba.

## Criterios de aceptación

- El cambio de fechas actualiza las tablas y el gráfico; se reenvía el mismo rango a top categories y summary de ambos grupos.
- Cada endpoint top se consulta con `operation_type=income`, `limit=5` y el `business_type` de la tabla.
- Se muestran entre cero y cinco categorías reales por grupo, sin asumir que facets ofrece listas segmentadas.
- El porcentaje usa `total_amount / suma(income del summary del mismo grupo y rango) * 100`.
- Hay una única visualización comparativa de ingresos brutos B2B y B2C, agregados del mismo summary usado para el denominador.
- La vista tiene estados distinguibles de carga, error y ausencia de categorías.
