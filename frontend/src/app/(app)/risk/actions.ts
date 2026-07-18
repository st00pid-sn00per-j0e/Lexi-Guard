// IMPORTANT: DO NOT add "use server" here. It must run in the browser to access localStorage.

import { API_URL } from "@/lib/api";
import { fetchJsonWithAuth } from "@/lib/api-client";

export interface RiskDistribution {
  high: number;
  medium: number;
  low: number;
  total: number;
  highPercent: number;
  mediumPercent: number;
  lowPercent: number;
}

export interface HighRiskClause {
  id: string;
  text: string;
  contract: string;
  category: string;
  severity: string;
  riskScore: number;
}

export interface CategoryScore {
  category: string;
  score: number;
}

export interface RiskAnalysisData {
  distribution: RiskDistribution;
  highRiskClauses: HighRiskClause[];
  categoryScores: CategoryScore[];
}

function titleizeCategoryKey(categoryKey: string) {
  return categoryKey
    .split("_")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

export async function getRiskAnalysisData(): Promise<RiskAnalysisData> {
  try {
    const contracts = await fetchJsonWithAuth<any[]>(`${API_URL}/contracts`, {
      method: "GET",
    });

    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    const highRiskClauses: HighRiskClause[] = [];
    const categoryScoresMap = new Map<string, { total: number; count: number }>();

    for (const contract of contracts) {
      const rawRiskLevel =
        contract.legal_bert_response?.risk_analysis?.risk_level ||
        contract.risk_level ||
        "Low";
      const riskLevel = String(rawRiskLevel).toLowerCase();

      if (riskLevel === "high") highCount++;
      else if (riskLevel === "medium") mediumCount++;
      else lowCount++;

      const unfavorableTerms = contract.legal_bert_response?.unfavorable_terms || [];
      for (const term of unfavorableTerms) {
        const severity = term?.severity;
        const riskScore = typeof term?.risk_score === "number" ? term.risk_score : 0;

        if (severity === "high" || (typeof term?.risk_score === "number" && term.risk_score >= 50)) {
          highRiskClauses.push({
            id: `${contract.id || contract._id || contract.name || "contract"}-${term?.term?.replace(/\s+/g, "-") || "term"}`,
            text:
              term?.specific_text ||
              term?.term ||
              term?.explanation ||
              "High risk term detected",
            contract: contract.name || contract.id || "Unknown Contract",
            category: term?.category || "General",
            severity: term?.severity || "high",
            riskScore,
          });
        }
      }

      const categoryScores = contract.legal_bert_response?.risk_analysis?.category_scores || {};

      for (const [category, score] of Object.entries(categoryScores)) {
        if (typeof score === "number") {
          const existing = categoryScoresMap.get(category) || { total: 0, count: 0 };
          categoryScoresMap.set(category, {
            total: existing.total + score,
            count: existing.count + 1,
          });
        }
      }
    }

    const total = highCount + mediumCount + lowCount;

    highRiskClauses.sort((a, b) => b.riskScore - a.riskScore);
    const topHighRiskClauses = highRiskClauses.slice(0, 5);

    const categoryScoresList: CategoryScore[] = Array.from(categoryScoresMap.entries())
      .map(([category, data]) => ({
        category: titleizeCategoryKey(category),
        score: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return {
      distribution: {
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        total,
        highPercent: total > 0 ? (highCount / total) * 100 : 0,
        mediumPercent: total > 0 ? (mediumCount / total) * 100 : 0,
        lowPercent: total > 0 ? (lowCount / total) * 100 : 0,
      },
      highRiskClauses: topHighRiskClauses,
      categoryScores: categoryScoresList,
    };
  } catch (error) {
    console.error("Error fetching risk analysis data:", error);
    return {
      distribution: {
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        highPercent: 0,
        mediumPercent: 0,
        lowPercent: 0,
      },
      highRiskClauses: [],
      categoryScores: [],
    };
  }
}

