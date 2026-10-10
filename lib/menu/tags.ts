export interface MenuTag {
  id: string;
  label: string;
  icon: string;
  colorClass: string;
}

export const AVAILABLE_MENU_TAGS: MenuTag[] = [
  { id: "vegan", label: "Végétarien", icon: "🌱", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "spicy", label: "Épicé", icon: "🌶️", colorClass: "bg-red-50 text-red-700 border-red-200" },
  { id: "gluten_free", label: "Sans gluten", icon: "🌾", colorClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "halal", label: "Halal", icon: "🥩", colorClass: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "seafood", label: "Poisson & Mer", icon: "🐟", colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "nuts", label: "Fruits à coque", icon: "🥜", colorClass: "bg-orange-50 text-orange-700 border-orange-200" },
];

const TAGS_REGEX = /<!--\s*TAGS:\s*(\[[^\]]*\])\s*-->/i;

export function formatDescriptionWithTags(description: string, tags: string[]): string {
  const clean = description.replace(TAGS_REGEX, "").trim();
  if (!tags || tags.length === 0) return clean;
  const tagComment = `<!-- TAGS:${JSON.stringify(tags)} -->`;
  return clean ? `${clean}\n${tagComment}` : tagComment;
}

export function parseDescriptionTags(rawDescription: string | null | undefined): {
  text: string;
  tags: string[];
} {
  if (!rawDescription) {
    return { text: "", tags: [] };
  }

  const match = rawDescription.match(TAGS_REGEX);
  if (match) {
    const text = rawDescription.replace(match[0], "").trim();
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        return { text, tags: parsed };
      }
    } catch {
      // Fallback if parsing fails
    }
    return { text, tags: [] };
  }

  return { text: rawDescription.trim(), tags: [] };
}

export function getTagById(id: string): MenuTag | undefined {
  return AVAILABLE_MENU_TAGS.find((tag) => tag.id === id);
}
