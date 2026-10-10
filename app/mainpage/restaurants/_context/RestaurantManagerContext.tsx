"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiListRestaurants } from "@/lib/restaurants/client";
import type { PublicRestaurant } from "@/lib/restaurants/serialize";

export interface ManagedRestaurant {
  id: string;
  name: string;
  location: string;
  city: string;
  address?: string;
  country?: string;
  postalCode?: string;
  cuisine: string;
  role: string;
  status: "Open" | "Closed" | "Break";
  image: string;
  logoUrl?: string | null;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency?: string;
  timezone?: string;
  tablesCount: number;
  capacity: number;
  floorsCount: number;
  rating: number;
  slug: string;
  dbStatus: PublicRestaurant["status"];
  createdAt?: string | null;
}

export const FALLBACK_RESTAURANTS: ManagedRestaurant[] = [
  {
    id: "maison-olive",
    name: "Maison Olive",
    location: "Les Berges du Lac II, Tunis",
    city: "Tunis",
    address: "Rue du Lac Windermere, Les Berges du Lac II",
    country: "Tunisia",
    cuisine: "Tunisian & Mediterranean",
    role: "Owner",
    status: "Open",
    image: "/images/restaurant-ambient.jpg",
    logoUrl: "/images/restaurant-ambient.jpg",
    description: "An authentic culinary destination blending ancestral Mediterranean recipes with contemporary gastronomic artistry, featuring an olive-tree courtyard and panoramic terrace.",
    phone: "+216 71 860 120",
    email: "contact@maisonolive.tn",
    website: "https://maisonolive.restivo.app",
    currency: "TND",
    timezone: "Africa/Tunis",
    tablesCount: 24,
    capacity: 96,
    floorsCount: 2,
    rating: 4.8,
    slug: "maison-olive",
    dbStatus: "ACTIVE",
    createdAt: "2024-01-15",
  },
  {
    id: "dar-el-marsa",
    name: "Dar El Marsa",
    location: "Corniche de La Marsa, Tunis",
    city: "La Marsa",
    address: "75 Avenue Habib Bourguiba, La Marsa",
    country: "Tunisia",
    cuisine: "Seafood & Mediterranean Grill",
    role: "Owner",
    status: "Open",
    image: "/images/dar-el-marsa.jpg",
    logoUrl: "/images/dar-el-marsa.jpg",
    description: "Seaside gastronomic dining with breathtaking Gulf of Tunis views, celebrating fresh Mediterranean catches, sun-kissed citrus marinades, and artisanal pastries.",
    phone: "+216 71 728 000",
    email: "welcome@darelmarsa.tn",
    website: "https://darelmarsa.restivo.app",
    currency: "TND",
    timezone: "Africa/Tunis",
    tablesCount: 18,
    capacity: 72,
    floorsCount: 1,
    rating: 4.6,
    slug: "dar-el-marsa",
    dbStatus: "ACTIVE",
    createdAt: "2024-03-20",
  },
  {
    id: "le-comptoir",
    name: "Le Comptoir",
    location: "Centre Ville, Tunis",
    city: "Tunis",
    address: "18 Rue de Marseille, Tunis",
    country: "Tunisia",
    cuisine: "French Haute Cuisine & Fine Dining",
    role: "Manager",
    status: "Open",
    image: "/images/le-comptoir.jpg",
    logoUrl: "/images/le-comptoir.jpg",
    description: "Cosmopolitan brasserie and lounge in downtown Tunis renowned for dry-aged cuts, decadent truffle risottos, and an extensive sommelier wine cellar.",
    phone: "+216 71 345 678",
    email: "reservation@lecomptoir.tn",
    website: "https://lecomptoir.restivo.app",
    currency: "TND",
    timezone: "Africa/Tunis",
    tablesCount: 30,
    capacity: 110,
    floorsCount: 2,
    rating: 4.7,
    slug: "le-comptoir",
    dbStatus: "ACTIVE",
    createdAt: "2024-02-10",
  },
];

export function toManagedRestaurant(row: PublicRestaurant): ManagedRestaurant {
  const location =
    [row.address, row.city, row.country].filter(Boolean).join(", ") ||
    row.city ||
    "Tunis, Tunisia";

  return {
    id: row.id,
    name: row.name,
    location,
    city: row.city ?? "Tunis",
    address: row.address ?? "",
    country: row.country ?? "Tunisia",
    cuisine: row.description?.slice(0, 48) || "Tunisian & Mediterranean",
    role: row.role === "OWNER" ? "Owner" : "Manager",
    status: row.status === "ACTIVE" ? "Open" : "Closed",
    image: row.coverUrl || "/images/restaurant-ambient.jpg",
    logoUrl: row.logoUrl || null,
    description: row.description || "Authentic dining venue managed with Restivo hospitality platform.",
    phone: row.phone ?? "+216 71 800 900",
    email: row.email ?? `contact@${row.slug || "restivo"}.tn`,
    website: row.website ?? `https://${row.slug || "venue"}.restivo.app`,
    currency: row.currency || "TND",
    timezone: row.timezone || "Africa/Tunis",
    tablesCount: row.tablesCount || 20,
    capacity: row.capacity || 80,
    floorsCount: row.floorsCount || 1,
    rating: 4.8,
    slug: row.slug,
    dbStatus: row.status,
    createdAt: row.createdAt || "2024-01-01",
  };
}

