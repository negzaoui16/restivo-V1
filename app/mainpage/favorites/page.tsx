import { Heart } from "lucide-react";
import { SectionEmptyState } from "../_components/SectionEmptyState";

export default function FavoritesPage() {
  return (
    <SectionEmptyState
      icon={<Heart className="w-6 h-6" />}
      title="Favorites"
      description="Restaurants you save will appear here so you can get back to them in one tap."
    />
  );
}
