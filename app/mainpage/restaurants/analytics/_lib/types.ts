export type AnalyticsPeriod = "today" | "7d" | "30d" | "month" | "year";

export type AnalyticsTabType = "overview" | "stock" | "accounting" | "engineering";

export type StockCategory =
  | "viandes"
  | "produits_laitiers"
  | "boulangerie"
  | "legumes_fruits"
  | "epicerie_sauces"
  | "boissons"
  | "emballages";

export type StockStatus = "ok" | "low" | "critical";

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unit: "kg" | "g" | "L" | "ml" | "pcs";
  minThreshold: number;
  costPerUnit: number; // In DT (TND)
  supplier: string;
  lastRestocked: string;
  status: StockStatus;
  usedInDishesCount: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: "in" | "out_sale" | "loss" | "adjustment";
  quantity: number;
  unit: string;
  cost: number;
  reason?: string;
  date: string;
}

export interface DishRecipe {
  dishId: string;
  dishName: string;
  category: string;
  sellingPrice: number;
  foodCost: number; // Calculated from ingredients
  marginDT: number;
  marginPercent: number;
  ingredients: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    cost: number;
  }[];
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: "loyer" | "salaires" | "energie_eau" | "fournisseurs" | "marketing" | "autre";
  amount: number; // in DT
  date: string;
  paymentMethod: "especes" | "virement" | "cheque" | "carte";
  status: "paye" | "en_attente";
  notes?: string;
}

export interface DailyCashClosure {
  id: string;
  date: string;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  onlineSales: number;
  cashInRegister: number;
  cashDiscrepancy: number; // Difference (+ or -)
  closedBy: string;
  status: "conforme" | "ecart";
}

export interface MenuEngineeringItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  foodCost: number;
  unitMargin: number;
  volumeSold: number;
  totalRevenue: number;
  totalProfit: number;
  classification: "star" | "plowhorse" | "puzzle" | "dog";
}
