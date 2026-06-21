export const plans = {
  free: { name: "Free", reviewsPerMonth: 3, repositories: 1 },
  pro: { name: "Pro", reviewsPerMonth: 100, repositories: 10 },
  team: { name: "Team", reviewsPerMonth: Infinity, repositories: Infinity }
} as const;

export type PlanKey = keyof typeof plans;

export function getPlanName(plan: PlanKey) {
  return plans[plan].name;
}
