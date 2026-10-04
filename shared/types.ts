// Shapes exchanged between the API and the React app.

export type ProductStatus = 'draft' | 'published' | 'archived';
export type Device = 'Mobile' | 'Desktop' | 'Tablet';

export const CATEGORIES = [
  'Tech & Gadgets',
  'Desk & Office',
  'Home & Living',
  'Quirky Finds',
  'Fun & Novelty',
] as const;

/** What visitors see. Affiliate URLs are never exposed — visitors go through /r/:id. */
export interface PublicProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  badge: string | null;
  featured: boolean;
  store: string; // e.g. "amazon.in", for the "View on Amazon.in" label
  createdAt: string;
}

/** Full record for the owner hub. */
export interface Product extends PublicProduct {
  imagePublicId: string | null;
  affiliateUrl: string;
  affiliateTag: string | null;
  subId: string | null;
  status: ProductStatus;
  sortOrder: number;
  updatedAt: string;
  linkHealthy: boolean; // destination passes the current trusted-host policy
}

export interface ClickRecord {
  id: string;
  productId: string | null;
  productTitle: string;
  category: string;
  occurredAt: string;
  referrer: string;
  device: Device;
  country: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export interface AnalyticsSummary {
  retentionDays?: number;
  range: { from: string; to: string; days: number; timezone: string };
  generatedAt: string;
  totals: {
    clicks: number;
    visitorDays: number; // distinct daily anonymous fingerprints (not people)
    conversions: number;
    conversionRate: number; // percent
    clicksToday: number;
    previousPeriodClicks: number;
  };
  byDay: { date: string; clicks: number; conversions: number }[];
  topProducts: { productId: string | null; title: string; clicks: number; conversions: number; conversionRate: number; imageUrl: string | null }[];
  breakdowns: {
    category: { key: string; clicks: number; percentage: number }[];
    device: { key: string; clicks: number; percentage: number }[];
    referrer: { key: string; clicks: number; percentage: number }[];
    country: { key: string; clicks: number; percentage: number }[];
  };
  recentClicks: ClickRecord[];
}

export interface OwnerProfile {
  id: string;
  email: string;
  displayName: string;
  needsPasskey: boolean; // signed in via recovery code — must add a passkey
}

export interface PasskeyInfo {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  backedUp: boolean;
}

export interface AuditEntry {
  id: string;
  occurredAt: string;
  actor: string | null;
  action: string;
  target: string | null;
  result: 'success' | 'failure';
}

export interface ApiError {
  error: string;
  correlationId?: string;
  fields?: Record<string, string>;
}
