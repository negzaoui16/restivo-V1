import { db } from "@/lib/db";
import { AuthError } from "@/lib/auth/errors";
import { requireUserId } from "@/lib/auth/session";
import { resolveRestaurantAccess, type RestaurantAccess } from "@/lib/auth/access";
import { RestaurantError } from "@/lib/restaurants/errors";

type UserRow = {
  id: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  managementRole: "OWNER" | "MANAGER" | "STAFF" | null;
};

export async function requireRestaurantManagerUser(request: Request): Promise<{
  user: UserRow;
  access: RestaurantAccess;
}> {
  const userId = await requireUserId(request);
  const user = await db.orm.public.User.where({ id: userId }).first();

  if (!user) throw new AuthError("INVALID_TOKEN");
  if (user.status === "SUSPENDED") throw new AuthError("USER_SUSPENDED");
  if (user.status === "DELETED") throw new AuthError("USER_DELETED");

  const access = await resolveRestaurantAccess(user.id, user.managementRole ?? null);
  if (!access.canManageRestaurants) {
    throw new AuthError("FORBIDDEN", "Only owners and managers can manage restaurants.");
  }

  return { user, access };
}

export async function requireManagedRestaurant(
  request: Request,
  restaurantId: string
): Promise<{
  user: UserRow;
  restaurant: { id: string; ownerId: string; name: string };
  role: "OWNER" | "MANAGER";
}> {
  const { user } = await requireRestaurantManagerUser(request);
  const restaurant = await db.orm.public.Restaurant.where({ id: restaurantId }).first();
  if (!restaurant) {
    throw new RestaurantError("NOT_FOUND", "Restaurant not found.");
  }

  if (restaurant.ownerId === user.id) {
    return { user, restaurant, role: "OWNER" };
  }

  const membership = await db.orm.public.RestaurantMembership.where({
    userId: user.id,
    restaurantId,
    status: "ACTIVE",
  }).first();

  if (membership?.role === "OWNER" || membership?.role === "MANAGER") {
    return { user, restaurant, role: membership.role };
  }

  throw new AuthError("FORBIDDEN", "You cannot manage this restaurant.");
}
