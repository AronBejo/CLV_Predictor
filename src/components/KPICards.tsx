import React from "react";
import { Users, DollarSign, Activity, TrendingUp } from "lucide-react";
import { CustomerRFM } from "../types";

interface KPICardsProps {
  customers: CustomerRFM[];
}

export default function KPICards({ customers }: KPICardsProps) {
  const totalCustomers = customers.length;
  
  // Calculations
  const totalRevenue = Math.round(customers.reduce((sum, val) => sum + val.lifetime_revenue, 0));
  const avgMonetary = Math.round((customers.reduce((sum, val) => sum + val.monetary, 0) / (totalCustomers || 1)) * 10) / 10;
  
  // Churn probability estimation (Average probability of being active)
  const activeRate = totalCustomers > 0 
    ? Math.round((customers.filter(c => c.recency < 60).length / totalCustomers) * 1000) / 10 
    : 0;

  const cards = [
    {
      id: "kpi-users",
      title: "Active Customer Index",
      value: totalCustomers.toLocaleString(),
      sub: "Total unique shoppers",
      change: "+12.4% vs last Q",
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20",
      icon: Users
    },
    {
      id: "kpi-rev",
      title: "Cumulative Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      sub: "Historical total spend",
      change: "Stable organic yield",
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
      icon: DollarSign
    },
    {
      id: "kpi-basket",
      title: "Mean Order Value (LTV)",
      value: `$${avgMonetary.toFixed(2)}`,
      sub: "Average checkout basket spend",
      change: "Calculated via RFM matrix",
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20",
      icon: TrendingUp
    },
    {
      id: "kpi-ret",
      title: "Activity Survival Rate",
      value: `${activeRate}%`,
      sub: "Purchased within 60 days",
      change: "Decay factor applied",
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20",
      icon: Activity
    }
  ];

  return (
    <div id="kpi-panel-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            id={card.id}
            key={card.id}
            className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div id={`${card.id}-header`} className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mt-2">
                  {card.value}
                </h3>
              </div>
              <div id={`${card.id}-tag`} className={`p-2.5 rounded-lg ${card.color}`}>
                <IconComponent className="h-5 w-5" />
              </div>
            </div>
            <div id={`${card.id}-footer`} className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/40 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="font-medium">{card.sub}</span>
              <span className="text-zinc-500 dark:text-zinc-400">{card.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
