import { type TopCategoryItem } from "./financial-types";

export function sumIncomePeriods(periods: { income: number }[]): number {
  return periods.reduce((total, period) => total + period.income, 0);
}

export function filterAvailableCategories(
  categories: TopCategoryItem[],
  availableCategories: string[],
): TopCategoryItem[] {
  const available = new Set(availableCategories);
  return categories.filter((item) => available.has(item.category));
}

export function categorySharePercent(amount: number, groupTotal: number): number {
  return groupTotal > 0 ? (amount / groupTotal) * 100 : 0;
}
