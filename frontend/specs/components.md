# Especificación de componentes del dashboard

Documento de referencia de las props de los componentes existentes, agrupadas por funcionalidad. Los contratos reflejan las interfaces en `frontend/src/`; una prop no se considera opcional si su declaración actual no lleva `?` ni tiene un valor por defecto en la firma del componente.

## Tipos compartidos

Los nombres de modelos de presentación actuales viven en `frontend/src/lib/financial-types.ts`:

- `MetricsFacets`: `operation_types`, `business_types`, `categories`, `min_date`, `max_date`.
- `MetricsAlert`: `period`, `outcome_total`, `baseline_average`, `increase_ratio`.
- `FinancialMovement`: `create_date`, `amount`, `operation_type`, `category`, `business_type`.
- `KPIMetrics`: `totalIncome`, `totalOutcome`, `profit`, `profitPercent`.
- `MonthlyDataPoint`: `month`, `income`, `outcome`, `profitPercent`.
- `TopCategoryItem`: `category`, `operation_type`, `total_amount`.

Los contratos de API previstos/documentados también están en `frontend/specs/api-types.ts` y los parámetros en `frontend/specs/param-types.ts`. Esos archivos son especificaciones y no sustituyen automáticamente los tipos que importan los componentes desde `src/lib/financial-types.ts`.

## Funcionalidad: rango de fechas y encabezado

### `DashboardHeader`

Archivo: `src/components/dashboard/dashboard-header.tsx`

| Prop | Tipo | Requerida | Semántica |
| --- | --- | --- | --- |
| `period` | `string` | No | Texto visible con el período del dashboard. Default: `2024 — Full Year`. |

El encabezado no recibe las fechas por separado ni administra el filtro.

### Filtro de fechas en `App`

El control de fechas es JSX de `App.tsx`, no un componente reutilizable con props tipadas. Estado local: `startDate: string` y `endDate: string`, vacíos cuando el extremo no está fijado. Los inputs usan las fechas de facets como límites disponibles; los valores se envían a las consultas consumidoras en la forma de fecha `YYYY-MM-DD` que produce `<input type="date">`.

No documentar `DateRangeFilter` como props de componente: es un contrato de parámetros query en `specs/param-types.ts`, no una interfaz de props de React.

## Funcionalidad: indicadores y gráficos del resumen

### `KPIRow`

Archivo: `src/components/dashboard/kpi-row.tsx`

| Prop | Tipo | Requerida | Semántica |
| --- | --- | --- | --- |
| `metrics` | `KPIMetrics \| null` | Sí | KPIs calculados para el rango actual; `null` permite representar valores aún no disponibles. |
| `loading` | `boolean` | No | Activa placeholders de carga en las tarjetas. |

### `KPICard`

Archivo: `src/components/dashboard/kpi-card.tsx`

| Prop | Tipo | Requerida | Semántica |
| --- | --- | --- | --- |
| `label` | `string` | Sí | Nombre visible de la métrica. |
| `value` | `string` | Sí | Valor ya formateado para presentación. |
| `helperText` | `string` | Sí | Texto explicativo. |
| `icon` | `LucideIcon` | Sí | Componente de icono. |
| `variant` | `'income' \| 'outcome' \| 'profit' \| 'profitPercent'` | Sí | Selecciona el estilo de la tarjeta. |
| `loading` | `boolean` | No | Muestra skeleton en lugar de datos. |

### `IncomeOutcomeChart` y `ProfitPercentChart`

Archivos: `src/components/dashboard/income-outcome-chart.tsx`, `src/components/dashboard/profit-percent-chart.tsx`

Ambos reciben la misma interfaz:

| Prop | Tipo | Requerida | Semántica |
| --- | --- | --- | --- |
| `data` | `MonthlyDataPoint[]` | Sí | Puntos mensuales de ingreso/egreso/margen. |
| `loading` | `boolean` | No | Muestra el estado skeleton antes del gráfico. |

`IncomeOutcomeChart` usa `month`, `income` y `outcome`; `ProfitPercentChart` usa `month` y `profitPercent`. Ambos muestran estado vacío cuando no hay datos útiles para su serie.

## Funcionalidad: alertas de anomalías

### `AlertsTable`

Archivo: `src/components/dashboard/alerts-table.tsx`

