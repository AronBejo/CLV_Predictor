import React, { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Sliders, Percent, DollarSign, RefreshCcw } from "lucide-react";
import { CustomerRFM, SimulationParameters } from "../types";

interface CLVSimulatorProps {
  customers: CustomerRFM[];
}

export default function CLVSimulator({ customers }: CLVSimulatorProps) {
  // Extract historical default averages to build a robust baseline
  const historicalDefaults = useMemo(() => {
    if (customers.length === 0) {
      return { avgBasket: 75, avgAnnualFreq: 6, retention: 0.75, margin: 0.60 };
    }
    const avgBasket = customers.reduce((sum, c) => sum + c.monetary, 0) / customers.length;
    
    // Average annual frequency: multiply monthly average repeat order freq by 12
    const totalFreqSum = customers.reduce((sum, c) => {
      const annualCadence = c.frequency / Math.max(1, c.customer_age_days / 365);
      return sum + annualCadence;
    }, 0);
    const avgAnnualFreq = Math.round((totalFreqSum / customers.length) * 10) / 10;
    
    // Average survival proxy as retention rate
    const retention = customers.reduce((sum, c) => sum + c.survival_probability, 0) / customers.length;

    return { 
      avgBasket: Math.round(avgBasket), 
      avgAnnualFreq: Math.max(1, Math.min(24, Math.round(avgAnnualFreq))), 
      retention: Math.max(0.2, Math.min(0.95, Math.round(retention * 100) / 100)),
      margin: 0.60 
    };
  }, [customers]);

  // Dynamic user-customizable sliders
  const [params, setParams] = useState<SimulationParameters>({
    retentionRate: historicalDefaults.retention,
    discountRate: 0.08,
    averageBasketValue: historicalDefaults.avgBasket,
    purchaseFrequency: historicalDefaults.avgAnnualFreq,
    grossMargin: historicalDefaults.margin
  });

  const handleReset = () => {
    setParams({
      retentionRate: historicalDefaults.retention,
      discountRate: 0.08,
      averageBasketValue: historicalDefaults.avgBasket,
      purchaseFrequency: historicalDefaults.avgAnnualFreq,
      grossMargin: historicalDefaults.margin
    });
  };

  // Compute NPV curves over a 60-month horizon
  const chartData = useMemo(() => {
    const data: { name: string; Month: number; Baseline: number; Optimized: number }[] = [];
    
    // Baselines references
    const bRetention = historicalDefaults.retention;
    const bBasket = historicalDefaults.avgBasket;
    const bFreq = historicalDefaults.avgAnnualFreq;
    const bMargin = historicalDefaults.margin;
    
    const monthlyDiscount = Math.pow(1 + params.discountRate, 1 / 12) - 1;
    
    let baselineSum = 0;
    let optimizedSum = 0;

    for (let m = 0; m <= 60; m++) {
      if (m === 0) {
        // At start, client contributes standard first baskets
        data.push({ name: `M0`, Month: 0, Baseline: 0, Optimized: 0 });
        continue;
      }

      // 1. Baseline Cashflow Formulation
      const bProbActive = Math.pow(bRetention, m / 12);
      const bCashflow = bBasket * (bFreq / 12) * bProbActive;
      const bProfit = bCashflow * bMargin;
      const bNPV = bProfit / Math.pow(1 + monthlyDiscount, m);
      baselineSum += bNPV;

      // 2. Simulated Optimized Cashflow Formulation
      const oProbActive = Math.pow(params.retentionRate, m / 12);
      const oCashflow = params.averageBasketValue * (params.purchaseFrequency / 12) * oProbActive;
      const oProfit = oCashflow * params.grossMargin;
      const oNPV = oProfit / Math.pow(1 + monthlyDiscount, m);
      optimizedSum += oNPV;

      // Log intervals
      if (m % 6 === 0) {
        data.push({
          name: `M${m}`,
          Month: m,
          Baseline: Math.round(baselineSum),
          Optimized: Math.round(optimizedSum)
        });
      }
    }

    return data;
  }, [params, historicalDefaults]);

  // Derived predictive NPV for 1, 3 and 5 years (Month 12, 36, 60 values)
  const statsSummary = useMemo(() => {
    const item12 = chartData.find(d => d.Month === 12);
    const item36 = chartData.find(d => d.Month === 36);
    const item60 = chartData.find(d => d.Month === 60);

    return {
      "1y": { b: item12?.Baseline || 0, o: item12?.Optimized || 0 },
      "3y": { b: item36?.Baseline || 0, o: item36?.Optimized || 0 },
      "5y": { b: item60?.Baseline || 0, o: item60?.Optimized || 0 }
    };
  }, [chartData]);

  const percentageGain = statsSummary["5y"].b > 0 
    ? Math.round(((statsSummary["5y"].o - statsSummary["5y"].b) / statsSummary["5y"].b) * 100)
    : 0;

  return (
    <div id="clv-simulator-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1">
      {/* Control Sliders Panel */}
      <div id="simulator-sliders-panel" className="col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-855 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-blue-500 shrink-0" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Model Tuning</h3>
            </div>
            <button
              id="reset-simulation-btn"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-100 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
            >
              <RefreshCcw className="h-3 w-3" />
              Reset Averages
            </button>
          </div>

          <div id="sliders-stack" className="space-y-5">
            {/* 1. Retention Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                <span className="flex items-center gap-1.5 select-none text-zinc-600 dark:text-zinc-300">
                  <Percent className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Annual Retention Rate
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-black">
                  {Math.round(params.retentionRate * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.99"
                step="0.01"
                value={params.retentionRate}
                onChange={(e) => setParams(prev => ({ ...prev, retentionRate: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] text-zinc-400 block font-medium">Historical average in dataset: {Math.round(historicalDefaults.retention * 100)}%</span>
            </div>

            {/* 2. Order Basket */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                <span className="flex items-center gap-1.5 select-none text-zinc-600 dark:text-zinc-300">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Average Ticket basket
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-black">
                  ${params.averageBasketValue}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="1"
                value={params.averageBasketValue}
                onChange={(e) => setParams(prev => ({ ...prev, averageBasketValue: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-zinc-400 block font-medium">Historical average in dataset: ${historicalDefaults.avgBasket}</span>
            </div>

            {/* 3. Cadence frequency */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                <span className="flex items-center gap-1.5 select-none text-zinc-600 dark:text-zinc-300">
                  <RefreshCcw className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  Annual Purchase Frequency
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-black">
                  {params.purchaseFrequency}x / Yr
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={params.purchaseFrequency}
                onChange={(e) => setParams(prev => ({ ...prev, purchaseFrequency: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-[10px] text-zinc-400 block font-medium">Historical average in dataset: {historicalDefaults.avgAnnualFreq}x</span>
            </div>

            {/* 4. Margin */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                <span className="flex items-center gap-1.5 select-none text-zinc-600 dark:text-zinc-300">
                  <Percent className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  Gross Margin Margin
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-black">
                  {Math.round(params.grossMargin * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.00"
                step="0.01"
                value={params.grossMargin}
                onChange={(e) => setParams(prev => ({ ...prev, grossMargin: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* 5. Discount annual */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                <span className="flex items-center gap-1.5 select-none text-zinc-600 dark:text-zinc-300">
                  <Percent className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  NPV Discount (Capital Cost)
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-black">
                  {Math.round(params.discountRate * 1000) / 10}%
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.25"
                step="0.005"
                value={params.discountRate}
                onChange={(e) => setParams(prev => ({ ...prev, discountRate: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Leverage Insight Tag */}
        <div id="simulator-gain-insight" className="mt-6 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-400">Yield Increase (NPV)</span>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1 leading-normal">
            Adjustments would result in a <strong className="text-lg font-black font-mono">+{percentageGain}%</strong> increase in cumulative Customer Lifetime Value profits over 5 years.
          </p>
        </div>
      </div>

      {/* Visual Chart Deck */}
      <div id="simulator-visuals-panel" className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h2 id="sim-chart-title" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            NPV Yield Projection Curve
          </h2>
          <p id="sim-chart-desc" className="text-xs text-zinc-500 mt-1">
            Comparing cumulative discounted historical profit generation (Baseline) vs dynamic adjusted configuration (Optimized).
          </p>
        </div>

        {/* Chart Frame */}
        <div id="recharts-simulator-frame" className="h-64 sm:h-76 w-full mt-4 bg-zinc-50/20 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-2.5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#71717a" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfdfdf" className="opacity-40" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} stroke="#888" />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1e24", border: "none", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                formatter={(v) => [`$${v}`, "Profit NPV"]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
              <Area type="monotone" name="Baseline History" dataKey="Baseline" stroke="#71717a" strokeWidth={2} fillOpacity={1} fill="url(#colorBaseline)" />
              <Area type="monotone" name="Simulated Assumed Strategy" dataKey="Optimized" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOptimized)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Side-by-Side Horizon Comparison */}
        <div id="sim-horizons-grid" className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/40 text-center">
          <div id="hz-1yr" className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">1-Year CLV Expected</span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 font-mono line-through">${statsSummary["1y"].b}</span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">${statsSummary["1y"].o}</span>
            </div>
          </div>
          <div id="hz-3yr" className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">3-Year CLV Expected</span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 font-mono line-through">${statsSummary["3y"].b}</span>
              <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">${statsSummary["3y"].o}</span>
            </div>
          </div>
          <div id="hz-5yr" className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">5-Year CLV Expected</span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 font-mono line-through">${statsSummary["5y"].b}</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">${statsSummary["5y"].o}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
