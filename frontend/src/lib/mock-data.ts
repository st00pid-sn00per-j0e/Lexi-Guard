import type { Contract, User, RiskTrendData, ContractTypeData } from "./definitions";

export const mockContracts: Contract[] = [
  { id: "CTR-001", name: "Master Service Agreement", client: "Innovate Inc.", riskLevel: "High", date: "2024-07-15", status: "Pending Review" },
  { id: "CTR-002", name: "Non-Disclosure Agreement", client: "Tech Solutions LLC", riskLevel: "Low", date: "2024-07-10", status: "Active" },
  { id: "CTR-003", name: "Software License Agreement", client: "Data Corp", riskLevel: "Medium", date: "2024-07-05", status: "Active" },
  { id: "CTR-004", name: "Partnership Agreement", client: "Synergy Partners", riskLevel: "High", date: "2024-06-28", status: "Active" },
  { id: "CTR-005", name: "Lease Agreement", client: "Global Real Estate", riskLevel: "Medium", date: "2024-06-20", status: "Archived" },
  { id: "CTR-006", name: "Employment Contract", client: "New Hire", riskLevel: "Low", date: "2024-06-15", status: "Active" },
];

export const mockUsers: User[] = [
    { id: "USR-001", name: "Alice Johnson", email: "alice@example.com", role: "Admin", lastActivity: "2 hours ago" },
    { id: "USR-002", name: "Bob Williams", email: "bob@example.com", role: "Reviewer", lastActivity: "5 hours ago" },
    { id: "USR-003", name: "Charlie Brown", email: "charlie@example.com", role: "Viewer", lastActivity: "1 day ago" },
    { id: "USR-004", name: "Diana Prince", email: "diana@example.com", role: "Reviewer", lastActivity: "3 days ago" },
];

export const mockRiskTrendData: RiskTrendData[] = [
  { month: 'Jan', high: 1, medium: 3, low: 5 },
  { month: 'Feb', high: 2, medium: 4, low: 7 },
  { month: 'Mar', high: 1, medium: 5, low: 6 },
  { month: 'Apr', high: 3, medium: 2, low: 8 },
  { month: 'May', high: 2, medium: 6, low: 9 },
  { month: 'Jun', high: 4, medium: 5, low: 10 },
];

export const mockContractTypeData: ContractTypeData[] = [
    { type: 'MSA', count: 25, fill: 'var(--color-chart-1)' },
    { type: 'NDA', count: 45, fill: 'var(--color-chart-2)' },
    { type: 'SLA', count: 15, fill: 'var(--color-chart-3)' },
    { type: 'Other', count: 10, fill: 'var(--color-muted)' },
];
