import { toast } from "sonner";

import type { HairQuizSubmission } from "@/lib/hair-quiz/schema";

export async function patchHairQuizSubmission(
  body: Record<string, unknown>,
): Promise<HairQuizSubmission | null> {
  const res = await fetch("/api/hair-quiz", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();

  if (!res.ok) {
    toast.error(json.error || "Failed to update submission");
    return null;
  }

  return json.data as HairQuizSubmission;
}
