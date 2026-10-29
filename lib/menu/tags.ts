/**
 * ============================================================================
 * MODULE : TAGS DIÉTÉTIQUES & GESTION DES MÉTADONNÉES (Metadata Injector)
 * ============================================================================
 * Fichier : lib/menu/tags.ts
 *
 * RÔLE CLÉ DANS LE PROJET :
 * Ce module résout un problème architectural majeur : comment ajouter des tags
 * alimentaires (Halal, Vegan, Sans gluten, Épicé, etc.) SANS modifier le schéma
 * de la base de données SQL ni casser les modèles existants.
 *
 * STRATÉGIE (Pattern "Metadata Injection") :
 * 1. Les tags sont encodés sous forme de commentaire HTML invisible à la fin
 *    de la description du plat : <!-- TAGS:["halal", "spicy"] -->
 * 2. À l'affichage, parseDescriptionTags() extrait les tags pour les rendre
 *    sous forme de jolis badges avec icônes.
 * 3. Tous les commentaires techniques <!-- ... --> sont nettoyés du texte visible
 *    afin que le client ne voie qu'une description propre et soignée.
 * ============================================================================
 */

export interface MenuTag {
  id: string;
  label: string;
  icon: string;
  colorClass: string;
}

// Liste officielle des badges diététiques et allergènes supportés par Restivo
export const AVAILABLE_MENU_TAGS: MenuTag[] = [
  { id: "vegan", label: "Végétarien", icon: "🌱", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "spicy", label: "Épicé", icon: "🌶️", colorClass: "bg-red-50 text-red-700 border-red-200" },
  { id: "gluten_free", label: "Sans gluten", icon: "🌾", colorClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "halal", label: "Halal", icon: "🥩", colorClass: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "seafood", label: "Poisson & Mer", icon: "🐟", colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "nuts", label: "Fruits à coque", icon: "🥜", colorClass: "bg-orange-50 text-orange-700 border-orange-200" },
];

// Expressions régulières pour détecter et extraire les métadonnées sérialisées
const TAGS_REGEX = /<!--\s*TAGS:\s*(\[[^\]]*\])\s*-->/i;
const META_REGEX = /<!--\s*META:\s*(\{[^}]*\})\s*-->/i;
const ALL_HTML_COMMENTS_REGEX = /<!--[\s\S]*?-->/g;

/**
 * ENCODEUR : Fusionne le texte saisi par le restaurateur avec les tags choisis.
 * Exemple : "Pizza sauce tomate" + ["halal"] => "Pizza sauce tomate\n<!-- TAGS:[\"halal\"] -->"
 */
export function formatDescriptionWithTags(description: string, tags: string[]): string {
  const clean = description.replace(ALL_HTML_COMMENTS_REGEX, "").trim();
  if (!tags || tags.length === 0) return clean;
  const tagComment = `<!-- TAGS:${JSON.stringify(tags)} -->`;
  return clean ? `${clean}\n${tagComment}` : tagComment;
}

/**
 * DÉCODEUR : Sépare la description textuelle et la liste des tags.
 * Garantit que les commentaires HTML ne fuitent JAMAIS dans l'interface utilisateur.
 */
export function parseDescriptionTags(rawDescription: string | null | undefined): {
  text: string;
  tags: string[];
} {
  if (!rawDescription) {
    return { text: "", tags: [] };
  }

  let tags: string[] = [];

  // Étape 1 : Recherche du format standard <!-- TAGS:[...] -->
  const tagsMatch = rawDescription.match(TAGS_REGEX);
  if (tagsMatch) {
    try {
      const parsed = JSON.parse(tagsMatch[1]);
      if (Array.isArray(parsed)) {
        tags = parsed;
      }
    } catch {}
  }

  // Étape 2 : Recherche de fallback du format <!-- META:{ "tags": [...] } -->
  const metaMatch = rawDescription.match(META_REGEX);
  if (metaMatch && tags.length === 0) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      if (parsed && Array.isArray(parsed.tags)) {
        tags = parsed.tags;
      }
    } catch {}
  }

  // Étape 3 : Nettoyage total du texte pour retirer les balises techniques
  const text = rawDescription.replace(ALL_HTML_COMMENTS_REGEX, "").trim();

  return { text, tags };
}

/**
 * Trouve la définition complète d'un tag (icône, couleur, libellé) par son identifiant
 */
export function getTagById(id: string): MenuTag | undefined {
  return AVAILABLE_MENU_TAGS.find((tag) => tag.id === id);
}