| Prop | Tipo | Requerida | Semántica |
| --- | --- | --- | --- |
| `alerts` | `MetricsAlert[]` | Sí | Filas del endpoint; cada incremento `increase_ratio` se representa como porcentaje en UI. |
| `threshold` | `number` | Sí | Valor actual del umbral como ratio, por defecto gestionado en `App` (`0.3`). Rango aceptado por API/UI: `0.01`–`1.0`. |
| `loading` | `boolean` | Sí | Muestra el estado de carga. |
| `error` | `string \| null` | Sí | Mensaje de error; cuando existe toma precedencia sobre carga y lista. |
| `onThresholdChange` | `(threshold: number) => void` | Sí | Notifica un nuevo ratio validado al propietario del estado. |

La tabla conserva estado vacío explícito. No recibe fechas: `App` agrega el rango activo a la petición y pasa la respuesta ya filtrada.

## Funcionalidad: comparación B2B vs B2C

### `BusinessComparisonPage`

Archivo: `src/components/dashboard/business-comparison-page.tsx`

| Prop | Tipo | Requerida | Semántica |
| --- | --- | --- | --- |
| `startDate` | `string` | Sí | Inicio opcional del rango; `""` significa sin límite inferior. |
| `endDate` | `string` | Sí | Fin opcional del rango; `""` significa sin límite superior. |
| `availableCategories` | `Category[]` | Sí | Categorías globales de `/api/metrics/facets`, usadas para validar/filtrar los resultados top; no son facets específicas de B2B/B2C. |

El componente obtiene internamente categorías top y summary de ingreso para ambos grupos, administra carga/error y deriva los datos de sus tablas y gráfico. El endpoint summary entrega objetos de campos `period`, `income`, `outcome`, `net`; el total de ingresos se agrega por grupo. Los detalles del contrato API/query están en `specs/api-types.ts`, `specs/param-types.ts` y `specs/business-comparison.md`.

### `BusinessCategoryTable` (interna)

No se exporta fuera de `business-comparison-page.tsx`; sus props internas actuales son:

| Prop | Tipo | Requerida | Semántica |
| --- | --- | --- | --- |
| `group` | `BusinessComparisonData` (tipo local: `{ businessType: BusinessType; totalIncome: number; categories: TopCategoryItem[] }`) | Sí | Datos de un solo grupo empresarial. |
| `availableCategories` | `Category[]` | Sí | Facets globales para validar filas. |
| `totalIncome` | `number` | Sí | Base del porcentaje. En el código actual repite `group.totalIncome`; alinear el contrato es tratarlo como el total agregado del mismo grupo/rango. |
| `loading` | `boolean` | Sí | Distingue carga de respuesta vacía. |

Nota de alineación: la implementación pasa tanto `group.totalIncome` como la prop separada `totalIncome`, y ambas contienen el mismo valor. `totalIncome` es lo que el componente usa para mostrar el total y calcular porcentajes. Esta duplicación es parte de la firma actual; no se oculta ni se consolida en la documentación. Si se desea eliminarla, habría que cambiar explícitamente el componente y su llamada.

## Primitivas visuales compartidas

Estas primitivas no definen props de negocio; reenvían las props estándar de un `div` de React (`React.ComponentProps<'div'>`), incluyendo `className`, atributos HTML y `children`.

Archivo: `src/components/ui/card.tsx`

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent` y `CardFooter` aceptan las props estándar de `div` y aplican clases/atributos `data-slot` propios.
- La exportación se hace como funciones nombradas, no mediante un contrato propio de props de dominio.

Archivo: `src/components/ui/skeleton.tsx`

- `Skeleton` acepta `React.ComponentProps<'div'>`; `className` permite complementar las clases visuales y los demás atributos se propagan al `div`.

## Convenciones de alineación

- Los componentes de presentación reciben datos ya tipados y estados necesarios para dibujar; `App` posee el rango general y el estado de alertas, mientras la página comparativa administra sus peticiones como está implementada actualmente.
- `loading`, `error` y los datos se documentan de acuerdo con precedencia observable: en `AlertsTable`, error precede a loading; en las tablas comparativas, loading precede al estado vacío; el gráfico comparativo prioriza loading, después error y luego gráfico.
- Los nombres de props React usan camelCase y los campos wire/API conservan `snake_case`.
- Si una implementación futura mueve responsabilidades entre `App` y un componente, actualizar este documento y los tipos de props a la vez; esta especificación no autoriza cambios de comportamiento por sí sola.
