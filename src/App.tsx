import React, { useState, useMemo } from "react";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  LineChart, 
  Sparkles, 
  Terminal, 
  Flame, 
  HelpCircle,
  FileCode,
  Github
} from "lucide-react";

// Subcomponents
import KPICards from "./components/KPICards";
import RFMExplorer from "./components/RFMExplorer";
import CLVSimulator from "./components/CLVSimulator";
import CohortHeatmap from "./components/CohortHeatmap";
import AIInsightsPanel from "./components/AIInsightsPanel";
import PythonHub from "./components/PythonHub";

// Utils and types
import { generateInitialMockData, calculateSegmentStats } from "./mockDataUtils";
import { Transaction, CustomerRFM } from "./types";

export default function App() {
  // Central Data Storage state lists
  const [data, setData] = useState<{ transactions: Transaction[]; customers: CustomerRFM[] }>(() => 
    generateInitialMockData()
  );

  // Tab controllers
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer" | "simulator" | "ai" | "repo">("dashboard");

  // Recalculate segment ratios recursively
  const segmentStats = useMemo(() => {
    return calculateSegmentStats(data.customers);
  }, [data.customers]);

  const handleDataIngested = (newTransactions: Transaction[], newCustomers: CustomerRFM[]) => {
    setData({
      transactions: newTransactions,
      customers: newCustomers
    });
  };

  const tabsConfig = [
    { id: "dashboard", label: "Executive Boardroom", icon: LayoutDashboard },
    { id: "explorer", label: "RFM Grid Ingestion", icon: Users },
    { id: "simulator", label: "ML Forecast Curves", icon: LineChart },
    { id: "ai", label: "Growth Intelligence", icon: Sparkles },
    { id: "repo", label: "💻 Python ML Repository", icon: Terminal }
  ] as const;

  return (
    <div id="application-container" className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-800 dark:text-zinc-200 antialiased flex flex-col justify-between">
      {/* Prime Corporate Header Rails */}
      <header id="application-header" className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo identity */}
          <div id="company-identity" className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-900 dark:bg-zinc-1 text-white dark:text-zinc-900 rounded-xl shadow-xs">
              <Building2 className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50 select-none">
                  Vanguard CLV Predictor
                </h1>
                <span className="inline-block text-[9px] font-sans font-black px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 leading-none">
                  v2.8
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold tracking-tight mt-0.5">
                Customer Recency-Frequency-Monetary Analytics & Forecast Engine
              </p>
            </div>
          </div>

          {/* Social / Action hubs */}
          <div id="header-badges-deck" className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 font-semibold bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md border border-zinc-200/40 select-all">
              SNAPSHOT: 2026-05-27 UTC
            </span>
            <div className="flex items-center pr-1 border-r border-zinc-200 dark:border-zinc-800/85 mr-1" />
            <a
              href="#python-hub-wrap"
              onClick={() => setActiveTab("repo")}
              className="flex items-center gap-1 px-3 py-1 bg-zinc-100 hover:bg-zinc-200/60 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] uppercase font-bold rounded-md text-zinc-600 dark:text-zinc-300 transition"
            >
              <Terminal className="h-3.5 w-3.5" />
              Source repo
            </a>
          </div>
        </div>
      </header>

      {/* Primary Workspace Frame */}
      <main id="application-workspace" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Navigation Tabs bar */}
        <div id="workspace-navigator-tabs" className="flex items-center overflow-x-auto gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-1 pr-1 scrollbar-none">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                id={`tab-btn-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-1 dark:text-zinc-900 dark:border-transparent font-extrabold shadow-sm"
                    : "bg-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-850/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab views content area */}
        <div id="tab-views-content-root" className="min-h-120">
          
          {/* T1 - Executive Dashboard view */}
          {activeTab === "dashboard" && (
            <div id="view-dashboard" className="space-y-6 animate-fade-in">
              <div id="dashboard-welcome-banner" className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-zinc-850">
                <div className="space-y-1 z-10">
                  <h2 className="text-xl font-bold tracking-tight">Executive Dashboard</h2>
                  <p className="text-xs text-zinc-300 font-medium">
                    Corporate summaries computed on current active ledger database.
                  </p>
                </div>
                <div className="flex gap-2.5 z-10 text-xs font-semibold">
                  <div className="px-3 py-1.5 bg-white/10 rounded-lg text-emerald-300">
                    Database: <strong className="font-extrabold">{data.customers.length}</strong> profiles
                  </div>
                  <div className="px-3 py-1.5 bg-white/15 rounded-lg text-blue-200">
                    Cadence: <strong className="font-extrabold">{data.transactions.length}</strong> transactions
                  </div>
                </div>
              </div>

              {/* Summary stat numbers card */}
              <KPICards customers={data.customers} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Visual heat retention curves */}
                <div className="col-span-12 lg:col-span-8">
                  <CohortHeatmap />
                </div>

                {/* Brief segments percentage summary */}
                <div className="col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-855 pb-3 mb-4">
                      Segment Revenue Contributed
                    </h3>
                    <div className="space-y-3.5 max-h-80 overflow-y-auto">
                      {segmentStats.slice(0, 5).map(stat => (
                        <div key={stat.segment} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate pr-2">{stat.segment}</span>
                            <span className="font-mono text-zinc-500 font-bold">${stat.totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-zinc-650" style={{ width: `${stat.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-855 text-[10px] text-zinc-400 font-medium select-none">
                    Calculated by sorting lifetime order revenues.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* T2 - Ingestion database file grid explorer */}
          {activeTab === "explorer" && (
            <div id="view-explorer" className="animate-fade-in">
              <RFMExplorer 
                customers={data.customers} 
                transactions={data.transactions} 
                onDataLoaded={handleDataIngested} 
              />
            </div>
          )}

          {/* T3 - SLIDERS NPV simulator area */}
          {activeTab === "simulator" && (
            <div id="view-simulator" className="animate-fade-in">
              <CLVSimulator customers={data.customers} />
            </div>
          )}

          {/* T4 - Gemini AI growth templates generator */}
          {activeTab === "ai" && (
            <div id="view-ai" className="animate-fade-in">
              <AIInsightsPanel segmentStats={segmentStats} />
            </div>
          )}

          {/* T5 - Real physical Python repository codebase hub */}
          {activeTab === "repo" && (
            <div id="view-repo" className="animate-fade-in">
              <PythonHub />
            </div>
          )}

        </div>
      </main>

      {/* Symmetrical Corporate Footer bar */}
      <footer id="application-footer" className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-6 px-6 mt-12 text-center text-xs text-zinc-400 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-medium text-zinc-500 dark:text-zinc-400">
            © 2026 Vanguard Analytics Platform. Open-source Python pipeline sandbox.
          </p>
          <div className="flex items-center gap-3">
            <span className="hover:text-zinc-600 transition cursor-help">Status: Active Operations</span>
            <span>•</span>
            <span className="hover:text-zinc-600 transition cursor-help">Schema: BG/NBD Formulation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
