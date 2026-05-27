import React, { useState, useRef } from "react";
import { Search, SlidersHorizontal, Download, Sparkles, X, ChevronRight, Check, AlertCircle, FileSpreadsheet, Send } from "lucide-react";
import { CustomerRFM, Transaction, SegmentType, CustomerCampaignOutreach } from "../types";
import { SEGMENT_METRICS, processTransactionsToRFM, assignSegment } from "../mockDataUtils";

interface RFMExplorerProps {
  customers: CustomerRFM[];
  transactions: Transaction[];
  onDataLoaded: (newTransactions: Transaction[], newCustomers: CustomerRFM[]) => void;
}

export default function RFMExplorer({ customers, transactions, onDataLoaded }: RFMExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("All");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRFM | null>(null);
  
  // Single-Customer Outreach AI Generation States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<CustomerCampaignOutreach | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // File Upload Handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Filter lists
  const segmentsList = [
    "All",
    "Champions / Power Users",
    "Loyal Customers",
    "Recent Contacts",
    "At Risk: High Frequency",
    "Can't Lose Them",
    "About to Sleep",
    "Hibernating / Lost"
  ];

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = selectedSegment === "All" || c.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  // Simple CSV Ingestion Engine
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error("The file is empty or corrupt.");
        }

        const lines = text.split("\n");
        if (lines.length < 2) {
          throw new Error("Missing transaction data rows inside the file.");
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        
        const custIndex = headers.findIndex(h => h.includes("customer_id") || h === "customer" || h === "client" || h === "userid" || h === "user_id");
        const timeIndex = headers.findIndex(h => h.includes("timestamp") || h.includes("date") || h === "time" || h === "created");
        const amtIndex = headers.findIndex(h => h.includes("amount") || h.includes("price") || h.includes("monetary") || h === "spend" || h === "revenue");
        
        if (custIndex === -1 || timeIndex === -1 || amtIndex === -1) {
          throw new Error("Unable to identify headers automatically. Make sure your CSV has: 'customer_id', 'timestamp', and 'amount' headers.");
        }

        const newParsedTxns: Transaction[] = [];
        let rowCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const rawLine = lines[i].trim();
          if (!rawLine) continue;

          // Simple CSV parser supporting standard quotes
          const columns: string[] = [];
          let currentField = "";
          let insideQuotes = false;
          
          for (let c = 0; c < rawLine.length; c++) {
            const char = rawLine[c];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === "," && !insideQuotes) {
              columns.push(currentField);
              currentField = "";
            } else {
              currentField += char;
            }
          }
          columns.push(currentField);

          const customerId = columns[custIndex]?.trim();
          const timestamp = columns[timeIndex]?.trim();
          const amountValue = columns[amtIndex]?.replace(/[\$"']/g, "")?.trim(); // clean currency signs

          if (customerId && timestamp && amountValue) {
            newParsedTxns.push({
              transaction_id: `TXN-PARSED-${100000 + rowCount++}`,
              customer_id: customerId,
              timestamp,
              amount: parseFloat(amountValue) || 0,
              category: columns[headers.indexOf("category")] || "General"
            });
          }
        }

        if (newParsedTxns.length === 0) {
          throw new Error("Processed zero valid transactions from file rows.");
        }

        // Recompute the local state
        const calculatedCustomers = processTransactionsToRFM(newParsedTxns);
        onDataLoaded(newParsedTxns, calculatedCustomers);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);

      } catch (err: any) {
        setUploadError(err.message || "Failed to process selected CSV dataset.");
      }
    };

    reader.readAsText(file);
  };

  // Generate individual re-engagement newsletter text using server side Gemini implementation
  const triggerAiOutreach = async (customer: CustomerRFM) => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const response = await fetch("/api/personal-reengagement-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customer_id,
          recency: customer.recency,
          frequency: customer.frequency,
          monetary: customer.monetary,
          segment: customer.segment,
          age: customer.customer_age_days
        })
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "The AI models responded with an error.");
      }

      setAiResult(json.data);
    } catch (err: any) {
      setAiError(err.message || "Unable to generate copilot strategy. Make sure your GEMINI_API_KEY is configured.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadSampleTemplateCSV = () => {
    const headers = "customer_id,timestamp,amount,category\n";
    const sampleRows = [
      "CUST-VIP-101,2025-06-15 14:32:00,185.50,Electronics",
      "CUST-VIP-101,2025-08-20 11:20:00,120.00,Subscribes",
      "CUST-VIP-101,2026-03-12 16:45:00,210.00,Electronics",
      "CUST-LOY-102,2025-10-05 09:12:00,68.00,Apparel",
      "CUST-LOY-102,2025-12-25 15:30:00,85.20,Apparel",
      "CUST-LOY-102,2026-04-18 10:14:00,72.40,Groceries",
      "CUST-REC-103,2026-05-10 18:30:00,45.00,Home Goods",
      "CUST-DOR-104,2025-08-01 13:21:00,35.00,Groceries",
      "CUST-SLI-105,2025-11-20 08:30:00,55.00,Groceries",
      "CUST-SLI-105,2026-02-14 14:10:00,60.50,Home Goods"
    ].join("\n");

    const blob = new Blob([headers + sampleRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_customer_transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="rfm-explorer-wrapper" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1">
      {/* Search and Database Upload Deck */}
      <div id="explorer-core-card" className="col-span-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
        <div id="explorer-header-flex" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800/40 pb-5 mb-5">
          <div>
            <h2 id="explorer-title" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              RFM Segment Explorer
            </h2>
            <p id="explorer-desc" className="text-sm text-zinc-500 mt-1">
              Select, query, profile, and upload transaction records for instant cohort slicing.
            </p>
          </div>
          
          <div id="io-action-group" className="flex flex-wrap items-center gap-2">
            <button
              id="download-sample-btn"
              onClick={downloadSampleTemplateCSV}
              className="flex items-center gap-2 px-3.5 py-2 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV Sample
            </button>
            
            <button
              id="upload-data-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-1 w-fit border border-transparent dark:border-transparent text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:opacity-90 transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-sky-400 dark:text-sky-600" />
              Upload Transaction CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>

        {/* Messaging Logs feedback */}
        {uploadError && (
          <div id="upload-error-banner" className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
        {uploadSuccess && (
          <div id="upload-success-banner" className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-3 text-xs">
            <Check className="h-4 w-4 shrink-0" />
            <span>Successfully parsed transactions list! Loaded {customers.length} analytical profiles instantly.</span>
          </div>
        )}

        {/* Searching Filtering deck */}
        <div id="search-filter-controls" className="flex flex-col md:flex-row gap-3 mb-4">
          <div id="search-bar-wrap" className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Customer ID (e.g., CUST-VIP-)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/30 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>
          <div id="segment-filter-wrap" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/30 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-700 dark:text-zinc-300 font-medium"
            >
              {segmentsList.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid List Table */}
        <div id="customer-grid-table-scroll" className="overflow-x-auto border border-zinc-100 dark:border-zinc-800/80 rounded-xl mt-3">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3.5">Customer ID</th>
                <th className="px-5 py-3.5">RFM Score</th>
                <th className="px-5 py-3.5">Segmentation</th>
                <th className="px-5 py-3.5 text-right">Recency (Days)</th>
                <th className="px-5 py-3.5 text-right">Frequency (Orders)</th>
                <th className="px-5 py-3.5 text-right">Monetary Spend</th>
                <th className="px-5 py-3.5 text-right">Total Revenue</th>
                <th className="px-5 py-3.5 text-center">Active Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900/20">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400 font-medium bg-zinc-50/20 dark:bg-transparent">
                    No matching customer keys found or imported. Try modifying filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const m = SEGMENT_METRICS[customer.segment] || SEGMENT_METRICS["Average/Unclassified"];
                  return (
                    <tr
                      id={`cust-row-${customer.customer_id}`}
                      key={customer.customer_id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setAiResult(null);
                        setAiError(null);
                      }}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40 cursor-pointer transition duration-150"
                    >
                      <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {customer.customer_id}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                        {customer.rfm_score}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.color}`}>
                          {customer.segment}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        {customer.recency}d
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-zinc-600 dark:text-zinc-400">
                        {customer.frequency}x
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        ${customer.monetary.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                        ${customer.lifetime_revenue.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${customer.recency < 60 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer / Slide-Over for Customer Detailed Analytics */}
      {selectedCustomer && (
        <div id="drawer-backdrop" className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-fade-in">
          <div
            id="drawer-surface"
            className="w-full max-w-xl bg-white dark:bg-zinc-900 shadow-2xl h-full flex flex-col justify-between overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 animate-slide-in"
          >
            {/* Drawer Header */}
            <div id="drawer-header" className="p-6 border-b border-zinc-100 dark:border-zinc-800/65 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Customer Profile File
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                  {selectedCustomer.customer_id}
                </h3>
              </div>
              <button
                id="close-drawer"
                onClick={() => {
                  setSelectedCustomer(null);
                  setAiResult(null);
                }}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Content */}
            <div id="drawer-body" className="p-6 flex-1 space-y-6">
              {/* Segment detail */}
              <div id="profile-segment-card" className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/10 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-zinc-400">Current Segment Class</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md">
                    RFM Score: {selectedCustomer.rfm_score}
                  </span>
                </div>
                <div>
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${SEGMENT_METRICS[selectedCustomer.segment]?.color}`}>
                    {selectedCustomer.segment}
                  </span>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">
                    {SEGMENT_METRICS[selectedCustomer.segment]?.description}
                  </p>
                </div>
              </div>

              {/* RFM Score breakdown cubes */}
              <div id="rfm-cubes-panel" className="grid grid-cols-3 gap-3">
                <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg text-center bg-white dark:bg-zinc-900/30">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Recency</span>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">{selectedCustomer.recency}d</p>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Last transaction</span>
                </div>
                <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg text-center bg-white dark:bg-zinc-900/30">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Frequency</span>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">{selectedCustomer.frequency}x</p>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Repeat checkouts</span>
                </div>
                <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg text-center bg-white dark:bg-zinc-900/30">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Monetary</span>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">${Math.round(selectedCustomer.monetary)}</p>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Avg order value</span>
                </div>
              </div>

              {/* Historical revenue and activation profiles */}
              <div id="survival-profile-block" className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Metrics & Survival Analysis</h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Historical Revenue Contributed</span>
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">${selectedCustomer.lifetime_revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Account Longevity Age</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedCustomer.customer_age_days} Days</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold">
                      <span>Activity Survival Index (Probability)</span>
                      <span className={selectedCustomer.survival_probability > 0.6 ? 'text-emerald-500' : selectedCustomer.survival_probability > 0.3 ? 'text-amber-500' : 'text-red-500'}>
                        {Math.round(selectedCustomer.survival_probability * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          selectedCustomer.survival_probability > 0.6 ? 'bg-emerald-500' : selectedCustomer.survival_probability > 0.3 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedCustomer.survival_probability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Campaigns / Outreach AI Block */}
              <div id="smart-outreach-block" className="border-t border-zinc-100 dark:border-zinc-800.80 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                    Smart Retention Copilot (Gemini API)
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Draft a personalized, contextual 1-to-1 re-engagement outreach email tailored directly to their current behavior scores.
                </p>

                {!aiResult && !aiLoading && (
                  <button
                    id="generate-copilot-btn"
                    onClick={() => triggerAiOutreach(selectedCustomer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-xs cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                    Write Custom Retention Message
                  </button>
                )}

                {aiLoading && (
                  <div id="ai-loading-box" className="p-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    <span className="text-xs text-zinc-400 font-semibold animate-pulse">Consulting Gemini retention model...</span>
                  </div>
                )}

                {aiError && (
                  <div id="ai-error-box" className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-lg flex items-start gap-2 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold">Generation Failed</span>
                      <p className="font-medium text-zinc-500 dark:text-zinc-400">{aiError}</p>
                    </div>
                  </div>
                )}

                {aiResult && (
                  <div id="ai-result-deck" className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20 rounded-xl space-y-4 animate-fade-in text-xs">
                    <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="font-extrabold text-blue-700 dark:text-blue-400 tracking-wide uppercase text-[10px]">Retention Draft Result</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/40 text-[9px]">
                        Channel: {aiResult.outreachChannel}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold">Subject Line:</span>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{aiResult.subject}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold">Message Content:</span>
                        <div className="p-3 bg-white dark:bg-zinc-950/70 border border-zinc-100 dark:border-zinc-800 font-mono text-[11px] whitespace-pre-wrap rounded-lg text-zinc-700 dark:text-zinc-300 leading-normal max-h-56 overflow-y-auto">
                          {aiResult.body}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        id="copy-text-btn"
                        onClick={() => copyToClipboard(aiResult.body)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                      >
                        {copySuccess ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Send className="h-3.5 w-3.5" />}
                        {copySuccess ? "Copied message!" : "Copy to Clipboard"}
                      </button>
                      <button
                        id="regenerate-msg-btn"
                        onClick={() => triggerAiOutreach(selectedCustomer)}
                        className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                        title="Re-generate layout"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Slideover Footer */}
            <div id="drawer-footer" className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/65 text-center">
              <span className="text-[10px] font-medium text-zinc-400">
                Data generated on snapshot: 2026-05-27 UTC
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
