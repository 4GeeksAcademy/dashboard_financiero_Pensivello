import { describe, expect, it } from "vitest";

import {
  categorySharePercent,
  filterAvailableCategories,
  sumIncomePeriods,
} from "./business-comparison";
import type { TopCategoryItem } from "./financial-types";

const incomeCategories: TopCategoryItem[] = [
  { category: "sales", operation_type: "income", total_amount: 800 },
  { category: "others", operation_type: "income", total_amount: 200 },
];

describe("business comparison calculations", () => {
  it("totals income across summary periods", () => {
    expect(sumIncomePeriods([{ income: 150 }, { income: 350 }])).toBe(500);
  });

  it("keeps only categories exposed by facets", () => {
    expect(filterAvailableCategories(incomeCategories, ["sales"]).map((item) => item.category))
      .toEqual(["sales"]);
  });

  it("calculates group share and handles empty group totals", () => {
    expect(categorySharePercent(200, 800)).toBe(25);
    expect(categorySharePercent(200, 0)).toBe(0);
  });
});
