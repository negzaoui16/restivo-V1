import { db } from "@/lib/db";
import { getMenuTree } from "@/lib/menu/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ restaurantId: string }> };

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { restaurantId } = await context.params;

    // Check if real restaurant in database
    const restaurant = await db.orm.public.Restaurant.where({ id: restaurantId }).first();

    if (!restaurant) {
      return Response.json(
        { ok: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const menu = await getMenuTree(restaurantId);

    return Response.json({
      ok: true,
      menu,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        location: [restaurant.address, restaurant.city, restaurant.country].filter(Boolean).join(", "),
        image: restaurant.coverUrl || restaurant.logoUrl || "/images/restaurant-ambient.jpg",
        currency: restaurant.currency || "TND",
        description: restaurant.description,
        phone: restaurant.phone,
      },
    });
  } catch (err: any) {
    console.error("Public menu API error:", err);
    return Response.json(
      { ok: false, error: err?.message || "Failed to load menu" },
      { status: 500 }
    );
  }
}
