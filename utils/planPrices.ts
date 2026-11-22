export function resolvePlanAmount(
  tier: string,
  billing: 'MONTHLY' | 'ANNUAL' | null,
  prices: Array<{ planTier: string; billingCycle: string; amount: number }>
): number | null {
  if (tier === 'FREE' || !billing) return 0;
  const match = prices.find((price) => price.planTier === tier && price.billingCycle === billing);
  return match ? Number(match.amount) : null;
}
