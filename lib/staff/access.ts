import { db } from "@/lib/db";
import { AuthError } from "@/lib/auth/errors";
import { resolveRestaurantAccess } from "@/lib/auth/access";
import { requireUserId } from "@/lib/auth/session";

export async function requireStaffUser(request: Request) {
  const userId = await requireUserId(request);
  const user = await db.orm.public.User.where({ id: userId }).first();

  if (!user) throw new AuthError("INVALID_TOKEN");
  if (user.status === "SUSPENDED") throw new AuthError("USER_SUSPENDED");
  if (user.status === "DELETED") throw new AuthError("USER_DELETED");

  const access = await resolveRestaurantAccess(user.id, user.managementRole ?? null);
  if (!access.isStaff) {
    throw new AuthError("FORBIDDEN", "Only staff can ask to join a restaurant.");
  }

  return user;
}
