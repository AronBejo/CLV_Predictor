export interface Transaction {
  transaction_id: string;
  customer_id: string;
  timestamp: string;
  amount: number;
  category: string;
}

export interface CustomerRFM {
  customer_id: string;
  recency: number;      // Days since last purchase
  frequency: number;    // Repeat purchase count (total - 1)
  monetary: number;     // Average transaction amount
  total_purchases: number;
  lifetime_revenue: number;
  customer_age_days: number;
  
  // Segment details
  r_score: number;      // 1-5
  f_score: number;      // 1-5
  m_score: number;      // 1-5
  rfm_score: string;    // e.g., "534"
  segment: SegmentType;
  survival_probability: number; // calculated active prob
}

export type SegmentType =
  | "Champions / Power Users"
  | "Loyal Customers"
  | "Recent Contacts"
  | "At Risk: High Frequency"
  | "Can't Lose Them"
  | "About to Sleep"
  | "Hibernating / Lost"
  | "Average/Unclassified";

export interface SegmentStats {
  segment: SegmentType;
  count: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  totalRevenue: number;
  percentage: number;
}

export interface CLVPrediction {
  customer_id: string;
  segment: SegmentType;
  originalCLV: number;
  predictions: {
    "1y": number;
    "3y": number;
    "5y": number;
  };
}

export interface SimulationParameters {
  retentionRate: number;      // Annual customer retention e.g., 0.75
  discountRate: number;       // Annual NPV discount rate e.g., 0.08
  averageBasketValue: number;  // Avg purchase amount $
  purchaseFrequency: number;  // Repeat trans per year
  grossMargin: number;        // Avg profit margin % e.g. 0.60
}

export interface CohortCell {
  cohortName: string;         // e.g. "2025-Q1" or "Oct'25"
  size: number;               // Total customer count in cohort
  retentionRates: number[];   // Retention percentages [100.0, 85.2, 70.4, 62.1...]
}

export interface CampaignRecommendation {
  strategicOverview: string;
  keyRecommendations: string[];
  messageTemplateTitle: string;
  messageTemplateBody: string;
}

export interface CustomerCampaignOutreach {
  subject: string;
  outreachChannel: string;
  body: string;
}
