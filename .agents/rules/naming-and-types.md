# Regla: naming y tipos

## Nombre
Convenciones de nombres y tipado de dominio.

## Alcance
Nuevos o modificados módulos, componentes, funciones, campos API y valores financieros del frontend y backend.

## Justificación
- `frontend/src/components/dashboard/income-outcome-chart.tsx` usa kebab-case para el archivo y exporta `IncomeOutcomeChart` en PascalCase.
- `frontend/src/lib/financial-utils.ts` usa funciones camelCase como `computeMonthlyData`.
- `backend/app/routes.py` utiliza snake_case para funciones y campos (`get_metrics_summary`, `create_date`, `operation_type`).
- Los dominios `OperationType`, `Category` y `BusinessType` están restringidos con `Literal` en backend y uniones en `frontend/src/lib/financial-types.ts`.

## Guía específica
1. En frontend, sigue el patrón observado: nombres de archivo kebab-case, componentes React PascalCase y funciones/variables camelCase.
2. En Python y campos API existentes, conserva snake_case.
3. Para operación, categoría y tipo de negocio, extiende las declaraciones tipadas en ambos lados; evita strings arbitrarios.
4. Trata los nombres y valores de API existentes como contrato público; si hay que renombrarlos, actualiza consumidores y pruebas en el mismo cambio.
