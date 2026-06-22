import { z } from "zod";

export const taskBreakdownSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(3).max(120),
        description: z.string().min(10),
        type: z.enum(["FE", "BE", "INFRA", "QA"]),
        estimateHours: z.number().min(0.5).max(40),
        acceptanceCriteria: z.array(z.string()).min(1).max(6),
      }),
    )
    .min(1)
    .max(20),
});

export type TaskBreakdown = z.infer<typeof taskBreakdownSchema>;
