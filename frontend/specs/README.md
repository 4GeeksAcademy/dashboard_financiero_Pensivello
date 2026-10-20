# Especificación funcional del frontend y contratos API

Esta guía describe las tres funcionalidades visibles, las rutas efectivamente consumidas por el frontend, sus contratos TypeScript y los límites/estados que debe contemplar la UI. Las rutas y restricciones se contrastaron con `backend/app/routes.py`; los consumidores, con `frontend/src/App.tsx`, `frontend/src/lib/date-range.ts` y `frontend/src/components/dashboard/business-comparison-page.tsx`.

> Los tipos de `api-types.ts` y `param-types.ts` son especificaciones TypeScript documentales; la implementación actual consume modelos frontend desde `src/lib/financial-types.ts`. No se afirma que los tipos de especificación estén importados por los componentes.

## Convenciones y límites transversales

- Query params se escriben en `snake_case`; props de React en `camelCase`.
- Los extremos de fecha son inclusivos en backend. Se serializan como `YYYY-MM-DD`; FastAPI valida que la cadena represente una fecha calendario válida.
- `start_date` y `end_date` son opcionales e independientes. Sin uno de ellos, no existe límite por ese extremo.
- El backend devuelve listas directamente para movimientos, alertas, categorías top y summary; no hay un objeto envelope.
- Para valores literales, se aplican los dominios declarados en `api-types.ts`: `OperationType = "income" | "outcome"`, `BusinessType = "B2B" | "B2C"`; `Category = "suppliers" | "sales" | "operational" | "administrative" | "others"`.
- Los contratos de parámetros reutilizables están en `param-types.ts`. El nombre `DateRangerFilter` (con “Ranger”) se conserva porque así está definido en el archivo.

## 1. Dashboard de resumen: filtro de fechas, KPIs y gráficos

### Qué hace

`App` consulta los facets globales y los movimientos para aplicar un rango opcional compartido. Calcula localmente KPIs y series mensuales de ingresos, egresos, beneficio y margen. El rango también se reutiliza en la funcionalidad de alertas y se pasa a la comparativa.

### Endpoints consumidos

| Método y ruta | Cuándo / parámetros enviados por frontend | Respuesta |
| --- | --- | --- |
| `GET /api/metrics/facets` | Al montar `App`; no envía query params. Proporciona límites de fecha y opciones globales. | `FacetsResponse` |
| `GET /api/metrics` | Al montar y cada vez que cambia el rango; envía `start_date` y/o `end_date` únicamente si tienen valor. | `FinancialMovementResponse[]` |

`/api/metrics/facets` no acepta una segmentación B2B/B2C ni parámetros de fechas en la implementación actual. Sus `min_date` y `max_date` definen el rango disponible global mostrado junto a los inputs.

### Tipos TypeScript de petición y respuesta

```ts
// param-types.ts
export interface DateRangerFilter {
  start_date?: ApiDateString;
  end_date?: ApiDateString;
}

export type ApiDateString = string; // YYYY-MM-DD; validez calendario comprobada por API

// api-types.ts — shape de cada movimiento de GET /api/metrics
export interface FinancialMovementResponse {
  create_date: string;
  amount: number;
  operation_type: OperationType;
  category: Category;
  business_type: BusinessType;
}

export type MovementsResponse = FinancialMovementResponse[];

// api-types.ts
export interface FacetsResponse {
  operation_types: OperationType[];
  business_types: BusinessType[];
  categories: Category[];
  min_date: string;
  max_date: string;
}
```

Los nombres `FinancialMovementResponse` y `MovementsResponse` se incluyen aquí para describir el contrato efectivo; no son aliases ya exportados por el `api-types.ts` actual. En runtime `App` tipa los movimientos con `FinancialMovement` de `src/lib/financial-types.ts` y los facets con `MetricsFacets` de ese mismo módulo.

### Parámetros y restricciones

| Parámetro | Tipo TS | Restricción del backend / comportamiento |
| --- | --- | --- |
| `start_date` | `ApiDateString` opcional | Fecha ISO `YYYY-MM-DD`, inclusiva. Sin valor, no se aplica mínimo. Debe ser fecha calendario válida. |
| `end_date` | `ApiDateString` opcional | Fecha ISO `YYYY-MM-DD`, inclusiva. Sin valor, no se aplica máximo. Debe ser fecha calendario válida. |
| `category` | `Category` opcional | Acepta las categorías literales del dominio; no lo envía el dashboard de resumen. |
| `operation_type` | `OperationType` opcional | `income` o `outcome`; no lo envía el dashboard de resumen. |

No hay restricción backend que exija ambos extremos, ni una validación explícita que rechace `start_date > end_date`; ese rango normalmente produciría una lista vacía. La UI limita la selección con `min_date`/`max_date` y relaciona el `min` de cada input con el otro extremo, pero no se debe convertir esto en una garantía de servidor.

