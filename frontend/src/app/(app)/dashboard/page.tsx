"use client";

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
  Activity,
  FileText,
  ShieldAlert,
  Upload,
  ScanText,
  Languages,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getContracts, type Contract } from "@/app/(app)/contracts/actions";

const chartConfig = {
  high: { label: "High Risk", color: "hsl(var(--destructive))" },
  medium: { label: "Medium Risk", color: "hsl(var(--accent))" },
  low: { label: "Low Risk", color: "hsl(var(--chart-3))" },
};

export default function DashboardPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (error) {
      console.error("Failed to load contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalContracts = contracts.length;
  const highRisk = contracts.filter(c => c.riskLevel === "High").length;
  const pendingReview = contracts.filter(c => c.status === "Pending Review").length;
  
  // Generate risk trend data (last 6 months)
  const riskTrendData = [
    { month: 'Jan', high: 0, medium: 0, low: 0 },
    { month: 'Feb', high: 0, medium: 0, low: 0 },
    { month: 'Mar', high: 0, medium: 0, low: 0 },
    { month: 'Apr', high: 0, medium: 0, low: 0 },
    { month: 'May', high: 0, medium: 0, low: 0 },
    { month: 'Jun', high: 0, medium: 0, low: 0 },
  ];
  
  // For now, distribute current contracts across months (simplified)
  contracts.forEach((contract, index) => {
    const monthIndex = index % 6;
    if (contract.riskLevel === "High") riskTrendData[monthIndex].high++;
    else if (contract.riskLevel === "Medium") riskTrendData[monthIndex].medium++;
    else riskTrendData[monthIndex].low++;
  });
  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="hover:border-primary transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contracts
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold font-headline">{totalContracts}</div>
                <p className="text-xs text-muted-foreground">Total contracts in system</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="hover:border-primary transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Risk</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold font-headline">{highRisk}</div>
                <p className="text-xs text-muted-foreground">Requires immediate attention</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="hover:border-primary transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold font-headline">{pendingReview}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </>
            )}
          </CardContent>
        </Card>
        <Link href="/contracts" className="block hover:no-underline">
          <Card className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 transition-colors duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Contract
              </CardTitle>
              <PlusCircle className="h-4 w-4 text-primary-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm mt-4">Start a new contract analysis or upload a document.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

       <div className="grid gap-6 md:grid-cols-3 mb-8">
         <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
            <CardDescription>Start your next task with a single click.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline"><Link href="/contracts"><Upload className="mr-2 h-4 w-4"/> Upload Contract</Link></Button>
            <Button asChild variant="outline"><Link href="/analysis"><ScanText className="mr-2 h-4 w-4"/> Start Clause Analysis</Link></Button>
            <Button asChild variant="outline"><Link href="/translation"><Languages className="mr-2 h-4 w-4"/> Start Translation</Link></Button>
          </CardContent>
        </Card>
        <Card className="col-span-3 md:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Risk Score Trends</CardTitle>
            <CardDescription>Risk distribution over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={riskTrendData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="high" stackId="a" fill="var(--color-high)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="low" stackId="a" fill="var(--color-low)" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
