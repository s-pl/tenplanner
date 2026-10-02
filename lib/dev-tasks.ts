// Private task tracker for the two Ten Planner founders.
// Gated by email on top of the admin check, so no other admin
// (support staff, future hires, etc.) can see or touch this list.
const DEV_TASK_EMAILS = [
  "david.paniagua.dediego@gmail.com",
  "atpposi@gmail.com",
] as const;

export function isDevTaskUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEV_TASK_EMAILS.includes(
    email.toLowerCase() as (typeof DEV_TASK_EMAILS)[number]
  );
}

export const DEV_TASK_ASSIGNEES = ["dario", "david", "ambos"] as const;
export type DevTaskAssignee = (typeof DEV_TASK_ASSIGNEES)[number];

export const DEV_TASK_STATUSES = ["pendiente", "resuelto"] as const;
export type DevTaskStatus = (typeof DEV_TASK_STATUSES)[number];

export const DEV_TASK_ASSIGNEE_LABELS: Record<DevTaskAssignee, string> = {
  dario: "Darío",
  david: "David",
  ambos: "Ambos",
};
