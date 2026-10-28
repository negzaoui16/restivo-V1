"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurantManager } from "../_context/RestaurantManagerContext";
import { AnalyticsHeader } from "./_components/AnalyticsHeader";
import { AnalyticsTabs } from "./_components/AnalyticsTabs";
import { OverviewTab } from "./_components/OverviewTab";
import { StockManagementTab } from "./_components/StockManagementTab";
import { AccountingRevenueTab } from "./_components/AccountingRevenueTab";
import { MenuEngineeringTab } from "./_components/MenuEngineeringTab";
import { AddStockModal } from "./_components/AddStockModal";
import { AddExpenseModal } from "./_components/AddExpenseModal";
import {
  INITIAL_STOCK_ITEMS,
  INITIAL_MOVEMENTS,
  INITIAL_EXPENSES,
  DAILY_CASH_CLOSURES,
} from "./_lib/mock-data";
import {
  AnalyticsPeriod,
  AnalyticsTabType,
  DailyCashClosure,
  ExpenseRecord,
  StockItem,
  StockMovement,
} from "./_lib/types";

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { currentRestaurant, isLoadingRestaurants, setIsAddRestaurantOpen } =
    useRestaurantManager();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>("overview");
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>("month");

  // Live state
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [cashClosures, setCashClosures] = useState<DailyCashClosure[]>(DAILY_CASH_CLOSURES);

  // Modals
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!user?.canManageRestaurants) router.replace("/mainpage");
  }, [isReady, user?.canManageRestaurants, router]);

  if (!isReady || isLoadingRestaurants) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[#7A746B]">
        Chargement des analytics & finances…
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF0EA] text-[#B55234] flex items-center justify-center mb-4">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">
          Sélectionnez ou créez un restaurant
        </h1>
        <p className="text-sm text-[#736D65] mt-2 max-w-md">
          Les tableaux d&apos;analyse, de stock et de comptabilité sont rattachés à votre établissement.
        </p>
        <button
          onClick={() => setIsAddRestaurantOpen(true)}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B55234] hover:bg-[#9E4328] text-white text-sm font-bold"
        >
          Ajouter un restaurant
        </button>
      </div>
    );
  }

  // Handlers
  const handleAddStockItem = (
    itemData: Omit<StockItem, "id" | "status" | "usedInDishesCount">
  ) => {
    const newItem: StockItem = {
      ...itemData,
      id: `stk-${Date.now()}`,
      status: itemData.quantity <= itemData.minThreshold * 0.5 ? "critical" : itemData.quantity <= itemData.minThreshold ? "low" : "ok",
      usedInDishesCount: 2,
    };
    setStockItems((prev) => [newItem, ...prev]);

    // Add movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: newItem.id,
      itemName: newItem.name,
      type: "in",
      quantity: newItem.quantity,
      unit: newItem.unit,
      cost: newItem.quantity * newItem.costPerUnit,
      reason: `Réception Fournisseur: ${newItem.supplier}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setMovements((prev) => [movement, ...prev]);
  };

  const handleRestockQuick = (itemId: string, addQty: number) => {
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newQty = item.quantity + addQty;
        const newStatus =
          newQty <= item.minThreshold * 0.5
            ? "critical"
            : newQty <= item.minThreshold
            ? "low"
            : "ok";
        return { ...item, quantity: newQty, status: newStatus };
      })
    );

    const item = stockItems.find((i) => i.id === itemId);
    if (item) {
      setMovements((prev) => [
        {
          id: `mov-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          type: "in",
          quantity: addQty,
          unit: item.unit,
          cost: addQty * item.costPerUnit,
          reason: "Réassortiment express",
          date: new Date().toISOString().replace("T", " ").slice(0, 16),
        },
        ...prev,
      ]);
    }
  };

  const handleDeclareLoss = (itemId: string, quantity: number, reason: string) => {
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newQty = Math.max(0, item.quantity - quantity);
        const newStatus =
          newQty <= item.minThreshold * 0.5
            ? "critical"
            : newQty <= item.minThreshold
            ? "low"
            : "ok";
        return { ...item, quantity: newQty, status: newStatus };
      })
    );

    const item = stockItems.find((i) => i.id === itemId);
    if (item) {
      setMovements((prev) => [
        {
          id: `mov-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          type: "loss",
          quantity,
          unit: item.unit,
          cost: quantity * item.costPerUnit,
          reason,
          date: new Date().toISOString().replace("T", " ").slice(0, 16),
        },
        ...prev,
      ]);
    }
  };

  const handleAddExpense = (expenseData: Omit<ExpenseRecord, "id">) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handlePerformCashClose = () => {
    const cashCountedStr = prompt("Montant total d'espèces compté dans le tiroir-caisse (DT) :", "1040.00");
    if (!cashCountedStr) return;
    const counted = Number(cashCountedStr);
    const expected = 1040.0;
    const discrepancy = Number((counted - expected).toFixed(2));

    const newClosure: DailyCashClosure = {
      id: `csh-${Date.now()}`,
      date: `${new Date().toISOString().split("T")[0]} (Clôture)`,
      totalSales: 1680.5,
      cashSales: expected,
      cardSales: 420.5,
      onlineSales: 220.0,
      cashInRegister: counted,
      cashDiscrepancy: discrepancy,
      closedBy: user?.displayName || "Responsable Caisse",
      status: discrepancy === 0 ? "conforme" : "ecart",
    };

    setCashClosures((prev) => [newClosure, ...prev]);
    alert(
      discrepancy === 0
        ? "Clôture de caisse (Z) validée : Caisse parfaitement conforme (Écart : 0 DT) !"
        : `Clôture de caisse validée avec un écart de ${discrepancy > 0 ? "+" : ""}${discrepancy} DT enregistré.`
    );
  };

  const handleExport = () => {
    window.print();
  };

  const criticalStockCount = stockItems.filter(
    (i) => i.status === "critical" || i.status === "low"
  ).length;

  return (
    <div className="flex flex-col gap-6 py-1 select-none animate-in fade-in duration-300">
      {/* ─── Header ─── */}
      <AnalyticsHeader
        restaurantName={currentRestaurant.name}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onExport={handleExport}
      />

      {/* ─── Tabs ─── */}
      <AnalyticsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        criticalStockCount={criticalStockCount}
      />

      {/* ─── Tab Content ─── */}
      {activeTab === "overview" && (
        <OverviewTab
          stockItems={stockItems}
          onGoToStock={() => setActiveTab("stock")}
          onGoToAccounting={() => setActiveTab("accounting")}
        />
      )}

      {activeTab === "stock" && (
        <StockManagementTab
          stockItems={stockItems}
          movements={movements}
          onOpenAddModal={() => setIsAddStockOpen(true)}
          onDeclareLoss={handleDeclareLoss}
          onRestockItem={handleRestockQuick}
        />
      )}

      {activeTab === "accounting" && (
        <AccountingRevenueTab
          expenses={expenses}
          cashClosures={cashClosures}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onPerformCashClose={handlePerformCashClose}
        />
      )}

      {activeTab === "engineering" && <MenuEngineeringTab />}

      {/* ─── Modals ─── */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        onAdd={handleAddStockItem}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAdd={handleAddExpense}
      />
    </div>
  );
}
