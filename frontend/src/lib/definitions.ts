export type Contract = {
  id: string;
  name: string;
  client: string;
  riskLevel: "High" | "Medium" | "Low";
  date: string;
  status: "Active" | "Archived" | "Pending Review";
  analysisStatus?: "pending" | "processing" | "completed" | "failed";
  total_clauses?: number;
  summary?: string;
  legal_bert_response?: any;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Reviewer" | "Viewer";
  lastActivity: string;
};

export type RiskTrendData = {
  month: string;
  high: number;
  medium: number;
  low: number;
};

export type ContractTypeData = {
  type: string;
  count: number;
  fill: string;
};

export type ClauseAnalysisResult = {
  clause: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  suggestedImprovements: string;
};

