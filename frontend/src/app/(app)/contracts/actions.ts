import { z } from "zod";
import { API_URL, AI_API_URL } from "@/lib/api";
import { fetchWithAuth, fetchJsonWithAuth } from "@/lib/api-client";

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface Contract {
  id: string;
  name: string;
  client: string;
  riskLevel: string;
  date: string;
  status: string;
  analysisStatus?: AnalysisStatus;
  total_clauses?: number;
  summary?: string;
}

export interface ContractAnalysisStatus {
  contract_id: string;
  analysis_status: AnalysisStatus;
  analysis_error?: string | null;
  summary: string;
  clauses: PDFProcessResult["clauses"];
  total_clauses: number;
  risk_level?: string;
  full_text: string;
  analyzed_at?: string;
  report_url?: string | null;
}

export interface PDFProcessResult {
  full_text: string;
  summary: string;
  total_clauses: number;
  clauses: Array<{
    title: string;
    text: string;
    index: number;
    category: string;
    confidence: number;
    summary: string;
  }>;
}

export interface PDFTranslateResult {
  original_summary: string;
  translated_summary: string;
  full_text: string;
  translated_full_text: string;
  total_clauses: number;
  target_language: string;
  clauses: Array<{
    title: string;
    text: string;
    index: number;
    category: string;
    confidence: number;
    summary: string;
    translated_text: string;
    translated_summary: string;
  }>;
}

export async function getContracts(): Promise<Contract[]> {
  const data = await fetchJsonWithAuth<Record<string, unknown>[]>(
    `${API_URL}/contracts`,
    {
      method: "GET",
    }
  );
  return data.map((contract: Record<string, unknown>) => ({
    id: String(contract.id || ""),
    name: String(contract.name || "Untitled"),
    client: String(contract.client || "Unknown"),
    date: String(contract.date || ""),
    status: String(contract.status || ""),
    riskLevel: String(contract.risk_level || "Low"),
    analysisStatus:
      (contract.analysis_status as AnalysisStatus) || "pending",
    total_clauses:
      typeof contract.total_clauses === "number"
        ? contract.total_clauses
        : undefined,
    summary: typeof contract.summary === "string" ? contract.summary : undefined,
  }));
}

export async function getContractAnalysisStatus(
  contractId: string
): Promise<ContractAnalysisStatus> {
  return fetchJsonWithAuth<ContractAnalysisStatus>(
    `${API_URL}/contracts/${contractId}/analysis-status`,
    { method: "GET" }
  );
}

const TERMINAL_ANALYSIS: AnalysisStatus[] = ["completed", "failed"];

