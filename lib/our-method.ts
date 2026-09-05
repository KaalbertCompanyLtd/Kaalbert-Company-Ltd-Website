import { prisma } from "@/lib/prisma";

/** All 4 `method_stage` rows, in display order (Discover, Diagnose, Design, Deliver). */
export async function getMethodStages() {
  return prisma.methodStage.findMany({ orderBy: { order: "asc" } });
}