### Casos límite y presentación esperada

1. **Sin fechas seleccionadas:** omitir ambos query params. Mostrar los límites disponibles en el texto “Rango disponible: min — max”, el período “All available dates”, y cargar el resumen completo.
2. **Solo un extremo seleccionado:** enviar solo el query correspondiente; tratar la fecha como límite inclusivo y reflejar el extremo ausente con `…` en el período del encabezado.
3. **Rango válido sin movimientos:** la API puede responder `[]`; mostrar KPIs como no disponibles (`—` según `KPIRow`) y ambos gráficos con “No data available to display”, no un gráfico con datos inventados.
4. **Error de movimientos o facets:** mostrar el mensaje de error de carga de información; mientras la respuesta está pendiente, tarjetas/gráficos presentan sus placeholders de carga. Si facets aún no llegó, mostrar “cargando…” para el rango disponible.

## 2. Alertas de anomalías de egresos

### Qué hace

El dashboard solicita alertas al cambiar threshold o rango. La API compara el outcome del período con la media de los tres períodos inmediatamente anteriores. El rango seleccionado filtra los períodos candidatos, pero el backend conserva la historia completa para formar la media móvil. La UI presenta período, outcome, baseline e incremento, junto con un control de umbral.

### Endpoint consumido

| Método y ruta | Parámetros enviados por frontend | Respuesta |
| --- | --- | --- |
| `GET /api/metrics/alerts` | `threshold` siempre; `start_date`/`end_date` cuando están establecidos. No envía `group_by` ni `business_type`, por lo que el backend usa `month` y todos los tipos de negocio. | `AlertsResponse` (array directo) |

### Tipos TypeScript de petición y respuesta

```ts
// param-types.ts
export interface AlertsParams extends DateRangerFilter {
  threshold?: number;
}

// api-types.ts
export interface AlertEntry {
  period: string;
  outcome_total: number;
  baseline_average: number;
  increase_ratio: number;
}
export type AlertsResponse = AlertEntry[];
```

### Parámetros y restricciones

| Parámetro | Tipo TS | Valor válido / default |
| --- | --- | --- |
| `threshold` | `number` opcional en `AlertsParams` | API default `0.3`; mínimo `0.01`, máximo `1.0`, ambos inclusivos. El frontend usa `0.3` inicial y envía el parámetro explícitamente. La UI valida en edición y normaliza al perder foco. |
| `start_date` | `ApiDateString` opcional | Fecha calendario `YYYY-MM-DD`, inclusiva; no enviada si está vacía. |
| `end_date` | `ApiDateString` opcional | Fecha calendario `YYYY-MM-DD`, inclusiva; no enviada si está vacía. |
| `group_by` | `"day" \| "week" \| "month"` opcional en API | API default `"month"`; el frontend no lo incluye y por tanto usa mensual. |
| `business_type` | `BusinessType` opcional en API | `"B2B"` o `"B2C"`; el frontend no lo incluye y por tanto agrega ambos grupos. |

El backend solo añade alerta si la media baseline es positiva y el incremento relativo es **estrictamente mayor** que `threshold`. No hay alerta antes de que existan tres períodos precedentes en la historia.

### Casos límite y presentación esperada

1. **Menos de cuatro períodos históricos o baseline igual a cero:** la API devuelve `[]` para esos períodos; mostrar “No se detectaron anomalías para el umbral y rango seleccionados.” No crear una baseline artificial ni una alerta.
2. **Incremento exactamente igual al umbral:** al ser la comparación estricta (`increase_ratio > threshold`), no aparece fila; la UI muestra el estado vacío si no hay otras alertas.
3. **Rango seleccionado contiene un período con alerta, pero los tres anteriores caen fuera del rango:** la API conserva el historial necesario para calcular baseline y puede devolver la alerta del período filtrado. La tabla muestra el outcome del período seleccionado y la media de los tres períodos históricos.
4. **Umbral fuera del rango o respuesta fallida:** API rechaza `threshold < 0.01` o `> 1.0` (HTTP 422); el control UI restringe/normaliza el valor y no debería emitir un valor inválido al callback. Si falla la petición, mostrar el error de alertas en la tabla; error prevalece sobre carga y filas.

## 3. Comparación B2B vs B2C

### Qué hace

La página comparativa reutiliza el rango superior, obtiene hasta cinco categorías de ingreso para cada grupo, calcula la proporción frente al ingreso total del grupo y muestra un único gráfico con ingresos agregados B2B y B2C. Las facets son globales; los resultados de top categorías sí se filtran por grupo. La decisión de cálculo y la diferencia respecto de `/comparison` están descritas en `business-comparison.md`.

### Endpoints consumidos

