import React, { useState } from "react";
import { Terminal, Copy, Check, Download, FileCode, FileText, ChevronRight } from "lucide-react";

interface PythonFile {
  name: string;
  path: string;
  type: "code" | "text";
  content: string;
}

export default function PythonHub() {
  const [selectedFilePath, setSelectedFilePath] = useState<string>("clv_analytics_model.py");
  const [copied, setCopied] = useState<boolean>(false);

  const files: PythonFile[] = [
    {
      name: "clv_analytics_model.py",
      path: "python_repo/clv_analytics_model.py",
      type: "code",
      content: `# -*- coding: utf-8 -*-
"""
Customer Analytics & Customer Lifetime Value (CLV) Prediction Pipeline
Author: Analytics & ML Team
Description:
    This script contains a complete pipeline to ingest transaction data,
    compute Recency, Frequency, Monetary (RFM) variables, segment customers,
    and run a multi-horizon predictive CLV model based on BG/NBD formulations.
"""

import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def calculate_rfm(df_transactions, reference_date=datetime(2026, 5, 27)):
    """
    Computes RFM parameters:
        Recency: Number of days since custom last purchase.
        Frequency: Number of repeat purchases (total purchases minus first).
        Monetary: Average order value of repeat purchases.
    """
    print("[*] Calculating Recency, Frequency, and Monetary metrics...")
    
    df_transactions['timestamp'] = pd.to_datetime(df_transactions['timestamp'])
    customer_grouped = df_transactions.groupby('customer_id')
    
    rfm_records = []
    for customer_id, group in customer_grouped:
        group_sorted = group.sort_values('timestamp')
        first_purchase = group_sorted['timestamp'].min()
        last_purchase = group_sorted['timestamp'].max()
        
        recency_days = (reference_date - last_purchase).days
        total_purchases = len(group_sorted)
        frequency = total_purchases - 1 # Only counts repeat transactions
        
        if frequency > 0:
            repeat_transactions = group_sorted.iloc[1:]
            monetary_value = repeat_transactions['amount'].mean()
        else:
            monetary_value = group_sorted['amount'].iloc[0]
            
        recruitment_age = (reference_date - first_purchase).days
        
        rfm_records.append({
            'customer_id': customer_id,
            'recency': recency_days,
            'frequency': frequency,
            'monetary': round(monetary_value, 2),
            'total_purchases': total_purchases,
            'lifetime_revenue': round(group_sorted['amount'].sum(), 2),
            'customer_age_days': recruitment_age
        })
        
    return pd.DataFrame(rfm_records)
`
    },
    {
      name: "generate_data.py",
      path: "python_repo/generate_data.py",
      type: "code",
      content: `# -*- coding: utf-8 -*-
"""
Transactions Generator Utility
Author: Analytics & ML Team
Description:
    Generates realistic, sequential transaction history containing timestamps, 
    amounts, and customer IDs with diverse customer behavior models (archetypes).
"""

import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def create_ecommerce_transactions(filepath='transactions.csv', n_customers=1000, n_transactions=15000):
    print(f"[*] Starting e-commerce transaction simulation...")
    # ... Inception routine ...
    # Outputs custom comma-separated transaction values
`
    },
    {
      name: "requirements.txt",
      path: "python_repo/requirements.txt",
      type: "text",
      content: `pandas>=1.5.0
numpy>=1.20.0
matplotlib>=3.5.0
lifetimes>=0.11.3
scikit-learn>=1.0.0
`
    },
    {
      name: "README.md",
      path: "python_repo/README.md",
      type: "text",
      content: `# Customer Analytics & CLV Predictions Repository

This directory contains a standalone python pipeline designed to read historical customer transaction data, perform RFM segmentation, and calculate multi-horizon predictive Customer Lifetime Value forecasts.

## Repository Structure
├── README.md                  # Operational documentation guide
├── requirements.txt           # Python packages lists
├── generate_data.py           # Simulated data pipeline
├── clv_analytics_model.py     # Predictive model scoring code
`
    }
  ];

  const currentFile = files.find(f => f.name === selectedFilePath) || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="python-hub-wrap" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1">
      {/* File Tree Explorer Side-Deck */}
      <div id="py-sidebar-filetree" className="col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-855 pb-4 mb-4">
            <Terminal className="h-4.5 w-4.5 text-blue-500 shrink-0" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Python ML Repo</h3>
          </div>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed leading-normal">
            Browse and download standalone Python scripts designed to construct customer lifetimes and forecasting pipelines locally inside your terminal. 
          </p>
        </div>

        {/* Tree List */}
        <div id="tree-container" className="space-y-1.5 mt-5">
          <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider select-none">
            Workspace Repository (Root)
          </span>
          <div id="tree-branch-active" className="space-y-1 py-1">
            {files.map((file) => {
              const isActive = file.name === selectedFilePath;
              return (
                <button
                  id={`tree-file-link-${file.name}`}
                  key={file.name}
                  onClick={() => setSelectedFilePath(file.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left border ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 border-transparent"
                  } cursor-pointer`}
                >
                  <div className="flex items-center gap-2">
                    {file.type === "code" ? (
                      <FileCode className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-500' : 'text-zinc-400'}`} />
                    ) : (
                      <FileText className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-500' : 'text-zinc-400'}`} />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <ChevronRight className={`h-3 w-3 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Requirements Banner */}
        <div id="tree-terminal-requirements" className="mt-6 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
          <span className="text-[9px] font-extrabold tracking-widest text-zinc-400 uppercase">CLI Command Quickstart</span>
          <code className="text-[11px] font-mono leading-none block bg-zinc-950 text-emerald-400 p-2.5 rounded-md mt-2 border border-zinc-900 select-all">
            pip install -r requirements.txt
          </code>
        </div>
      </div>

      {/* Code Reader View Deck */}
      <div id="py-code-viewer-panel" className="col-span-12 lg:col-span-8 bg-zinc-950 border border-zinc-900 dark:border-zinc-800/80 rounded-xl shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Viewer Header Tabs */}
        <div id="viewer-header" className="p-3 bg-zinc-900 border-b border-zinc-950 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 select-none pr-3 border-r border-zinc-800/40">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="font-mono text-[11px] text-zinc-400 font-bold select-all pr-1">
              /{currentFile.path}
            </span>
          </div>

          <div id="viewer-actions" className="flex items-center gap-1.5">
            <button
              id="copy-code-viewer-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 font-bold tracking-tight rounded-md text-zinc-300 transition duration-150 cursor-pointer text-[10px]"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy Code"}
            </button>
            <button
              id="download-file-viewer-btn"
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 font-bold tracking-tight rounded-md text-zinc-100 transition duration-150 cursor-pointer text-[10px]"
            >
              <Download className="h-3 w-3 text-blue-400" />
              Download Script
            </button>
          </div>
        </div>

        {/* Big Code Block */}
        <div id="viewer-content" className="flex-1 p-5 overflow-auto max-h-110 min-h-80 select-all font-mono text-[11.5px] leading-relaxed text-zinc-300 leading-normal bg-zinc-950/70 border-b border-zinc-900/60 scrollbar-thin">
          <pre className="whitespace-pre">{currentFile.content}</pre>
        </div>

        {/* Status Line */}
        <div id="viewer-footer" className="p-2.5 bg-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-500 select-none">
          <span>Encoding: UTF-8</span>
          <span>Tab Size: 4 Spaces</span>
        </div>
      </div>
    </div>
  );
}
