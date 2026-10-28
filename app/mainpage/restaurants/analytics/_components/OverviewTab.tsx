"use client";

import React from "react";
import {
  Coins,
  TrendingUp,
  Boxes,
  PieChart,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  PackageX,
  CreditCard,
  Banknote,
  Globe,
} from "lucide-react";
import { StockItem } from "../_lib/types";

interface OverviewTabProps {
  stockItems: StockItem[];
  onGoToStock: () => void;
  onGoToAccounting: () => void;
}

export function OverviewTab({
  stockItems,
  onGoToStock,
  onGoToAccounting,
}: OverviewTabProps) {
  const criticalItems = stockItems.filter(
    (i) => i.status === "critical" || i.status === "low"
  );
  const totalStockValue = stockItems.reduce(
    (acc, item) => acc + item.quantity * item.costPerUnit,
    0
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* ─── 1. Key Performance Indicators (KPI Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Chiffre d'affaires */}
        <div className="p-4 rounded-2xl bg-white/80 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736D65]">
              Chiffre d&apos;Affaires (Mois)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF0EA] text-[#B55234] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-[#1A1A1A]">
              24 850,00 <span className="text-sm font-semibold text-[#8C857B]">DT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-[#15803d]">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.8% vs mois précédent</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Food Cost Ratio */}
        <div className="p-4 rounded-2xl bg-white/80 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736D65]">
              Food Cost (Coût Matières)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#15803d] flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-[#1A1A1A]">
              31,2 <span className="text-sm font-semibold text-[#8C857B]">%</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs font-medium text-[#15803d]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conforme (Cible restau 28-35%)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Marge Brute */}
        <div className="p-4 rounded-2xl bg-white/80 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736D65]">
              Marge Brute Estimée
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF0EA] text-[#B55234] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-[#1A1A1A]">
              17 096,80 <span className="text-sm font-semibold text-[#8C857B]">DT</span>
            </div>
            <div className="mt-1 text-xs text-[#736D65]">
              Taux de marge brute: <span className="font-bold text-[#1A1A1A]">68,8%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Valeur Stock & Alertes */}
        <div className="p-4 rounded-2xl bg-white/80 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736D65]">
              Valeur du Stock Actuel
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] text-[#B45309] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-[#1A1A1A]">
              {totalStockValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
              <span className="text-sm font-semibold text-[#8C857B]">DT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#B91C1C]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{criticalItems.length} articles en alerte</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Alertes Critiques & Action Immédiate ─── */}
      {criticalItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FFF5F2] border border-[#FCD9D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#FAF0EA] text-[#B55234] shrink-0 mt-0.5">
              <PackageX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">
                Attention : {criticalItems.length} articles nécessitent un réapprovisionnement urgent
              </h3>
              <p className="text-xs text-[#736D65] mt-0.5">
                {criticalItems.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(" · ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToStock}
            className="px-3.5 py-2 rounded-xl bg-[#B55234] hover:bg-[#9E4328] text-white text-xs font-bold whitespace-nowrap transition-colors"
          >
            Gérer le stock & commandes
          </button>
        </div>
      )}

      {/* ─── 3. Graphiques & Répartitions (Semaine & Canaux) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventes hebdomadaires */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/80 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A]">
                Évolution des Recettes (7 derniers jours)
              </h2>
              <p className="text-xs text-[#736D65]">Recette journalière moyenne: ~1 650 DT / jour</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#FAF0EA] text-[#B55234] text-xs font-bold">
              Total 7j : 11 580 DT
            </span>
          </div>

          {/* Simple Visual Bar Chart */}
          <div className="h-44 flex items-end gap-3 pt-4 border-b border-[#E8E2D7] pb-2">
            {[
              { day: "Lun", value: 1420, max: 2200 },
              { day: "Mar", value: 1350, max: 2200 },
              { day: "Mer", value: 1540, max: 2200 },
              { day: "Jeu", value: 1680, max: 2200 },
              { day: "Ven", value: 2050, max: 2200 },
              { day: "Sam", value: 2190, max: 2200 },
              { day: "Dim", value: 1350, max: 2200 },
            ].map((bar, idx) => {
              const heightPercent = Math.round((bar.value / bar.max) * 100);
              const isWeekend = bar.day === "Ven" || bar.day === "Sam";
              return (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-[#8C857B] opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.value} DT
                  </span>
                  <div className="w-full bg-[#FAF0EA] rounded-t-lg h-32 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isWeekend ? "bg-[#B55234]" : "bg-[#D88D77] group-hover:bg-[#B55234]"
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${isWeekend ? "text-[#B55234] font-bold" : "text-[#736D65]"}`}>
                    {bar.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-[#736D65]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#B55234]" />
              <span>Vendredi & Samedi (Jours de pointe)</span>
            </div>
            <button
              onClick={onGoToAccounting}
              className="text-[#B55234] hover:underline font-bold"
            >
              Voir détails comptables →
            </button>
          </div>
        </div>

        {/* Répartition des Modes de Vente & Paiement */}
        <div className="p-5 rounded-2xl bg-white/80 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Canaux & Encaissements
            </h2>
            <p className="text-xs text-[#736D65] mt-0.5">Répartition du mois en cours</p>

            <div className="mt-4 flex flex-col gap-3">
              {/* Canaux */}
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1A1A1A] mb-1">
                  <span>Sur Place (Dine-in)</span>
                  <span>58% · 14 413 DT</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF0EA] overflow-hidden">
                  <div className="h-full bg-[#B55234] rounded-full" style={{ width: "58%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#1A1A1A] mb-1">
                  <span>À Emporter (Takeaway)</span>
                  <span>26% · 6 461 DT</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF0EA] overflow-hidden">
                  <div className="h-full bg-[#D88D77] rounded-full" style={{ width: "26%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#1A1A1A] mb-1">
                  <span>Livraison (Delivery)</span>
                  <span>16% · 3 976 DT</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF0EA] overflow-hidden">
                  <div className="h-full bg-[#8C857B] rounded-full" style={{ width: "16%" }} />
                </div>
              </div>
            </div>

            {/* Encaissements */}
            <div className="mt-6 pt-4 border-t border-[#E8E2D7] flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                Modes de règlement
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D7]">
                  <Banknote className="w-4 h-4 mx-auto text-[#15803d] mb-1" />
                  <div className="text-[11px] font-bold text-[#1A1A1A]">Espèces</div>
                  <div className="text-[10px] text-[#736D65]">62%</div>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D7]">
                  <CreditCard className="w-4 h-4 mx-auto text-[#2563eb] mb-1" />
                  <div className="text-[11px] font-bold text-[#1A1A1A]">Carte / TPE</div>
                  <div className="text-[10px] text-[#736D65]">25%</div>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D7]">
                  <Globe className="w-4 h-4 mx-auto text-[#B55234] mb-1" />
                  <div className="text-[11px] font-bold text-[#1A1A1A]">En Ligne</div>
                  <div className="text-[10px] text-[#736D65]">13%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
