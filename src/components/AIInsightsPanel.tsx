import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, ArrowRight, Check, Send, AlertCircle, Copy } from "lucide-react";
import { SegmentStats, CampaignRecommendation } from "../types";

interface AIInsightsPanelProps {
  segmentStats: SegmentStats[];
}

export default function AIInsightsPanel({ segmentStats }: AIInsightsPanelProps) {
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<CampaignRecommendation | null>(null);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Default initial configuration selection
  useEffect(() => {
    if (segmentStats.length > 0 && !selectedSegment) {
      setSelectedSegment(segmentStats[0].segment);
    }
  }, [segmentStats, selectedSegment]);

  const handleFetchInsights = async (segmentName: string) => {
    const statsObj = segmentStats.find(s => s.segment === segmentName);
    if (!statsObj) return;

    setLoading(true);
    setErrorString(null);
    setRecommendation(null);

    try {
      const response = await fetch("/api/smart-campaign-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment: segmentName,
          stats: statsObj
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "The AI system failed to compile response.");
      }

      setRecommendation(result.data);
    } catch (err: any) {
      setErrorString(err.message || "An error occurred calling the Gemini AI engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSegment) {
      handleFetchInsights(selectedSegment);
    }
  }, [selectedSegment]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div id="ai-insights-panel-wrapper" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1">
      {/* Control Segment selector tabs */}
      <div id="ai-insights-tabs-panel" className="col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-855 pb-4 mb-4">
            <Sparkles className="h-4.5 w-4.5 text-blue-500 shrink-0" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Growth Intelligence</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-normal mb-5 font-medium">
            Select a target customer catalog segment. Our multi-model agent inspects their Recency ratios and checkout bounds to synthesize custom retention blueprints.
          </p>

          {/* Segment selection tabs list */}
          <div id="segment-tabs-list" className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {segmentStats.map((stat) => {
              const isSelected = stat.segment === selectedSegment;
              return (
                <button
                  id={`tab-segment-${stat.segment}`}
                  key={stat.segment}
                  onClick={() => setSelectedSegment(stat.segment)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 text-left rounded-lg transition-all border text-xs cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 font-extrabold"
                      : "bg-white dark:bg-zinc-900 hover:bg-zinc-50/60 dark:hover:bg-zinc-850/40 border-zinc-100 dark:border-zinc-800/40 text-zinc-700 dark:text-zinc-400 font-semibold"
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="truncate block font-bold text-zinc-800 dark:text-zinc-100">{stat.segment}</span>
                    <span className="text-[10px] text-zinc-400 select-none">{stat.count} customers ({stat.percentage}%)</span>
                  </div>
                  <ArrowRight className={`h-3 w-3 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Small AI Credit line */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-855 text-[10px] text-zinc-400 text-center font-medium select-none">
          Powered securely by Google Gemini 3.5 Flash server-side.
        </div>
      </div>

      {/* Recommendations details card */}
      <div id="ai-insights-details-panel" className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs min-h-120 flex flex-col justify-between">
        {loading ? (
          <div id="insights-loading" className="flex-1 flex flex-col items-center justify-center space-y-4 p-20 select-none">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="text-xs font-semibold text-zinc-400 animate-pulse">Running retention audit model...</span>
          </div>
        ) : errorString ? (
          <div id="insights-error" className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 shrink-0" />
            <span className="text-sm font-extrabold text-red-600 dark:text-red-400 text-center">Incomplete Pipeline</span>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-sm leading-relaxed font-medium">
              {errorString}
            </p>
          </div>
        ) : recommendation ? (
          <div id="recommendation-content" className="space-y-6 animate-fade-in text-xs leading-normal">
            {/* Header section */}
            <div>
              <span className="text-[10px] px-2 py-0.5 font-extrabold tracking-wider bg-blue-100/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-900 uppercase">
                Strategic Alignment Insights
              </span>
              <p className="text-sm text-zinc-650 dark:text-zinc-350 mt-3 font-semibold text-zinc-700 leading-relaxed">
                {recommendation.strategicOverview}
              </p>
            </div>

            {/* Tactical bullets */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Target Retention Tactics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendation.keyRecommendations.slice(0, 3).map((item, index) => (
                  <div key={index} className="p-3 bg-zinc-50 dark:bg-zinc-950/20 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col justify-between">
                    <span className="font-extrabold text-[10px] text-zinc-400 block pb-1">Tactic 0{index + 1}</span>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs mt-1 leading-normal pr-1">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Outreach copy preview card */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/15 rounded-xl overflow-hidden mt-4">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50 p-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-zinc-450 dark:text-zinc-400">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  Outreach Copy Template
                </div>
                <button
                  id="copy-template-insights-btn"
                  onClick={() => copyToClipboard(recommendation.messageTemplateBody)}
                  className="flex items-center gap-1 py-1 px-2 hover:bg-zinc-200 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded font-bold text-zinc-600 dark:text-zinc-300 transition text-[9px] cursor-pointer"
                >
                  {copySuccess ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copySuccess ? "Copied" : "Copy Template"}
                </button>
              </div>
              <div className="p-4 space-y-2.5 bg-white dark:bg-zinc-900/60">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block">Recommended Subject Line</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{recommendation.messageTemplateTitle}</p>
                </div>
                <div className="border-t border-dashed border-zinc-100 dark:border-zinc-855 pt-3.5 mt-2 max-h-48 overflow-y-auto font-mono text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {recommendation.messageTemplateBody}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 select-none">
            <Sparkles className="h-10 w-10 text-zinc-350 dark:text-zinc-650" />
            <span className="text-xs font-semibold text-zinc-400">Select any target segment to initiate retention model predictions.</span>
          </div>
        )}
      </div>
    </div>
  );
}
