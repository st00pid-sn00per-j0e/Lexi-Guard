"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import {
  FileText,
  Loader2,
  Trash2,
  Plus,
  Upload,
  MoreHorizontal,
  Eye,
  Languages,
} from "lucide-react";
import {
  uploadContract,
  deleteContract,
  downloadContractReport,
  pollContractAnalysis,
  type ContractAnalysisStatus,
} from "./actions";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"personal" | "company">("personal");
  const { toast } = useToast();

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadClient, setUploadClient] = useState("");

  // Analysis Modal State
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analyzingContract, setAnalyzingContract] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<ContractAnalysisStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);
        }
        await fetchContracts("personal");
      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContracts = async (scope: "personal" | "company") => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/contracts?scope=${scope}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      } else {
        console.error("Failed to load contracts: ", await res.text());
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load contracts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (value: string) => {
    const v = value as "personal" | "company";
    setActiveTab(v);
    await fetchContracts(v);
  };

  const handleDelete = async (contractId: string) => {
    if (!confirm("Are you sure you want to delete this contract?")) return;
    try {
      await deleteContract(contractId);
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      toast({ title: "Success", description: "Contract deleted." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast({ title: "Error", description: "Please select a file.", variant: "destructive" });
      return;
    }

    // 🛡️ STRICT RBAC: Prevent members from uploading to the company scope
    if (
      currentUser?.account_type === "company" &&
      activeTab === "company" &&
      currentUser?.role !== "admin"
    ) {
      toast({
        title: "Error",
        description: "Only company admins can upload company contracts.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const scope = currentUser?.account_type === "company" ? activeTab : "personal";
      await uploadContract(uploadFile, uploadName || undefined, uploadClient || undefined, scope);
      toast({ title: "Success", description: "Contract uploaded successfully." });
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadName("");
      setUploadClient("");
      await fetchContracts(activeTab as "personal" | "company");
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.message || "Could not upload contract.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // --- Action Handlers ---

  const handleAnalyze = async (contract: any) => {
    setAnalyzingContract(contract);
    setAnalysisModalOpen(true);
    setIsPolling(true);
    setAnalysisStatus(null);

    try {
      const status = await pollContractAnalysis(contract.id);
      setAnalysisStatus(status);

      if (status.analysis_status === "completed") {
        toast({ title: "Analysis Complete", description: "The contract has been successfully analyzed." });
      } else if (status.analysis_status === "failed") {
        toast({
          title: "Analysis Failed",
          description: status.analysis_error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Analysis timed out or failed.", variant: "destructive" });
    } finally {
      setIsPolling(false);
    }
  };

  const handleTranslate = async (contract: any) => {
    try {
      const res = await fetch(`${API_URL}/contracts/${contract.id}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const clauses = data.clauses || [];

        const clauseBlock = clauses
          .map(
            (c: any, i: number) =>
              `--- Clause ${i + 1}: ${c.title} (${c.category}) ---\n${c.text}`
          )
          .join("\n\n");

        const prefillText = [
          data.summary ? `EXECUTIVE SUMMARY:\n${data.summary}` : "",
          clauseBlock || data.full_text || "",
        ]
          .filter(Boolean)
          .join("\n\n");

        sessionStorage.setItem(
          "lexiguard_translate_prefill",
          JSON.stringify({
            text: prefillText,
            contractId: contract.id,
            originalName: data.name,
          })
        );
      }
    } catch (error) {
      console.error("Failed to prepare translation data", error);
      toast({
        title: "Warning",
        description:
          "Could not preload contract text. You can paste it manually.",
        variant: "destructive",
      });
    }

    window.location.href = `/translation?contractId=${contract.id}`;
  };

  const handleDownloadReport = async (contract: any) => {
    if (contract.analysis_status !== "completed") {
      toast({ title: "Report Not Ready", description: "Analysis must be completed first.", variant: "destructive" });
      return;
    }
    try {
      await downloadContractReport(contract.id, `${contract.name.replace(/[^a-z0-9-_]+/gi, "_")}-report.pdf`);
      toast({ title: "Success", description: "Report download started." });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error?.message || "Could not download report.",
        variant: "destructive",
      });
    }
  };

  const isCompanyMember = currentUser?.account_type === "company";
  const canUploadToCompany = currentUser?.role === "admin";
  const isUploadDisabled = isCompanyMember && activeTab === "company" && !canUploadToCompany;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Contracts">
          <div className="text-sm text-muted-foreground">
            Manage your legal contracts. Company admins can manage company-wide contracts.
          </div>
        </PageHeader>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={isUploadDisabled}
              title={isUploadDisabled ? "Only admins can upload company contracts" : ""}
            >
              <Plus className="h-4 w-4 mr-2" /> Upload Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload New Contract</DialogTitle>
              <DialogDescription>
                {isCompanyMember
                  ? `This will be uploaded to your ${activeTab} contracts.`
                  : "This will be uploaded to your personal contracts."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Contract File (PDF)</Label>
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Contract Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g. NDA with Acme Corp"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client">Client Name (Optional)</Label>
                <Input
                  id="client"
                  placeholder="e.g. Acme Corp"
                  value={uploadClient}
                  onChange={(e) => setUploadClient(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadFile}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isCompanyMember ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="personal">Personal Contracts</TabsTrigger>
            <TabsTrigger value="company">Company Contracts</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="mt-6">
            <ContractTable
              contracts={contracts}
              currentUser={currentUser}
              onDelete={handleDelete}
              onAnalyze={handleAnalyze}
              onTranslate={handleTranslate}
              onDownloadReport={handleDownloadReport}
              scope="personal"
            />
          </TabsContent>
          <TabsContent value="company" className="mt-6">
            <ContractTable
              contracts={contracts}
              currentUser={currentUser}
              onDelete={handleDelete}
              onAnalyze={handleAnalyze}
              onTranslate={handleTranslate}
              onDownloadReport={handleDownloadReport}
              scope="company"
            />
          </TabsContent>
        </Tabs>
      ) : (
        <ContractTable
          contracts={contracts}
          currentUser={currentUser}
          onDelete={handleDelete}
          onAnalyze={handleAnalyze}
          onTranslate={handleTranslate}
          onDownloadReport={handleDownloadReport}
          scope="personal"
        />
      )}

      {loading && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      {!loading && contracts.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No contracts found.</div>
      )}

      {/* ================= ANALYSIS MODAL ================= */}
      <Dialog open={analysisModalOpen} onOpenChange={setAnalysisModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Analysis: {analyzingContract?.name}</DialogTitle>
            <DialogDescription>AI-powered legal review and clause extraction.</DialogDescription>
          </DialogHeader>

          {isPolling || !analysisStatus ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing contract... This may take a moment.</p>
            </div>
          ) : analysisStatus.analysis_status === "failed" ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              <p className="font-semibold">Analysis Failed</p>
              <p className="text-sm">{analysisStatus.analysis_error || "An unknown error occurred."}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {analysisStatus.summary || "No summary available."}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={
                        analysisStatus.risk_level === "High"
                          ? "destructive"
                          : analysisStatus.risk_level === "Medium"
                          ? "secondary"
                          : "default"
                      }
                      className="text-lg py-1 px-3"
                    >
                      {analysisStatus.risk_level || "Unknown"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Extracted Clauses ({analysisStatus.total_clauses})</h3>
                <Accordion type="single" collapsible className="w-full">
                  {analysisStatus.clauses.map((clause: any, index: number) => (
                    <AccordionItem value={`clause-${index}`} key={index}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 text-left w-full">
                          <Badge variant="outline">{clause.category}</Badge>
                          <span className="font-medium truncate">{clause.title}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {Math.round((clause.confidence || 0) * 100)}% confidence
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Summary:</h4>
                          <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">{clause.summary}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Suggested Improvements:</h4>
                          <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-900">
                            Review this {clause.category.toLowerCase()} clause for legal compliance, clarity, and completeness. Ensure it aligns with your organization's risk tolerance.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Full Text:</h4>
                          <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md whitespace-pre-wrap">{clause.text}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => handleDownloadReport(analyzingContract)} disabled={analysisStatus.analysis_status !== "completed"}>
                  <FileText className="mr-2 h-4 w-4" /> Download Report
                </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysisModalOpen(false);
                  handleTranslate(analyzingContract);
                }}
              >
                  <Languages className="mr-2 h-4 w-4" /> Translate Contract
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= SUB-COMPONENT =================

function ContractTable({
  contracts,
  currentUser,
  onDelete,
  onAnalyze,
  onTranslate,
  onDownloadReport,
  scope,
}: {
  contracts: any[];
  currentUser: any;
  onDelete: (contractId: string) => void;
  onAnalyze: (contract: any) => void;
  onTranslate: (contractId: string) => void;
  onDownloadReport: (contract: any) => void;
  scope: "personal" | "company";
}) {

  if (!contracts.length) {
    return (
      <div className="text-center py-12 border rounded-md bg-muted/20">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No {scope} contracts found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Analysis Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract: any) => {
            // 🛡️ RBAC: Only allow delete for personal owners or company admins
            const canDelete =
              scope === "personal" ? contract.user_id === currentUser?.id : currentUser?.role === "admin";

            return (
              <TableRow key={contract.id} className="transition-all hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {contract.name}
                  </div>
                </TableCell>

                <TableCell>{contract.client}</TableCell>
                <TableCell>
                  {contract.date ? new Date(contract.date).toLocaleDateString() : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={contract.analysis_status === "completed" ? "default" : "secondary"}>
                    {contract.analysis_status || "pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {/* 🛡️ 3-DOT DROPDOWN MENU */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAnalyze(contract)}>
                        <Eye className="mr-2 h-4 w-4" /> Analyze
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onTranslate(contract)}
                        className="focus:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <Languages className="mr-2 h-4 w-4" /> Translate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownloadReport(contract)}>
                        <FileText className="mr-2 h-4 w-4" /> Download Report
                      </DropdownMenuItem>

                      {/* Conditionally render Delete based on RBAC rules */}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(contract.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}

                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