interface RestaurantManagerContextType {
  restaurants: ManagedRestaurant[];
  currentRestaurant: ManagedRestaurant | null;
  setCurrentRestaurant: (rest: ManagedRestaurant) => void;
  upsertRestaurant: (rest: ManagedRestaurant) => void;
  updateRestaurantProfile: (id: string, updates: Partial<ManagedRestaurant>) => void;
  isLoadingRestaurants: boolean;
  isAddRestaurantOpen: boolean;
  setIsAddRestaurantOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  profileModalRestaurant: ManagedRestaurant | null;
  setProfileModalRestaurant: (rest: ManagedRestaurant | null) => void;
  openRestaurantProfile: (rest?: ManagedRestaurant | null) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  restaurantStatus: "Open" | "Closed" | "Break";
  setRestaurantStatus: (status: "Open" | "Closed" | "Break") => void;
}

const RestaurantManagerContext = createContext<RestaurantManagerContextType | null>(null);

const EMPTY: RestaurantManagerContextType = {
  restaurants: FALLBACK_RESTAURANTS,
  currentRestaurant: FALLBACK_RESTAURANTS[0],
  setCurrentRestaurant: () => {},
  upsertRestaurant: () => {},
  updateRestaurantProfile: () => {},
  isLoadingRestaurants: false,
  isAddRestaurantOpen: false,
  setIsAddRestaurantOpen: () => {},
  isProfileModalOpen: false,
  setIsProfileModalOpen: () => {},
  profileModalRestaurant: null,
  setProfileModalRestaurant: () => {},
  openRestaurantProfile: () => {},
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
  activeNavTab: "overview",
  setActiveNavTab: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  restaurantStatus: "Open",
  setRestaurantStatus: () => {},
};

export function RestaurantManagerProvider({ children }: { children: React.ReactNode }) {
  const { user, isReady, getAccessToken } = useAuth();
  const [restaurants, setRestaurants] = useState<ManagedRestaurant[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalRestaurant, setProfileModalRestaurant] = useState<ManagedRestaurant | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantStatus, setRestaurantStatus] = useState<"Open" | "Closed" | "Break">("Open");

  const currentRestaurant = useMemo(
    () => restaurants.find((row) => row.id === currentId) ?? restaurants[0] ?? null,
    [restaurants, currentId]
  );

  useEffect(() => {
    if (!isReady) return;
    if (!user?.canManageRestaurants) {
      setRestaurants(FALLBACK_RESTAURANTS);
      setCurrentId(FALLBACK_RESTAURANTS[0].id);
      setIsLoadingRestaurants(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setRestaurants(FALLBACK_RESTAURANTS);
      setCurrentId(FALLBACK_RESTAURANTS[0].id);
      setIsLoadingRestaurants(false);
      return;
    }

    let cancelled = false;
    setIsLoadingRestaurants(true);

    apiListRestaurants(token)
      .then((rows) => {
        if (cancelled) return;
        const mapped = rows.map(toManagedRestaurant);
        const finalList = mapped.length > 0 ? mapped : FALLBACK_RESTAURANTS;
        setRestaurants(finalList);
        setCurrentId((prev) => {
          if (prev && finalList.some((row) => row.id === prev)) return prev;
          return finalList[0]?.id ?? null;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setRestaurants(FALLBACK_RESTAURANTS);
          setCurrentId(FALLBACK_RESTAURANTS[0].id);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRestaurants(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, user?.canManageRestaurants, user?.id, getAccessToken]);

  const setCurrentRestaurant = useCallback((rest: ManagedRestaurant) => {
    setCurrentId(rest.id);
  }, []);

  const upsertRestaurant = useCallback((rest: ManagedRestaurant) => {
    setRestaurants((prev) => [rest, ...prev.filter((row) => row.id !== rest.id)]);
    setCurrentId(rest.id);
  }, []);

  const updateRestaurantProfile = useCallback((id: string, updates: Partial<ManagedRestaurant>) => {
    setRestaurants((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updates } : row))
    );
    setProfileModalRestaurant((prev) =>
      prev?.id === id ? { ...prev, ...updates } : prev
    );
  }, []);

  const openRestaurantProfile = useCallback(
    (rest?: ManagedRestaurant | null) => {
      const target = rest ?? currentRestaurant ?? restaurants[0] ?? null;
      setProfileModalRestaurant(target);
      setIsProfileModalOpen(true);
    },
    [currentRestaurant, restaurants]
  );

  return (
    <RestaurantManagerContext.Provider
      value={{
        restaurants,
        currentRestaurant,
        setCurrentRestaurant,
        upsertRestaurant,
        updateRestaurantProfile,
        isLoadingRestaurants,
        isAddRestaurantOpen,
        setIsAddRestaurantOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        profileModalRestaurant,
        setProfileModalRestaurant,
        openRestaurantProfile,
        mobileMenuOpen,
        setMobileMenuOpen,
        activeNavTab,
        setActiveNavTab,
        searchQuery,
        setSearchQuery,
        restaurantStatus,
        setRestaurantStatus,
      }}
    >
      {children}
    </RestaurantManagerContext.Provider>
  );
}

export function useRestaurantManager() {
  const ctx = useContext(RestaurantManagerContext);
  return ctx ?? EMPTY;
}