Para cada `business_type` (`B2B` y `B2C`) la página envía en paralelo:

| Método y ruta | Parámetros enviados por frontend | Respuesta |
| --- | --- | --- |
| `GET /api/metrics/categories/top` | `operation_type=income`, `limit=5`, `business_type` y fechas no vacías. | `TopCategoriesResponse` (array directo, puede contener menos de 5 elementos). |
| `GET /api/metrics/summary` | `group_by=month`, `operation_type=income`, `business_type` y fechas no vacías. | `SummaryResponse` (array directo, puede ser vacío). |

La página usa además `availableCategories` que recibe de los facets ya obtenidos por `App`; no vuelve a consultar `/facets`.

### Tipos TypeScript de petición y respuesta

```ts
// param-types.ts
export interface TopCategoriesParams extends DateRangerFilter {
  operation_type?: OperationType;
  limit?: number;
  business_type?: BusinessType;
}

// Shape del query de summary empleado por la comparativa (no exportado actualmente)
export interface BusinessSummaryParams extends DateRangerFilter {
  group_by?: "day" | "week" | "month";
  operation_type?: OperationType;
  business_type?: BusinessType;
}

// api-types.ts
export interface CategoryEntry {
  category: Category;
  operation_type: OperationType;
  total_amount: number;
}
export type TopCategoriesResponse = CategoryEntry[];

// Shape de cada elemento de GET /api/metrics/summary
export interface SummaryEntry {
  period: string;
  income: number;
  outcome: number;
  net: number;
}
export type SummaryResponse = SummaryEntry[];
```

`BusinessSummaryParams`, `SummaryEntry` y `SummaryResponse` especifican la petición/respuesta real pero no están exportados hoy en `param-types.ts`/`api-types.ts`. La implementación usa el tipo local `MetricsSummaryItem` en `business-comparison-page.tsx` y `TopCategoryItem` de `src/lib/financial-types.ts`.

### Parámetros y restricciones

| Parámetro | Tipo TS | Valor válido / default |
| --- | --- | --- |
| `business_type` | `BusinessType` opcional en interfaces genéricas | Literal `"B2B"` o `"B2C"`; la página envía ambos en peticiones distintas. |
| `operation_type` | `OperationType` opcional | `"income"` o `"outcome"`; API top default `"outcome"`, pero comparativa fija `"income"`. Summary no requiere el filtro; la página lo envía para que `income` sea el agregado de interés. |
| `limit` | `number` opcional | API default `5`; entero de `1` a `20`, inclusive. La página solicita `5`; se trata como máximo, no como garantía de cinco filas. |
| `group_by` | `"day" \| "week" \| "month"` opcional en API | API default `"month"`; la página envía explícitamente `"month"`. |
| `category` | `Category` opcional en API | Uno de los literales del dominio; la página comparativa no lo envía. |
| `start_date`, `end_date` | `ApiDateString` opcionales | Fechas calendario ISO inclusivas; se omiten individualmente si están vacías. |

### Casos límite y presentación esperada

1. **Un grupo no tiene ingresos/categorías en el rango:** el endpoint top/summary puede responder `[]`. Mantener ambas tarjetas/tablas B2B y B2C; mostrar “No hay categorías de ingreso para este grupo y período.”, total `$0` y gráfico con el total disponible del otro grupo y cero para el grupo vacío.
2. **Menos de cinco categorías disponibles:** mostrar las filas recibidas, sin completar artificialmente hasta cinco. El porcentaje sigue dividiéndose por la suma de ingresos del summary completo de ese grupo, no por la suma de las filas top.
3. **Facets vacías o categoría de respuesta no incluida en las facets disponibles:** la tabla filtra filas usando `availableCategories`; la fila no disponible no se presenta. Si tras filtrar no quedan filas, mostrar el estado vacío. Las facets actuales son globales, no por grupo.
4. **Falla cualquiera de las peticiones para B2B/B2C:** `Promise.all` hace fallar la carga conjunta. Mostrar el mensaje “No se pudo cargar la comparativa B2B vs B2C.”; el gráfico presenta “No se pudo generar el gráfico.” en lugar de datos parciales. Las tablas muestran carga mientras se solicita; en la primera carga quedan vacías y muestran su empty state después, pero si falla una actualización posterior pueden conservar las filas de la respuesta anterior porque el estado `groups` no se vacía al iniciar/fracasar la petición. No interpretar esas filas como resultado nuevo del rango fallido.

## Contratos relacionados

- [`api-types.ts`](./api-types.ts): tipos de respuesta definidos actualmente para facets, alertas y top categorías.
- [`param-types.ts`](./param-types.ts): tipos de query definidos actualmente para fechas, alertas y top categorías.
- [`components.md`](./components.md): props de los componentes de presentación y responsabilidades de UI.
