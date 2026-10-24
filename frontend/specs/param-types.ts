/**
 * Query parameter contracts for the dashboard API.
 * Parameter names use the API's snake_case spelling.
 */

import type { BusinessType, GroupBy, OperationType } from "./api-types";

/** Date strings are serialized as YYYY-MM-DD; calendar validity is checked by the API. */
export type ApiDateString = string;

/** Optional inclusive date bounds shared by the date-filtered endpoints. */
export interface DateRangeFilter {
  start_date?: ApiDateString;
  end_date?: ApiDateString;
}

/** Query for GET /api/metrics/alerts. API threshold defaults to 0.3 and is 0.01–1.0. */
export interface AlertsParams extends DateRangeFilter {
  threshold?: number;
  group_by?: GroupBy;
  business_type?: BusinessType;
}

/** Query for GET /api/metrics/summary. */
export interface SummaryParams extends DateRangeFilter {
  group_by?: GroupBy;
  operation_type?: OperationType;
  business_type?: BusinessType;
}

/**
 * Query for GET /api/metrics/categories/top.
 * business_type is included because the comparison page requests one result set per group.
 * API defaults are operation_type=outcome and limit=5; limit is constrained to 1–20.
 */
export interface TopCategoriesParams extends DateRangeFilter {
  operation_type?: OperationType;
  limit?: number;
  business_type?: BusinessType;
}
