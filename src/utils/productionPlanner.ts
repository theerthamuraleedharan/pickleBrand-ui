export type ProductionStatus = "out" | "plan" | "healthy";

export interface ProductionPlan {
  daysUntilStockout: number | null;
  projectedStockAtLeadTime: number;
  targetStock: number;
  recommendedBatch: number;
  status: ProductionStatus;
}

function nonNegativeFinite(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function calculateProductionPlan(
  stock: number,
  dailyDemand: number,
  leadTimeDays: number,
  safetyDays: number,
): ProductionPlan {
  const availableStock = nonNegativeFinite(stock);
  const demand = nonNegativeFinite(dailyDemand);
  const leadTime = nonNegativeFinite(leadTimeDays);
  const safetyBuffer = nonNegativeFinite(safetyDays);

  // Target stock covers demand through production lead time plus the chosen safety buffer.
  const targetStock = demand * (leadTime + safetyBuffer);
  const projectedStockAtLeadTime = availableStock - demand * leadTime;
  const recommendedBatch = Math.ceil(
    Math.max(0, targetStock - availableStock),
  );
  const status: ProductionStatus =
    demand > 0 && availableStock === 0
      ? "out"
      : demand > 0 && availableStock <= targetStock
        ? "plan"
        : "healthy";

  return {
    daysUntilStockout:
      demand > 0 ? availableStock / demand : null,
    projectedStockAtLeadTime,
    targetStock,
    recommendedBatch,
    status,
  };
}
