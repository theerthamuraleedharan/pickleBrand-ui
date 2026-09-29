import { describe, expect, it } from "vitest";

import { calculateProductionPlan } from "./productionPlanner";

describe("calculateProductionPlan", () => {
  it("recommends enough stock to cover lead time and safety buffer", () => {
    expect(calculateProductionPlan(3, 2, 4, 2)).toEqual({
      daysUntilStockout: 1.5,
      projectedStockAtLeadTime: -5,
      targetStock: 12,
      recommendedBatch: 9,
      status: "plan",
    });
  });

  it("does not recommend a batch when stock exceeds the target", () => {
    const result = calculateProductionPlan(20, 2, 4, 2);

    expect(result.recommendedBatch).toBe(0);
    expect(result.status).toBe("healthy");
    expect(result.daysUntilStockout).toBe(10);
  });

  it("marks products with demand and no stock as out of stock", () => {
    const result = calculateProductionPlan(0, 3, 5, 1);

    expect(result.status).toBe("out");
    expect(result.recommendedBatch).toBe(18);
    expect(result.daysUntilStockout).toBe(0);
  });

  it("does not forecast stockout or production when demand is zero", () => {
    const result = calculateProductionPlan(5, 0, 7, 2);

    expect(result.daysUntilStockout).toBeNull();
    expect(result.recommendedBatch).toBe(0);
    expect(result.status).toBe("healthy");
  });

  it("treats invalid and negative inputs as zero", () => {
    const result = calculateProductionPlan(-1, Number.NaN, 7, 2);

    expect(result.daysUntilStockout).toBeNull();
    expect(result.projectedStockAtLeadTime).toBe(0);
    expect(result.recommendedBatch).toBe(0);
  });
});
