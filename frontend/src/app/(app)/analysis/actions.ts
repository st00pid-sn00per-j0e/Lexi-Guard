"use server";

import { z } from "zod";
import { AI_API_URL } from "@/lib/api";

const contractSchema = z.string().min(10, "Contract text must be at least 10 characters.");

export interface AnalyzeContractClausesOutput {
  analysisResults: Array<{
    clause: string;
    riskLevel: "High" | "Medium" | "Low";
    suggestedImprovements: string;
  }>;
}

export async function analyzeContractClausesAction(
  contractText: string
): Promise<AnalyzeContractClausesOutput> {
  const validation = contractSchema.safeParse(contractText);

  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  try {
    // Split text into clauses and classify each
    const clauses = contractText.split(/\n\n+/).filter(c => c.trim().length > 50);
    const analysisResults = [];

    for (const clause of clauses.slice(0, 15)) {
      try {
        const classifyResponse = await fetch(`${AI_API_URL}/v1/classify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: clause }),
        });

        if (classifyResponse.ok) {
          const classification = await classifyResponse.json();
          let riskLevel: "High" | "Medium" | "Low" = "Low";
          
          if (classification.category === "Liability" || 
              classification.category === "Termination" || 
              classification.category === "Indemnification") {
            riskLevel = "High";
          } else if (classification.category === "Payment Terms" || 
                     classification.category === "Confidentiality" || 
                     classification.category === "Intellectual Property") {
            riskLevel = "Medium";
          }

          analysisResults.push({
            clause: clause.substring(0, 150) + (clause.length > 150 ? "..." : ""),
            riskLevel,
            suggestedImprovements: `This ${classification.category.toLowerCase()} clause has been identified with ${Math.round(classification.confidence * 100)}% confidence. Review the clause for legal compliance, clarity, and completeness.`,
          });
        }
      } catch (e) {
        // Skip this clause if classification fails
        console.error("Error classifying clause:", e);
      }
    }

    if (analysisResults.length === 0) {
      throw new Error("No clauses could be analyzed. Please ensure the contract text contains substantial content.");
    }

    return { analysisResults };
  } catch (error) {
    console.error("Error analyzing contract:", error);
    throw new Error("Failed to analyze contract. Please try again.");
  }
}
