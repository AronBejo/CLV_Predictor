import { Transaction, CustomerRFM, SegmentType, SegmentStats, CohortCell } from "./types";

// Generates a realistic set of initial transactions for offline fallback
export function generateInitialMockData(): { transactions: Transaction[]; customers: CustomerRFM[] } {
  const transactions: Transaction[] = [];
  const referenceDate = new Date("2026-05-27");
  
  // Custom archetypes definition
  const archetypes: { name: string; count: number; avgOrder: number; freqDays: number; retention: number }[] = [
    { name: "VIP", count: 40, avgOrder: 175, freqDays: 14, retention: 0.92 },
    { name: "Loyal Enthusiasts", count: 80, avgOrder: 70, freqDays: 28, retention: 0.85 },
    { name: "Recent Starters", count: 50, avgOrder: 45, freqDays: 45, retention: 0.70 },
    { name: "Decline / Slipping", count: 60, avgOrder: 55, freqDays: 75, retention: 0.40 },
    { name: "Dormant / One-timers", count: 70, avgOrder: 30, freqDays: 180, retention: 0.10 }
  ];

  const categories = ["Electronics", "Apparel", "Home Goods", "Groceries", "Subscribes"];
  let tIdCounter = 40001;

  for (const arch of archetypes) {
    for (let c = 1; c <= arch.count; c++) {
      const customerId = `CUST-${arch.name.substring(0, 3).toUpperCase()}-${100 + c}`;
      
      // Determine subscription age
      const joinedDaysAgo = Math.floor(Math.random() * 340) + 25; // 25 to 365 days ago
      const signupDate = new Date();
      signupDate.setDate(referenceDate.getDate() - joinedDaysAgo);
      
      // First transaction
      const firstAmount = Math.max(10, Math.floor(arch.avgOrder * (0.8 + Math.random() * 0.4)));
      transactions.push({
        transaction_id: `TXN-${tIdCounter++}`,
        customer_id: customerId,
        timestamp: signupDate.toISOString().replace("T", " ").substring(0, 19),
        amount: firstAmount,
        category: categories[Math.floor(Math.random() * categories.length)]
      });

      // Subsequent repeat transactions
      let currDate = new Date(signupDate);
      currDate.setDate(currDate.getDate() + Math.floor(Math.random() * arch.freqDays) + 1);

      while (currDate <= referenceDate) {
        // Probability of a repeat order depends on custom survival parameters
        const ageSinceRegister = (currDate.getTime() - signupDate.getTime()) / (1000 * 3600 * 24);
        const survivalChance = Math.pow(arch.retention, ageSinceRegister / 365);
        
        if (Math.random() < survivalChance) {
          const transactionAmount = Math.max(8, Math.floor(arch.avgOrder * (0.75 + Math.random() * 0.5)));
          transactions.push({
            transaction_id: `TXN-${tIdCounter++}`,
            customer_id: customerId,
            timestamp: currDate.toISOString().replace("T", " ").substring(0, 19),
            amount: transactionAmount,
            category: categories[Math.floor(Math.random() * categories.length)]
          });
          
          // Random delay to next possible event
          const gap = Math.max(4, Math.floor(arch.freqDays * (0.5 + Math.random() * 1.0)));
          currDate.setDate(currDate.getDate() + gap);
        } else {
          // Customer churned, break active loop
          break;
        }
      }
    }
  }

  // Sort transactions chronologically
  transactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Parse RFM lists
  const customers = processTransactionsToRFM(transactions, referenceDate);
  return { transactions, customers };
}

