// FIXED: Removed "use server" so it runs in the browser and can read the auth token from localStorage.

import { API_URL } from "@/lib/api";
import { fetchJsonWithAuth } from "@/lib/api-client";

export interface RiskTrendPoint {
  month: string;
  high: number;
  medium: number;
  low: number;
}

export interface ContractTypePoint {
  name: string;
  value: number;
}

export interface CategoryPoint {
  category: string;
  count: number;
}

export interface ActivityPoint {
  id: string;
  name: string;
  date: string;
  status: string;
  riskLevel: string;
}

export interface ClientPoint {
  client: string;
  contractCount: number;
  highRiskCount: number;
}

export interface AnalyticsData {
  riskTrends: RiskTrendPoint[];
  contractTypes: ContractTypePoint[];
  highRiskClausesByCategory: CategoryPoint[];
  recentActivity: ActivityPoint[];
  topClients: ClientPoint[];
}

// FIXED: Robust helper to check all possible fields for contract type 
// so it doesn't just default to "Other" or "General Contract"
function getContractType(c: any): string {
  const type =
    c.contract_type ||
    c.document_type ||
    c.type ||
    c.category ||
    c.legal_bert_response?.contract_type ||
    c.legal_bert_response?.document_type ||
    c.legal_bert_response?.type ||
    c.metadata?.contract_type ||
    c.metadata?.document_type ||
    c.metadata?.type ||
    c.legal_bert_response?.metadata?.contract_type;

  return typeof type === "string" && type.trim() !== "" ? type : "Other";
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    // FIXED: Removed hidden newline in URL
    const contracts = await fetchJsonWithAuth<any[]>(`${API_URL}/contracts`, {
      method: "GET",
    });

    const riskTrendsMap = new Map<
      string,
      { high: number; medium: number; low: number; sortKey: string; month: string }
    >();
    const contractTypesMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();
    const clientMap = new Map<string, { contractCount: number; highRiskCount: number }>();
    const activities: ActivityPoint[] = [];

    for (const c of contracts) {
      const dateStr = c.date || c.created_at || new Date().toISOString();
      const dateObj = new Date(dateStr);
      const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
      const monthDisplay = dateObj.toLocaleString("default", { month: "short", year: "2-digit" });

      const riskRaw =
        c.legal_bert_response?.risk_analysis?.risk_level || c.risk_level || "Low";
      const risk = String(riskRaw).toLowerCase() as "high" | "medium" | "low";

      const existing = riskTrendsMap.get(sortKey);
      const trend =
        existing ||
        ({ high: 0, medium: 0, low: 0, sortKey, month: monthDisplay } as {
          high: number;
          medium: number;
          low: number;
          sortKey: string;
          month: string;
        });

      if (risk === "high") trend.high++;
      else if (risk === "medium") trend.medium++;
      else trend.low++;

      riskTrendsMap.set(sortKey, { ...trend, month: monthDisplay });

      // FIXED: Use the robust helper to get the actual contract type
      const type = getContractType(c);
      contractTypesMap.set(type, (contractTypesMap.get(type) || 0) + 1);

      const unfavorable = c.legal_bert_response?.unfavorable_terms || [];
      for (const term of unfavorable) {
        if (
          term.severity === "high" ||
          (typeof term.risk_score === "number" && term.risk_score >= 50)
        ) {
          const cat = term.category || "Other";
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        }
      }

      const client = c.client || "Unknown";
      const clientStats = clientMap.get(client) || { contractCount: 0, highRiskCount: 0 };
      clientStats.contractCount++;
      if (risk === "high") clientStats.highRiskCount++;
      clientMap.set(client, clientStats);

      activities.push({
        id: c._id?.$oid || c.id || Math.random().toString(36).slice(2),
        name: c.name || "Untitled Contract",
        date: dateStr.split("T")[0],
        status: c.status || "Pending",
        riskLevel: risk.charAt(0).toUpperCase() + risk.slice(1),
      });
    }

    const riskTrends = Array.from(riskTrendsMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);

    const contractTypes = Array.from(contractTypesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const highRiskClausesByCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const recentActivity = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const topClients = Array.from(clientMap.entries())
      .map(([client, stats]) => ({ client, ...stats }))
      .sort((a, b) => b.highRiskCount - a.highRiskCount)
      .slice(0, 5);

    return {
      riskTrends,
      contractTypes,
      highRiskClausesByCategory,
      recentActivity,
      topClients,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
}

