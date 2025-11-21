"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import React from "react";

// Minimal card wrapper 
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3">
        <h3 className="text-base font-medium">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
}

// Simple metric tile
export function MetricTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

// Colors
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57", "#83a6ed", "#d885a3"];

// Helper safe-getters 
type AnyRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is AnyRecord =>
  !!v && typeof v === "object";

function asNumber(n: unknown, fallback = 0): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

// Maps analysis payload to datasets expected by charts
function buildDatasets(analysis: AnyRecord) {
  // ATV
  const atv = analysis["Average Transaction Value (ATV)"];

  // Gross vs Net
  const gross = asNumber(analysis["Gross Sales Total"]);
  const net = asNumber(analysis["Net Sales Total"]);
  const discountDiff = asNumber(analysis["Discount Difference"]);
  const grossNetData = [
    { label: "Gross Sales", value: gross },
    { label: "Net Sales", value: net },
  ];

  // Tips
  const totalTips = asNumber(analysis["Total Tips"]);
  const tipPct = asNumber(analysis["Tip % of Total Collected"]);
  // If we have total collected, show as donut (tips vs rest). If not, just show a single metric.
  // We don’t have "Total Collected" directly here; infer from tip % if available.
  const totalCollectedApprox = tipPct > 0 ? totalTips / (tipPct / 100) : 0;
  const tipsDonut = totalCollectedApprox > 0
    ? [
        { name: "Tips", value: totalTips },
        { name: "Non-Tips", value: Math.max(totalCollectedApprox - totalTips, 0) },
      ]
    : null;

  // Fees
  const totalFees = asNumber(analysis["Total Payment Fees"]);

  const topItemsSource = Array.isArray(analysis["Top Items by Revenue"])
    ? (analysis["Top Items by Revenue"] as unknown[]).filter(isRecord)
    : [];
  
  const topItems = topItemsSource.map((r) => ({
      name: String(r["Item Name"] ?? r["Item"] ?? r["name"] ?? "Item"),
      revenue: asNumber(r["sum"] ?? r["Net Sales"] ?? r["revenue"]),
      count: asNumber(r["count"] ?? r["qty"] ?? r["quantity"]),
  }));

  // Category Mix
  const categoryMixSource = Array.isArray(analysis["Category Sales Mix"])
    ? (analysis["Category Sales Mix"] as unknown[]).filter(isRecord)
    : [];
  
  const categoryMix = categoryMixSource.map((r) => ({
      category: String(r["Category"] ?? r["category"] ?? r["name"] ?? "Category"),
      value: asNumber(r["Net Sales"] ?? r["sum"] ?? r["value"]),
  }));

  // Size Preference (stacked: pick top N items by volume)
  const sizePrefRaw: AnyRecord[] = Array.isArray(analysis["Size Preference"])
    ? (analysis["Size Preference"] as unknown[]).filter(isRecord)
    : [];

  // Normalize: { item, size, count }
  const sizeRows = sizePrefRaw.map((r) => ({
    item: String(r["Item Name"] ?? r["Item"] ?? r["item"] ?? "Item"),
    size: String(r["Size"] ?? r["size"] ?? "N/A"),
    count: asNumber(r["count"] ?? r["qty"] ?? r["quantity"], 0),
  }));

  // aggregate per item-size
  const aggMap = new Map<string, Record<string, number>>();
  for (const row of sizeRows) {
    const key = row.item;
    const cur = aggMap.get(key) || {};
    cur[row.size] = (cur[row.size] || 0) + row.count;
    aggMap.set(key, cur);
  }
  
  // pick top 5 items by total count
  const totals = Array.from(aggMap.entries()).map(([item, sizes]) => ({
    item,
    total: Object.values(sizes).reduce((a, b) => a + b, 0),
    sizes,
  }));
  totals.sort((a, b) => b.total - a.total);
  const top5 = totals.slice(0, 5);
  // collect stacked keys (sizes)
  const sizeKeys = Array.from(
    new Set(top5.flatMap((t) => Object.keys(t.sizes)))
  );
  const stackedData = top5.map((t) => ({ item: t.item, ...t.sizes }));

  return {
    atv,
    grossNetData,
    discountDiff,
    tipsDonut,
    totalFees,
    topItems: topItems.slice(0, 8),
    categoryMix,
    stackedData,
    sizeKeys,
  };
}

export function PosInsightsCharts({ analysis }: { analysis: AnyRecord }) {
  const {
    atv,
    grossNetData,
    discountDiff,
    tipsDonut,
    totalFees,
    topItems,
    categoryMix,
    stackedData,
    sizeKeys,
  } = buildDatasets(analysis);

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Number.isFinite(atv) && (
          <MetricTile label="Average Transaction Value (ATV)" value={`$${Number(atv).toFixed(2)}`} />
        )}
        {Number.isFinite(totalFees) && (
          <MetricTile label="Payment Processing Cost" value={`$${Number(totalFees).toFixed(2)}`} />
        )}
        {Number.isFinite(discountDiff) && (
          <MetricTile label="Discount Difference (Gross−Net)" value={`$${Number(discountDiff).toFixed(2)}`} />
        )}
      </div>

      {/* Gross vs Net Sales */}
      {grossNetData.some(d => d.value > 0) && (
        <ChartCard
          title="Gross vs. Net Sales"
          subtitle="Compare before/after discounts to see promo cost."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grossNetData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Tip contribution */}
      {tipsDonut && (
        <ChartCard
          title="Tip Contribution"
          subtitle="Share of tips in Total Collected"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                nameKey="name"
                data={tipsDonut}
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={3}
              >
                {tipsDonut.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Top items by revenue */}
      {topItems.length > 0 && (
        <ChartCard
          title="Top Items by Revenue"
          subtitle="Prioritize stock and feature these on menus."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topItems.map(t => ({ name: t.name, revenue: t.revenue }))}
              margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Category sales mix */}
      {categoryMix.length > 0 && (
        <ChartCard
          title="Category Sales Mix"
          subtitle="See which categories drive revenue."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryMix}
                dataKey="value"
                nameKey="category"
                outerRadius="85%"
                paddingAngle={2}
              >
                {categoryMix.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Size preference (stacked, top 5 items) */}
      {stackedData.length > 0 && sizeKeys.length > 0 && (
        <ChartCard
          title="Size Preference (Top Items)"
          subtitle="Helps with cup stock & pricing."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="item" interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              {sizeKeys.map((k, i) => (
                <Bar key={k} dataKey={k} stackId="sizes">
                  <Cell fill={COLORS[i % COLORS.length]} />
                </Bar>
              ))}
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