// Computes RFM vectors and slices customers into percentiles 1-5
export function processTransactionsToRFM(transactions: Transaction[], refDate: Date = new Date("2026-05-27")): CustomerRFM[] {
  if (transactions.length === 0) return [];
  
  const customerMap = new Map<string, { timestamps: Date[]; amounts: number[] }>();
  
  transactions.forEach(t => {
    if (!customerMap.has(t.customer_id)) {
      customerMap.set(t.customer_id, { timestamps: [], amounts: [] });
    }
    const val = customerMap.get(t.customer_id)!;
    val.timestamps.push(new Date(t.timestamp));
    val.amounts.push(t.amount);
  });

  const rawRfm: {
    customer_id: string;
    recency: number;
    frequency: number;
    monetary: number;
    total_purchases: number;
    lifetime_revenue: number;
    customer_age_days: number;
  }[] = [];

  customerMap.forEach((data, customerId) => {
    const sortedTimestamps = [...data.timestamps].sort((a, b) => a.getTime() - b.getTime());
    const firstDate = sortedTimestamps[0];
    const lastDate = sortedTimestamps[sortedTimestamps.length - 1];
    
    const recency = Math.max(0, Math.floor((refDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)));
    const ageDays = Math.max(1, Math.floor((refDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)));
    const totalPurchases = data.amounts.length;
    const frequency = Math.max(0, totalPurchases - 1); // Counts repeat interactions
    
    // Monetary: if repeat buyers, average order of repeate purchases; else first purchase amount
    let monetary = 0;
    if (frequency > 0) {
      const sumRepeat = data.amounts.slice(1).reduce((sum, val) => sum + val, 0);
      monetary = sumRepeat / frequency;
    } else {
      monetary = data.amounts[0] || 0;
    }

    const lifetimeRevenue = data.amounts.reduce((sum, val) => sum + val, 0);

    rawRfm.push({
      customer_id: customerId,
      recency,
      frequency,
      monetary: Math.round(monetary * 100) / 100,
      total_purchases: totalPurchases,
      lifetime_revenue: Math.round(lifetimeRevenue * 100) / 100,
      customer_age_days: ageDays
    });
  });

  if (rawRfm.length === 0) return [];

  // Implement quantile sorting (1 to 5 scoring)
  const sortedByRecency = [...rawRfm].sort((a, b) => a.recency - b.recency); // lower is better
  const sortedByFrequency = [...rawRfm].sort((a, b) => a.frequency - b.frequency); // higher is better
  const sortedByMonetary = [...rawRfm].sort((a, b) => a.monetary - b.monetary); // higher is better

  const findQuintileScore = (index: number, total: number, invert = false): number => {
    const fraction = index / total;
    let score = 1;
    if (fraction < 0.2) score = 1;
    else if (fraction < 0.4) score = 2;
    else if (fraction < 0.6) score = 3;
    else if (fraction < 0.8) score = 4;
    else score = 5;

    return invert ? (6 - score) : score;
  };

  const finalCustomers: CustomerRFM[] = rawRfm.map(customer => {
    const rIdx = sortedByRecency.findIndex(x => x.customer_id === customer.customer_id);
    const fIdx = sortedByFrequency.findIndex(x => x.customer_id === customer.customer_id);
    const mIdx = sortedByMonetary.findIndex(x => x.customer_id === customer.customer_id);
    
    // For Recency, the lowest days get score 5 (the best), highest days get 1 (invert = true)
    const r_score = findQuintileScore(rIdx, rawRfm.length, true);
    const f_score = findQuintileScore(fIdx, rawRfm.length, false);
    const m_score = findQuintileScore(mIdx, rawRfm.length, false);
    
    const rfm_score = `${r_score}${f_score}${m_score}`;
    const segment = assignSegment(r_score, f_score);
    
    // Survival estimation modeling based on recency lag
    const survival_probability = Math.round(Math.exp(-customer.recency * 0.005) * 100) / 100;

    return {
      ...customer,
      r_score,
      f_score,
      m_score,
      rfm_score,
      segment,
      survival_probability
    };
  });

  return finalCustomers;
}

// Maps cell triggers 1-5 matrix to segment names
export function assignSegment(r: number, f: number): SegmentType {
  if ((r === 4 || r === 5) && (f === 4 || f === 5)) {
    return "Champions / Power Users";
  } else if ((r === 3 || r === 4 || r === 5) && (f === 2 || f === 3)) {
    return "Loyal Customers";
  } else if ((r === 4 || r === 5) && f === 1) {
    return "Recent Contacts";
  } else if (r === 3 && (f === 4 || f === 5)) {
    return "At Risk: High Frequency";
  } else if ((r === 1 || r === 2) && (f === 4 || f === 5)) {
    return "Can't Lose Them";
  } else if (r === 2 && (f === 2 || f === 3)) {
    return "About to Sleep";
  } else if (r === 1 && (f === 1 || f === 2)) {
    return "Hibernating / Lost";
  } else {
    return "Average/Unclassified";
  }
}

// Standard segment configurations (ideal color schemes and marketing priorities)
export const SEGMENT_METRICS: Record<
  SegmentType,
  { color: string; description: string; priority: string; icon: string }
> = {
  "Champions / Power Users": {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    description: "Your best repeat shoppers. Active purchase cadences, high spending.",
    priority: "Fidelity Programs & Beta Access. Cross-sell early.",
    icon: "Crown"
  },
  "Loyal Customers": {
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    description: "Highly repeat customers. Responsive to brand campaigns.",
    priority: "Upsell premium bundles, prompt reviews, loyalty badges.",
    icon: "Heart"
  },
  "Recent Contacts": {
    color: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    description: "Newly acquired accounts with single purchase activity.",
    priority: "Welcome sequences, dynamic product guides, discount triggers.",
    icon: "Sparkles"
  },
  "At Risk: High Frequency": {
    color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    description: "Frequent repeat consumers who haven't ordered in weeks.",
    priority: "Trigger personal re-activation vouchers, feedback calls.",
    icon: "AlertTriangle"
  },
  "Can't Lose Them": {
    color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    description: "High spending customers with high recency, indicating high churn risk.",
    priority: "Exclusive priority support credits, direct high-value outreach.",
    icon: "Flame"
  },
  "About to Sleep": {
    color: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    description: "Below average frequency/recency scores. Slipping away.",
    priority: "Highly discounted inventory clearances, seasonal collections.",
    icon: "Moon"
  },
  "Hibernating / Lost": {
    color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-850 dark:text-zinc-300 dark:border-zinc-850",
    description: "Dormant for months, low frequency. High probability of complete churn.",
    priority: "Low-frequency email list updates, dynamic win-back campaigns.",
    icon: "UserX"
  },
  "Average/Unclassified": {
    color: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-300 dark:border-zinc-800",
    description: "General customer distribution matching average baselines.",
    priority: "Nurturing series and seasonal newsletters.",
    icon: "ShieldAlert"
  }
};