export async function pollContractAnalysis(
  contractId: string,
  options: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<ContractAnalysisStatus> {
  const { intervalMs = 2000, maxAttempts = 90 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getContractAnalysisStatus(contractId);
    if (TERMINAL_ANALYSIS.includes(status.analysis_status)) {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Analysis timed out. Please refresh the page.");
}

export async function getContractById(contractId: string): Promise<unknown> {
  return fetchJsonWithAuth(`${API_URL}/contracts/${contractId}`, {
    method: "GET",
  });
}

export async function uploadContract(
  file: File,
  name?: string,
  client?: string,
  scope: "personal" | "company" = "personal"
): Promise<Contract> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  if (client) formData.append("client", client);
  formData.append("scope", scope);

  const data = await fetchJsonWithAuth<Record<string, unknown>>(
    `${API_URL}/contracts`,
    {
      method: "POST",
      body: formData,
      skipContentType: true,
    }
  );
  return {
    ...(data as any),
    riskLevel: (data as any).risk_level as string,
    analysisStatus: ((data as any).analysis_status as AnalysisStatus) || "processing",
  } as Contract;
}

export async function deleteContract(contractId: string): Promise<void> {
  await fetchJsonWithAuth(`${API_URL}/contracts/${contractId}`, {
    method: "DELETE",
  });
}

export async function updateContractStatus(
  contractId: string,
  status: string
): Promise<void> {
  await fetchJsonWithAuth(
    `${API_URL}/contracts/${contractId}/status?status_value=${encodeURIComponent(
      status
    )}`,
    {
      method: "PATCH",
    }
  );
}

export async function downloadContractReport(
  contractId: string,
  filename: string = "contract-analysis-report.pdf",
  target_lang?: string
): Promise<void> {
  const qs = target_lang
    ? `?target_lang=${encodeURIComponent(target_lang)}`
    : "";

  const response = await fetchWithAuth(
    `${API_URL}/contracts/${contractId}/report.pdf${qs}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(
      error.detail || `Failed to download report: ${response.statusText}`
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadOriginalContract(
  contractId: string,
  filename: string = "original-contract.pdf"
): Promise<void> {
  const response = await fetchWithAuth(
    `${API_URL}/contracts/${contractId}/download`,
    { method: "GET" }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(
      error.detail || `Failed to download original: ${response.statusText}`
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function processPDF(file: File): Promise<PDFProcessResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${AI_API_URL}/v1/analyze/file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to process PDF: ${response.statusText}`);
  }

  return response.json();
}

export async function processAndTranslatePDF(
  file: File,
  targetLanguage: string = "es"
): Promise<PDFTranslateResult> {
  const analysisResult = await processPDF(file);

  const translateText = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return "";
    const res = await fetch(`${AI_API_URL}/v1/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target_language: targetLanguage }),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Translation failed: ${res.statusText}`);
    }
    return res.json();
  };

  const translatedSummary = await translateText(analysisResult.summary);
  const translatedFullText = await translateText(analysisResult.full_text);

  const translatedClauses = await Promise.all(
    analysisResult.clauses.map(async (clause) => ({
      ...clause,
      translated_text: await translateText(clause.text),
      translated_summary: await translateText(clause.summary),
    }))
  );

  return {
    original_summary: analysisResult.summary,
    translated_summary: translatedSummary,
    full_text: analysisResult.full_text,
    translated_full_text: translatedFullText,
    total_clauses: analysisResult.total_clauses,
    target_language: targetLanguage,
    clauses: translatedClauses,
  };
}

export async function translateContractData(
  data: PDFProcessResult,
  targetLanguage: string = "es"
): Promise<PDFTranslateResult> {
  const translateText = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return "";
    const res = await fetch(`${AI_API_URL}/v1/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target_language: targetLanguage }),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Translation failed: ${res.statusText}`);
    }
    return res.json();
  };

  const translatedSummary = await translateText(data.summary);
  const translatedFullText = await translateText(data.full_text);

  const translatedClauses = await Promise.all(
    data.clauses.map(async (clause) => ({
      ...clause,
      translated_text: await translateText(clause.text),
      translated_summary: await translateText(clause.summary),
    }))
  );

  return {
    original_summary: data.summary,
    translated_summary: translatedSummary,
    full_text: data.full_text,
    translated_full_text: translatedFullText,
    total_clauses: data.total_clauses,
    target_language: targetLanguage,
    clauses: translatedClauses,
  };
}

const contractSchema = z.string().min(
  10,
  "Contract text must be at least 10 characters."
);

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

  const splitRegex = /\n\n+|\n\s*\d+[\.\)]\s+/;
  let rawClauses = contractText
    .split(splitRegex)
    .filter((c) => c.trim().length > 20);

  if (rawClauses.length === 0) {
    rawClauses = [contractText.substring(0, 2000)];
  }

  const clausesToProcess = rawClauses.slice(0, 15);

  const classificationPromises = clausesToProcess.map(async (clause) => {
    try {
      const classifyResponse = await fetch(`${AI_API_URL}/v1/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clause.trim() }),
      });

      if (!classifyResponse.ok) return null;

      const classification = await classifyResponse.json();

      let riskLevel: "High" | "Medium" | "Low" = "Low";
      const category = classification.category || "General";

      if (
        ["Liability", "Termination", "Indemnification", "Non-Compete"].includes(
          category
        )
      ) {
        riskLevel = "High";
      } else if (
        ["Payment Terms", "Confidentiality", "Intellectual Property"].includes(
          category
        )
      ) {
        riskLevel = "Medium";
      }

      return {
        clause: clause.trim(),
        riskLevel,
        suggestedImprovements: `This ${category.toLowerCase()} clause has been identified with ${Math.round(
          (classification.confidence || 0) * 100
        )}% confidence. Review the clause for legal compliance, clarity, and completeness.`,
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(classificationPromises);
  const analysisResults = results.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );

  if (analysisResults.length === 0) {
    throw new Error(
      "No clauses could be analyzed. Please ensure the contract text contains substantial content."
    );
  }

  return { analysisResults };
}

