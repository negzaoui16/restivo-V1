import { db } from "@/lib/db";
import { FEATURED_RESTAURANTS, NEARBY_RESTAURANTS, Restaurant } from "@/app/mainpage/_data/restaurants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbRestaurants = await db.orm.public.Restaurant.all();

    const mappedDbRestaurants: Restaurant[] = [];

    for (const r of dbRestaurants) {
      // Check menus for 3D items
      let has3D = true;
      try {
        const menus = await db.orm.public.Menu.where({ restaurantId: r.id }).all();
        for (const m of menus) {
          const categories = await db.orm.public.MenuCategory.where({ menuId: m.id }).all();
          for (const cat of categories) {
            const items = await db.orm.public.MenuItem.where({ categoryId: cat.id }).all();
            if (items.some((it) => !!it.model3dUrl)) {
              has3D = true;
              break;
            }
          }
          if (has3D) break;
        }
      } catch {
        // Fallback default
      }

      // Infer cuisine category from description or name
      const lowerDesc = (r.description || "").toLowerCase();
      const lowerName = r.name.toLowerCase();
      let cuisine = r.description ? r.description.slice(0, 40) : "Tunisian & Mediterranean";
      let category = "tunisian";

      if (lowerDesc.includes("ital") || lowerName.includes("pizza") || lowerName.includes("pasta")) {
        cuisine = "Italian Traditional";
        category = "italian";
      } else if (lowerDesc.includes("sea") || lowerDesc.includes("poisson") || lowerName.includes("fish")) {
        cuisine = "Fresh Seafood";
        category = "seafood";
      } else if (lowerDesc.includes("japan") || lowerName.includes("sushi")) {
        cuisine = "Japanese Cuisine";
        category = "japanese";
      } else if (lowerDesc.includes("cafe") || lowerDesc.includes("coffee")) {
        cuisine = "Coffee & Bistro";
        category = "coffee";
      }

      mappedDbRestaurants.push({
        id: r.id,
        name: r.name,
        cuisine,
        category,
        rating: 4.9,
        reviewCount: 42,
        distance: "0.5 km",
        priceLevel: "$$",
        isOpen: true,
        image: r.coverUrl || r.logoUrl || "/images/restaurant-ambient.jpg",
        has3D: true,
        badge: "Live Restaurant",
        address: [r.address, r.city, r.country].filter(Boolean).join(", ") || "Tunis, Tunisia",
      });
    }

    // Merge: Put real DB restaurants first, then discovery restaurants that don't collide
    const existingNames = new Set(mappedDbRestaurants.map((r) => r.name.toLowerCase()));
    const remainingFeatured = FEATURED_RESTAURANTS.filter((r) => !existingNames.has(r.name.toLowerCase()));
    const remainingNearby = NEARBY_RESTAURANTS.filter((r) => !existingNames.has(r.name.toLowerCase()));

    const featured = [...mappedDbRestaurants, ...remainingFeatured];
    const nearby = [...remainingNearby];

    return Response.json({
      ok: true,
      featured,
      nearby,
      totalReal: mappedDbRestaurants.length,
    });
  } catch (err: any) {
    console.error("Explore API error:", err);
    return Response.json({
      ok: false,
      featured: FEATURED_RESTAURANTS,
      nearby: NEARBY_RESTAURANTS,
      totalReal: 0,
    });
  }
}
