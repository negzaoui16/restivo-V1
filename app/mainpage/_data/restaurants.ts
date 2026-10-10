export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  isOpen: boolean;
  image: string;
  has3D: boolean;
  badge?: string;
  address?: string;
}

export interface Reservation {
  id: string;
  restaurantName: string;
  restaurantImage: string;
  date: string;
  time: string;
  table: string;
  guests: number;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

export interface Category {
  id: string;
  label: string;
  iconName: string;
}

export const USER_PROFILE = {
  name: 'Ahmed',
  location: 'Tunis, Tunisia',
  avatar: '/images/ahmed-avatar.jpg',
  greeting: 'Good evening',
  subtitle: 'Where would you like to dine today?',
};

export const CURRENT_RESERVATION: Reservation = {
  id: 'res-8941',
  restaurantName: 'Maison Olive',
  restaurantImage: '/images/restaurant-ambient.jpg',
  date: 'Today',
  time: '19:30',
  table: 'Table 14',
  guests: 2,
  status: 'Confirmed',
};

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', iconName: 'all' },
  { id: 'nearby', label: 'Nearby', iconName: 'nearby' },
  { id: 'italian', label: 'Italian', iconName: 'italian' },
  { id: 'tunisian', label: 'Tunisian', iconName: 'tunisian' },
  { id: 'japanese', label: 'Japanese', iconName: 'japanese' },
  { id: 'coffee', label: 'Coffee', iconName: 'coffee' },
  { id: 'seafood', label: 'Seafood', iconName: 'seafood' },
  { id: 'fine-dining', label: 'Fine Dining', iconName: 'fine-dining' },
  { id: 'breakfast', label: 'Breakfast', iconName: 'breakfast' },
  { id: 'desserts', label: 'Desserts', iconName: 'desserts' },
];

export const FEATURED_RESTAURANTS: Restaurant[] = [
  {
    id: 'maison-olive',
    name: 'Maison Olive',
    cuisine: 'Tunisian · Mediterranean',
    category: 'tunisian',
    rating: 4.8,
    reviewCount: 342,
    distance: '1.2 km',
    priceLevel: '$$$',
    isOpen: true,
    image: '/images/restaurant-ambient.jpg',
    has3D: true,
    address: 'Les Berges du Lac II, Tunis',
  },
  {
    id: 'dar-el-marsa',
    name: 'Dar El Marsa',
    cuisine: 'Seafood · Mediterranean',
    category: 'seafood',
    rating: 4.6,
    reviewCount: 289,
    distance: '2.8 km',
    priceLevel: '$$',
    isOpen: true,
    image: '/images/dar-el-marsa.jpg',
    has3D: true,
    address: 'Corniche de La Marsa, Tunis',
  },
  {
    id: 'le-comptoir',
    name: 'Le Comptoir',
    cuisine: 'French · International',
    category: 'fine-dining',
    rating: 4.7,
    reviewCount: 415,
    distance: '3.4 km',
    priceLevel: '$$$',
    isOpen: true,
    image: '/images/le-comptoir.jpg',
    has3D: true,
    address: 'Rue de Marseille, Tunis',
  },
];

export const NEARBY_RESTAURANTS: Restaurant[] = [
  {
    id: 'table-carthage',
    name: 'La Table de Carthage',
    cuisine: 'Tunisian · Mediterranean',
    category: 'tunisian',
    rating: 4.5,
    reviewCount: 198,
    distance: '1.1 km',
    priceLevel: '$$',
    isOpen: true,
    image: '/images/table-carthage.jpg',
    has3D: false,
    address: 'Byrsa Hill, Carthage',
  },
  {
    id: 'sushi-house',
    name: 'Sushi House',
    cuisine: 'Japanese · Asian',
    category: 'japanese',
    rating: 4.4,
    reviewCount: 210,
    distance: '2.6 km',
    priceLevel: '$$',
    isOpen: true,
    image: '/images/sushi-house.jpg',
    has3D: false,
    address: 'Ennasr 2, Ariana',
  },
  {
    id: 'cafe-des-arts',
    name: 'Café des Arts',
    cuisine: 'Coffee · Brunch',
    category: 'coffee',
    rating: 4.3,
    reviewCount: 154,
    distance: '3.2 km',
    priceLevel: '$',
    isOpen: true,
    image: '/images/cafe-des-arts.jpg',
    has3D: false,
    address: 'Avenue Habib Bourguiba, Tunis',
  },
  {
    id: 'le-bistrot',
    name: 'Le Bistrot',
    cuisine: 'French · Mediterranean',
    category: 'italian',
    rating: 4.6,
    reviewCount: 312,
    distance: '4.1 km',
    priceLevel: '$$$',
    isOpen: false,
    image: '/images/le-bistrot.jpg',
    has3D: false,
    address: 'Sidi Bou Saïd, Tunis',
  },
];
