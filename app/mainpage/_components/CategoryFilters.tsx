"use client";

import React from "react";
import { 
  MapPin, 
  Utensils, 
  Flame, 
  Soup, 
  Coffee, 
  Fish, 
  Wine, 
  Egg, 
  CakeSlice,
  Layers
} from "lucide-react";
import { Category, CATEGORIES } from "../_data/restaurants";

interface CategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryFilters({
  selectedCategory,
  onSelectCategory,
}: CategoryFiltersProps) {
  const getCategoryIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#7B756E]"}`;

    switch (iconName) {
      case "all":
        return null;
      case "nearby":
        return <MapPin className={iconClass} />;
      case "italian":
        return <Utensils className={iconClass} />;
      case "tunisian":
        return <Flame className={iconClass} />;
      case "japanese":
        return <Soup className={iconClass} />;
      case "coffee":
        return <Coffee className={iconClass} />;
      case "seafood":
        return <Fish className={iconClass} />;
      case "fine-dining":
        return <Wine className={iconClass} />;
      case "breakfast":
        return <Egg className={iconClass} />;
      case "desserts":
        return <CakeSlice className={iconClass} />;
      default:
        return <Layers className={iconClass} />;
    }
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2.5 -mx-1 px-1">
      <div className="flex items-center gap-2 min-w-max">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          const icon = getCategoryIcon(category.iconName, isSelected);

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#B55234] text-white border border-[#B55234] shadow-xs scale-102"
                  : "bg-white/80 hover:bg-white text-[#4D4843] hover:text-[#1A1A1A] border border-[#E5DEC9] hover:border-[#D5CDBD]"
              }`}
            >
              {icon}
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
