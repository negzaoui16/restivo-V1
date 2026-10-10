export type PromotionKind = "PERCENTAGE" | "FIXED_AMOUNT";

export type PublicMenuItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  preparationTime: number | null;
  promotionLabel: string | null;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
  items: PublicMenuItem[];
};

export type PublicPromotion = {
  id: string;
  name: string;
  description: string | null;
  type: PromotionKind;
  value: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isLive: boolean;
  menuItemIds: string[];
};

export type PublicMenu = {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  categories: PublicMenuCategory[];
  promotions: PublicPromotion[];
};
