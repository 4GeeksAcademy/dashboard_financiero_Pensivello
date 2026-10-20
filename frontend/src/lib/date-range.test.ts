import { describe, expect, it } from "vitest";

import {
  buildAlertsQuery,
  buildBusinessSummaryQuery,
  buildDateRangeQuery,
  buildTopIncomeCategoriesQuery,
} from "./date-range";

describe("buildDateRangeQuery", () => {
  it("omits empty dates so the API returns the full available range", () => {
    expect(buildDateRangeQuery("", "")).toBe("");
    expect(buildDateRangeQuery("2025-01-01", "")).toBe("start_date=2025-01-01");
    expect(buildDateRangeQuery("", "2025-12-31")).toBe("end_date=2025-12-31");
  });

  it("serializes both dates using the API parameter names", () => {
    expect(buildDateRangeQuery("2025-01-01", "2025-12-31")).toBe(
      "start_date=2025-01-01&end_date=2025-12-31",
    );
  });
});

describe("buildAlertsQuery", () => {
  it("always sends the threshold and includes active date filters", () => {
    expect(buildAlertsQuery(0.3, "2025-01-01", "2025-06-30")).toBe(
      "threshold=0.3&start_date=2025-01-01&end_date=2025-06-30",
    );
    expect(buildAlertsQuery(0.5, "", "")).toBe("threshold=0.5");
  });
});

describe("business comparison query builders", () => {
  it("requests top five income categories for each business with active dates", () => {
    expect(buildTopIncomeCategoriesQuery("B2B", "2025-01-01", "2025-12-31")).toBe(
      "operation_type=income&limit=5&business_type=B2B&start_date=2025-01-01&end_date=2025-12-31",
    );
    expect(buildBusinessSummaryQuery("B2C", "", "2025-12-31")).toBe(
      "group_by=month&operation_type=income&business_type=B2C&end_date=2025-12-31",
    );
  });
});