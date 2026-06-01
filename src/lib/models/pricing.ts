import type { ModelDefinition } from "./types";

export interface PriceBreakdownItem {
  label: string;
  value: number;
}

export interface PriceCalculation {
  credits: number;
  breakdown: PriceBreakdownItem[];
}

/**
 * Calculate final cost in credits for a generation request.
 * Multipliers from `pricing.modifiers` are applied to `pricing.base`.
 */
export function calculatePrice(
  model: ModelDefinition,
  params: Record<string, unknown>
): PriceCalculation {
  const { base, modifiers = [] } = model.pricing;

  const breakdown: PriceBreakdownItem[] = [
    { label: "Базовая цена", value: base },
  ];

  let total = base;

  for (const modifier of modifiers) {
    const rawValue = params[modifier.paramKey];
    if (rawValue === undefined || rawValue === null) continue;

    const key = String(rawValue);
    const mult = modifier.table[key];
    if (typeof mult !== "number" || mult === 1) continue;

    const before = total;
    total = total * mult;
    breakdown.push({
      label: `${modifier.paramKey}: ${key} (×${mult})`,
      value: Math.round((total - before) * 100) / 100,
    });
  }

  return {
    credits: Math.ceil(total),
    breakdown,
  };
}
