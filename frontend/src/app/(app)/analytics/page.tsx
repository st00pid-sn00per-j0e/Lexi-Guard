"use client";

// FIXED: Removed all trailing spaces in imports (e.g., "react " -> "react")
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJsonWithAuth } from "@/lib/api-client";
import { API_URL } from "@/lib/api";

const chartConfig = {
  high: { label: "High Risk", color: "hsl(var(--destructive))" },
  medium: { label: "Medium Risk", color: "hsl(var(--accent))" },
  low: { label: "Low Risk", color: "hsl(var(--chart-3))" },
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// FIXED: Robust helper to check all possible fields for contract type 
// so it doesn't just default to "Other"
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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [riskTrendData, setRiskTrendData] = useState<any[]>([]);
  const [contractTypeData, setContractTypeData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // FIXED: Removed hidden newline in URL
        const contracts: any[] = await fetchJsonWithAuth(`${API_URL}/contracts`, {
          method: "GET",
        });

        const monthMap = new Map<
          string,
          { high: number; medium: number; low: number; sortKey: string; month: string }
        >();
        const typeMap = new Map<string, number>();

        contracts.forEach((c) => {
          const dateStr = c.date || c.created_at || new Date().toISOString();
          const dateObj = new Date(dateStr);

          // Use a sortable key (YYYY-MM) to ensure the timeline chart is chronological
          const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
          const monthDisplay = dateObj.toLocaleString("default", {
            month: "short",
            year: "2-digit",
          });

          if (!monthMap.has(sortKey)) {
            monthMap.set(sortKey, { high: 0, medium: 0, low: 0, sortKey, month: monthDisplay });
          }

          const riskRaw =
            c.legal_bert_response?.risk_analysis?.risk_level || c.risk_level || "Low";
          const risk = String(riskRaw).toLowerCase();
          const current = monthMap.get(sortKey)!;

          if (risk === "high") current.high++;
          else if (risk === "medium") current.medium++;
          else current.low++;

          // FIXED: Use robust helper to get actual contract types
          const type = getContractType(c);
          typeMap.set(type, (typeMap.get(type) || 0) + 1);
        });

        // FIXED: Properly sort months chronologically
        const sortedMonths = Array.from(monthMap.values())
          .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
          .map(({ sortKey, ...rest }) => rest);

        const typeData = Array.from(typeMap.entries()).map(([type, count]) => ({
          type,
          count,
        }));

        setRiskTrendData(sortedMonths);
        setContractTypeData(typeData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Analytics & Reports">
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Risk Score Trends</CardTitle>
            <CardDescription>Risk distribution over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <AreaChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="high"
                  stackId="1"
                  stroke="var(--color-high)"
                  fill="var(--color-high)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="medium"
                  stackId="1"
                  stroke="var(--color-medium)"
                  fill="var(--color-medium)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="low"
                  stackId="1"
                  stroke="var(--color-low)"
                  fill="var(--color-low)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Contract Types</CardTitle>
            <CardDescription>Distribution of contract types.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={contractTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="type"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius =
                        innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs font-bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {contractTypeData.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Drill-Down Data</CardTitle>
          <CardDescription>In-depth view of risk trends.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right text-destructive">High Risk</TableHead>
                <TableHead className="text-right text-accent">Medium Risk</TableHead>
                <TableHead className="text-right">Low Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskTrendData.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">{row.high}</TableCell>
                  <TableCell className="text-right">{row.medium}</TableCell>
                  <TableCell className="text-right">{row.low}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

