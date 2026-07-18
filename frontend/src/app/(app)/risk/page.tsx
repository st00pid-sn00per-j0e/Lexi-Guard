"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Eye,
  FileWarning,
  Loader2,
  Shield,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getRiskAnalysisData, type RiskAnalysisData } from "./actions";

const COLORS = {
  high: "hsl(var(--destructive))",
  medium: "#f59e0b",
  low: "#22c55e",
};

export default function RiskScoringPage() {
  const [data, setData] = useState<RiskAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getRiskAnalysisData();
        setData(result);
      } catch (error: any) {
        if (error?.message === "Session expired. Please log in again.") {
          router.push("/login");
        }
        console.error("Failed to load risk data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Failed to load risk data.</p>
      </div>
    );
  }

  const { distribution, highRiskClauses, categoryScores } = data;
  const hasContracts = distribution.total > 0;

  const pieData = [
    { name: "High Risk", value: distribution.high },
    { name: "Medium Risk", value: distribution.medium },
    { name: "Low Risk", value: distribution.low },
  ].map((entry) => ({
    ...entry,
    color:
      entry.name === "High Risk"
        ? COLORS.high
        : entry.name === "Medium Risk"
        ? COLORS.medium
        : COLORS.low,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Risk Scoring Overview" />

      {!hasContracts ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-xl">No Contracts Analyzed Yet</CardTitle>
          <CardDescription className="mt-2 max-w-md">
            Upload and analyze your first contract to see real-time risk scoring, 
            high-priority clauses, and category breakdowns.
          </CardDescription>
          <Button className="mt-6" onClick={() => router.push("/contracts")}>
            Upload Contract
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-destructive">High Risk Contracts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{distribution.high}</div>
                <p className="text-xs text-muted-foreground">Require immediate attention</p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-500">Medium Risk Contracts</CardTitle>
                <FileWarning className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{distribution.medium}</div>
                <p className="text-xs text-muted-foreground">Potential issues identified</p>
              </CardContent>
            </Card>

            <Card className="border-green-600/50 bg-green-600/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Low Risk Contracts</CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{distribution.low}</div>
                <p className="text-xs text-muted-foreground">Appear standard and safe</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Overall Risk Profile</CardTitle>
                <CardDescription>Proportion of contracts by risk level.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dataPoint: any = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">{dataPoint.name}</span>
                                    <span className="font-bold text-muted-foreground">{dataPoint.value} Contracts</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center text-sm">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex flex-col items-center">
                      <div className="mb-1 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {distribution.total > 0 ? ((item.value / distribution.total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk by Legal Category</CardTitle>
                <CardDescription>Average risk score (0-100) across all contract categories.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryScores}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <span className="font-bold">{(payload[0].payload as any).category}</span>
                                <span className="ml-2 text-muted-foreground">Score: {payload[0].value}/100</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                        {categoryScores.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.score >= 70 ? COLORS.high : entry.score >= 40 ? COLORS.medium : COLORS.low}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>High-Priority Clauses</CardTitle>
              <CardDescription>Specific clauses across your contracts that pose the highest risk.</CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskClauses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShieldCheck className="h-12 w-12 text-green-600 mb-2" />
                  <p className="text-sm text-muted-foreground">No high-risk clauses detected across your contracts.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {highRiskClauses.map((clause) => (
                    <li
                      key={clause.id}
                      className="flex items-start justify-between gap-4 p-3 bg-secondary/30 rounded-lg border border-border/50"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Shield className="h-5 w-5 mt-1 text-destructive flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={clause.text}>
                            "{clause.text}"
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">{clause.contract}</Badge>
                            <Badge variant="secondary" className="text-xs capitalize">{clause.category}</Badge>
                            <Badge
                              variant={clause.severity === "high" ? "destructive" : "default"}
                              className="text-xs capitalize"
                            >
                              {clause.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

