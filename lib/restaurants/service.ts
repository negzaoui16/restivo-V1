import { Temporal } from "temporal-polyfill";
import { db } from "@/lib/db";
import { isPgUniqueViolation } from "@/lib/auth/errors";
import { RestaurantError } from "@/lib/restaurants/errors";
import { slugCandidate, slugifyRestaurantName } from "./slug";
import { toPublicRestaurant, type PublicRestaurant } from "./serialize";
import type { CreateRestaurantBody } from "./validation";

const SLUG_ATTEMPTS = 12;

async function allocateSlug(
  name: string,
  slugTaken: (slug: string) => Promise<unknown>
): Promise<string> {
  const base = slugifyRestaurantName(name);

  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
    const slug = slugCandidate(base, attempt);
    const existing = await slugTaken(slug);
    if (!existing) return slug;
  }

  throw new RestaurantError("SLUG_TAKEN");
}

export async function createRestaurantForOwner(
  userId: string,
  input: CreateRestaurantBody
): Promise<PublicRestaurant> {
  try {
    const restaurant = await db.transaction(async (tx) => {
      const slug = await allocateSlug(input.name, (candidate) =>
        tx.orm.public.Restaurant.where({ slug: candidate }).first()
      );

      const created = await tx.orm.public.Restaurant.create({
        ownerId: userId,
        name: input.name,
        slug,
        description: input.description ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        website: input.website ?? null,
        coverUrl: input.coverUrl ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        postalCode: input.postalCode ?? null,
        currency: input.currency,
        timezone: input.timezone,
        status: "DRAFT",
      });

      await tx.orm.public.RestaurantMembership.create({
        userId,
        restaurantId: created.id,
        role: "OWNER",
        status: "ACTIVE",
        joinedAt: Temporal.Now.instant(),
      });

      for (const day of input.hours) {
        await tx.orm.public.BusinessHours.create({
          restaurantId: created.id,
          dayOfWeek: day.dayOfWeek,
          isClosed: day.isClosed,
          openTime: day.isClosed ? null : (day.openTime ?? null),
          closeTime: day.isClosed ? null : (day.closeTime ?? null),
        });
      }

      await tx.orm.public.Floor.create({
        restaurantId: created.id,
        name: input.floor.name,
        level: 0,
        width: String(input.floor.width),
        height: String(input.floor.height),
        sortOrder: 0,
        isActive: true,
      });

      await tx.orm.public.AuditLog.create({
        userId,
        restaurantId: created.id,
        action: "CREATE",
        entityType: "Restaurant",
        entityId: created.id,
        metadata: { name: created.name, slug: created.slug },
      });

      return created;
    });

    return toPublicRestaurant(restaurant, {
      role: "OWNER",
      floorsCount: 1,
    });
  } catch (err) {
    if (isPgUniqueViolation(err)) throw new RestaurantError("SLUG_TAKEN");
    throw err;
  }
}

export async function listManagedRestaurants(userId: string): Promise<PublicRestaurant[]> {
  const [owned, memberships] = await Promise.all([
    db.orm.public.Restaurant.where({ ownerId: userId }).all(),
    db.orm.public.RestaurantMembership.where({ userId, status: "ACTIVE" }).all(),
  ]);

  const roleByRestaurantId = new Map<string, "OWNER" | "MANAGER">();

  for (const row of owned) {
    roleByRestaurantId.set(row.id, "OWNER");
  }

  for (const membership of memberships) {
    if (membership.role !== "OWNER" && membership.role !== "MANAGER") continue;
    const existing = roleByRestaurantId.get(membership.restaurantId);
    if (membership.role === "OWNER" || !existing) {
      roleByRestaurantId.set(membership.restaurantId, membership.role);
    }
  }

  const restaurants = [...owned];
  const ownedIds = new Set(owned.map((row) => row.id));

  for (const membership of memberships) {
    if (!roleByRestaurantId.has(membership.restaurantId)) continue;
    if (ownedIds.has(membership.restaurantId)) continue;
    const row = await db.orm.public.Restaurant.where({
      id: membership.restaurantId,
    }).first();
    if (row) restaurants.push(row);
  }

  const result: PublicRestaurant[] = [];

  for (const restaurant of restaurants) {
    const role = roleByRestaurantId.get(restaurant.id);
    if (!role) continue;
    const floors = await db.orm.public.Floor.where({
      restaurantId: restaurant.id,
    }).all();
    result.push(
      toPublicRestaurant(restaurant, {
        role,
        floorsCount: floors.length,
      })
    );
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