// Calculates Aggregate metrics by segment
export function calculateSegmentStats(customers: CustomerRFM[]): SegmentStats[] {
  const segmentStatsMap = new Map<SegmentType, { count: number; recIndex: number; freqIndex: number; monIndex: number; revenue: number }>();
  
  // Initialize map
  const segmentsList: SegmentType[] = [
    "Champions / Power Users",
    "Loyal Customers",
    "Recent Contacts",
    "At Risk: High Frequency",
    "Can't Lose Them",
    "About to Sleep",
    "Hibernating / Lost",
    "Average/Unclassified"
  ];
  
  segmentsList.forEach(seg => {
    segmentStatsMap.set(seg, { count: 0, recIndex: 0, freqIndex: 0, monIndex: 0, revenue: 0 });
  });

  customers.forEach(c => {
    const stats = segmentStatsMap.get(c.segment)!;
    stats.count++;
    stats.recIndex += c.recency;
    stats.freqIndex += c.frequency;
    stats.monIndex += c.monetary;
    stats.revenue += c.lifetime_revenue;
  });

  const totalCustomers = customers.length || 1;
  const result: SegmentStats[] = [];

  segmentStatsMap.forEach((data, segment) => {
    if (data.count === 0) return; // filter clean
    result.push({
      segment,
      count: data.count,
      avgRecency: Math.round(data.recIndex / data.count),
      avgFrequency: Math.round((data.freqIndex / data.count) * 10) / 10,
      avgMonetary: Math.round((data.monIndex / data.count) * 100) / 100,
      totalRevenue: Math.round(data.revenue * 100) / 100,
      percentage: Math.round((data.count / totalCustomers) * 1000) / 10
    });
  });

  return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// Custom CLV Mathematical calculations using simulated horizons
export function forecastCLV(
  customer: CustomerRFM,
  retentionRate: number,
  discountRate: number,
  margin: number,
  horizonYears: number
): number {
  // Monthly conversion rates
  const monthlyRetention = Math.pow(retentionRate, 1 / 12);
  const monthlyDiscount = Math.pow(1 + discountRate, 1 / 12) - 1;
  
  // Monthly expected repeat purchase frequency (based on historic values)
  const monthlyFreq = Math.max(0.1, customer.frequency / Math.max(1, customer.customer_age_days / 30.0));
  
  // Base initial survival chance decreases with days dormant (recency)
  const initialSurvival = Math.exp(-customer.recency * 0.005);
  
  let NPV = 0;
  const months = horizonYears * 12;

  for (let m = 1; m <= months; m++) {
    // Correct probability of being an active, repeat buyer in month m
    const probActive = initialSurvival * Math.pow(monthlyRetention, m);
    // Expected gross purchasing cashflow in month m
    const cashflow = customer.monetary * monthlyFreq * probActive;
    // Margined profit cashflow
    const profit = cashflow * margin;
    // NPV Dynamic discounting
    NPV += profit / Math.pow(1 + monthlyDiscount, m);
  }

  return Math.round(NPV * 100) / 100;
}

// Generate static Cohort Analysis Heatmap array
export function generateCohortRetentionData(): CohortCell[] {
  return [
    { cohortName: "Dec 2025", size: 120, retentionRates: [100.0, 88.3, 76.2, 70.1, 65.4, 58.0] },
    { cohortName: "Jan 2026", size: 145, retentionRates: [100.0, 84.8, 71.5, 68.2, 61.0, 0] },
    { cohortName: "Feb 2026", size: 180, retentionRates: [100.0, 81.2, 69.3, 62.4, 0, 0] },
    { cohortName: "Mar 2026", size: 165, retentionRates: [100.0, 78.4, 64.1, 0, 0, 0] },
    { cohortName: "Apr 2026", size: 195, retentionRates: [100.0, 75.0, 0, 0, 0, 0] },
    { cohortName: "May 2026", size: 210, retentionRates: [100.0, 0, 0, 0, 0, 0] }
  ];
}
