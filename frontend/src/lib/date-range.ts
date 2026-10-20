export function buildDateRangeQuery(startDate: string, endDate: string): string {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  return params.toString();
}

export function buildAlertsQuery(
  threshold: number,
  startDate: string,
  endDate: string,
): string {
  const params = new URLSearchParams({ threshold: String(threshold) });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  return params.toString();
}

export function buildTopIncomeCategoriesQuery(
  businessType: "B2B" | "B2C",
  startDate: string,
  endDate: string,
): string {
  const params = new URLSearchParams({
    operation_type: "income",
    limit: "5",
    business_type: businessType,
  });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  return params.toString();
}

export function buildBusinessSummaryQuery(
  businessType: "B2B" | "B2C",
  startDate: string,
  endDate: string,
): string {
  const params = new URLSearchParams({
    group_by: "month",
    operation_type: "income",
    business_type: businessType,
  });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  return params.toString();
}
