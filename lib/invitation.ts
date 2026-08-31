import { randomUUID } from "node:crypto";

export function generateInvitationSlug() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}
