import { Compass } from "lucide-react";
import { SectionEmptyState } from "../_components/SectionEmptyState";

export default function ExplorePage() {
  return (
    <SectionEmptyState
      icon={<Compass className="w-6 h-6" />}
      title="Explore"
      description="Discover new restaurants around you. This section is coming together next."
    />
  );
}
