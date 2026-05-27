import React, { useState } from "react";
import { Grid, Eye, Calendar, Sparkles } from "lucide-react";
import { generateCohortRetentionData } from "../mockDataUtils";

export default function CohortHeatmap() {
  const cohortData = generateCohortRetentionData();
  const [selectedCell, setSelectedCell] = useState<{ cohort: string; month: number; rate: number; size: number } | null>(null);

  // Heatmap styling builder
  const getHeatmapColorClass = (rate: number, isStarting: boolean) => {
    if (isStarting || rate === 100) {
      return "bg-blue-600 dark:bg-blue-700 text-white font-extrabold";
    }
    if (rate === 0) {
      return "bg-zinc-50 dark:bg-zinc-950/20 text-zinc-300 dark:text-zinc-800 border-none select-none";
    }
    
    if (rate >= 80) return "bg-emerald-500/95 dark:bg-emerald-950/80 text-white font-bold border-emerald-400/20";
    if (rate >= 70) return "bg-emerald-400/80 text-emerald-950 dark:text-emerald-100 font-semibold border-emerald-300/20";
    if (rate >= 60) return "bg-amber-100 text-amber-900 border-amber-200";
    if (rate >= 50) return "bg-amber-200/90 text-amber-900 border-amber-300";
    return "bg-rose-50/90 text-rose-800 border-rose-100";
  };

  const explainCellAction = (cohort: string, mIdx: number, rate: number, size: number) => {
    if (rate === 0) return;
    setSelectedCell({ cohort, month: mIdx, rate, size });
  };

  return (
    <div id="cohort-heatmap-panel" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
      <div id="cohort-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 dark:border-zinc-855 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="h-4.5 w-4.5 text-blue-500 shrink-0" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Cohort Retention Matrix</h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Track user re-purchase probabilities organized by signup months. Hover or click cells to drill down.
          </p>
        </div>

        {/* Legend Panel */}
        <div id="cohort-legend" className="flex items-center flex-wrap gap-3 text-[10px] uppercase font-bold text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded bg-blue-600" />
            Sign-up (100)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500" />
            Strong (&gt;80)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded bg-amber-100 border border-amber-250" />
            Caution (50-70)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded bg-rose-50 border border-rose-150" />
            Fragile (&lt;50)
          </span>
        </div>
      </div>

      <div id="heatmap-flex-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Retention Heat Table */}
        <div id="heatmap-scrollable-box" className="col-span-12 lg:col-span-8 overflow-x-auto border border-zinc-100 dark:border-zinc-800/60 rounded-xl max-w-full">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800/80 text-center text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3.5 text-left text-zinc-700 dark:text-zinc-300">Cohort Month</th>
                <th className="px-4 py-3.5">Cohort Size</th>
                <th className="px-3 py-3.5">Month 0</th>
                <th className="px-3 py-3.5">Month 1</th>
                <th className="px-3 py-3.5">Month 2</th>
                <th className="px-3 py-3.5">Month 3</th>
                <th className="px-3 py-3.5">Month 4</th>
                <th className="px-3 py-3.5">Month 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900/30 font-semibold">
              {cohortData.map((row) => (
                <tr key={row.cohortName} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                  <td className="px-4 py-3 text-left font-black text-zinc-800 dark:text-zinc-100">
                    {row.cohortName}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-400 dark:text-zinc-500 font-mono">
                    {row.size} clients
                  </td>
                  {row.retentionRates.map((rate, mIdx) => (
                    <td
                      key={mIdx}
                      onClick={() => explainCellAction(row.cohortName, mIdx, rate, row.size)}
                      className={`px-3 py-2 border border-zinc-100/40 dark:border-zinc-800/20 text-[11px] h-10 w-16 transition-all duration-150 relative cursor-pointer ${getHeatmapColorClass(rate, mIdx === 0)}`}
                    >
                      {rate > 0 ? `${rate}%` : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Cell drill-down analytics */}
        <div id="cohort-info-box" className="col-span-12 lg:col-span-4 bg-zinc-50/50 dark:bg-zinc-950/10 border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 min-h-60 flex flex-col justify-between">
          {selectedCell ? (
            <div id="ct-detail-selected" className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-850 pb-3">
                <Calendar className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Cohort Deep-Dive</h4>
              </div>

              <div className="space-y-3 font-medium text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                <div className="flex justify-between">
                  <span>Sign-up Group:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100 text-sm">{selectedCell.cohort}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Users Base:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedCell.size} customers</strong>
                </div>
                <div className="flex justify-between">
                  <span>Observation Interval:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">Month {selectedCell.month}</strong>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-zinc-200 dark:border-zinc-850 pt-3 mt-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Active Retention Rate:</span>
                  <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 bg-blue-100/40 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {selectedCell.rate}%
                  </span>
                </div>
              </div>

              {/* Dynamic advice triggers */}
              <div id="cohort-smart-insight" className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500 mt-4 leading-relaxed">
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 mb-1">
                  <Sparkles className="h-3 w-3" /> Recommended Action
                </span>
                {selectedCell.month === 1 && selectedCell.rate < 85 ? (
                  <span>First-month drop off indicates high initial onboarding churn. Boost initial onboarding feedback surveys or welcome coupon series.</span>
                ) : selectedCell.month >= 3 && selectedCell.rate < 65 ? (
                  <span>Third-month churn stems from typical usage expirations. Automate renewal notices or target them with highly personalized accessory catalogs.</span>
                ) : (
                  <span>Consistent retention trends. Target VIP subsets in this cohort with early beta testing privileges or refer-a-friend bonuses.</span>
                )}
              </div>
            </div>
          ) : (
            <div id="ct-detail-empty" className="h-full flex flex-col justify-center items-center text-center p-6 space-y-3">
              <Eye className="h-8 w-8 text-zinc-350 dark:text-zinc-650" />
              <span className="text-xs font-semibold text-zinc-400 select-none">
                Interact with the grid cell values to analyze segment-specific dropoffs in depth.
              </span>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-zinc-100/60 dark:border-zinc-800 text-[10px] font-medium text-zinc-400 text-center select-none">
            Retention cohorts decay rate calculated dynamically.
          </div>
        </div>
      </div>
    </div>
  );
}
