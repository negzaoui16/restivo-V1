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
const META_REGEX = /<!--\s*META:\s*(\{[^}]*\})\s*-->/i;
const ALL_HTML_COMMENTS_REGEX = /<!--[\s\S]*?-->/g;

export function formatDescriptionWithTags(description: string, tags: string[]): string {
  const clean = description.replace(ALL_HTML_COMMENTS_REGEX, "").trim();
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

  let tags: string[] = [];

  // 1. Try matching <!-- TAGS:[...] -->
  const tagsMatch = rawDescription.match(TAGS_REGEX);
  if (tagsMatch) {
    try {
      const parsed = JSON.parse(tagsMatch[1]);
      if (Array.isArray(parsed)) {
        tags = parsed;
      }
    } catch {}
  }

  // 2. Try matching <!-- META:{ "tags": [...] } -->
  const metaMatch = rawDescription.match(META_REGEX);
  if (metaMatch && tags.length === 0) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      if (parsed && Array.isArray(parsed.tags)) {
        tags = parsed.tags;
      }
    } catch {}
  }

  // 3. Strip all HTML comments completely so internal metadata never leaks to user UI
  const text = rawDescription.replace(ALL_HTML_COMMENTS_REGEX, "").trim();

  return { text, tags };
}

export function getTagById(id: string): MenuTag | undefined {
  return AVAILABLE_MENU_TAGS.find((tag) => tag.id === id);
}
