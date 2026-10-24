/**
 * TypeScript response contracts for dashboard API functionality:
 * date-range facets, anomaly alerts, and B2B/B2C category comparison.
 * Field names mirror the FastAPI/Pydantic JSON responses (snake_case).
 */

export type OperationType = "income" | "outcome";
export type BusinessType = "B2B" | "B2C";
export type GroupBy = "day" | "week" | "month";
export type Category =
  | "suppliers"
  | "sales"
  | "operational"
  | "administrative"
  | "others";

/** GET /api/metrics/facets response: available values and data date bounds. */
export interface FacetsResponse {
  operation_types: OperationType[];
  business_types: BusinessType[];
  categories: Category[];
  min_date: string;
  max_date: string;
}

/** One entry returned by GET /api/metrics/alerts. */
export interface AlertEntry {
  period: string;
  outcome_total: number;
  baseline_average: number;
  increase_ratio: number;
}

/** GET /api/metrics/alerts response; FastAPI returns an array, not an envelope. */
export type AlertsResponse = AlertEntry[];

/** One period returned by GET /api/metrics/summary. */
export interface SummaryEntry {
  period: string;
  income: number;
  outcome: number;
  net: number;
}

/** GET /api/metrics/summary response; FastAPI returns an array, not an envelope. */
export type SummaryResponse = SummaryEntry[];

/** One category row returned by GET /api/metrics/categories/top. */
export interface CategoryEntry {
  category: Category;
  operation_type: OperationType;
  total_amount: number;
}

/** GET /api/metrics/categories/top response; one array per business_type request. */
export type TopCategoriesResponse = CategoryEntry[];
