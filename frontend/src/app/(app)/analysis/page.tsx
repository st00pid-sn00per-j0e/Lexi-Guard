"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ScanText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeContractClausesAction } from "./actions";
import type { AnalyzeContractClausesOutput } from "@/ai/flows/analyze-contract-clauses";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  getContractById,
  getContractAnalysisStatus,
} from "../contracts/actions";

const exampleContract = `This agreement is made and entered into on this 1st day of January, 2024, by and between Innovate Inc. ("Company") and Tech Solutions LLC ("Consultant").

1.  Scope of Work. The Consultant agrees to perform the services described in Exhibit A. The Company's liability is unlimited.

2.  Payment. Company shall pay Consultant a fixed fee of $10,000. Payment is due within 90 days of invoice receipt.

3.  Confidentiality. Both parties agree to keep all proprietary information confidential for a period of one (1) year from the termination of this agreement.

4.  Termination. This agreement can be terminated by the Consultant at any time with or without cause. The Company must provide 30 days written notice.
`;

function pickContractText(obj: any): string {
  if (!obj || typeof obj !== "object") return "";

  // 1. Direct known properties (expanded list of common backend keys)
  const directCandidates = [
    obj.full_text,
    obj.fullText,
    obj.text,
    obj.fullTextContent,
    obj.raw_text,
    obj.content,
    obj.pdf_result?.full_text,
    obj.analysis?.full_text,
    obj.data?.full_text,
    obj.contract?.full_text,
  ];

  for (const v of directCandidates) {
    if (typeof v === "string" && v.trim().length > 20) {
      return v;
    }
  }

  // 2. Clause reconstruction fallback
  if (Array.isArray(obj.clauses) && obj.clauses.length > 0) {
    const reconstructed = obj.clauses
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean)
      .join("\n\n");

    if (reconstructed.trim().length > 20) {
      return reconstructed;
    }
  }

  // 3. Deep search for any long string inside the object
  const findLongString = (o: any, depth = 0): string => {
    if (!o || typeof o !== "object" || depth > 5) return "";

    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        const val = o[key];

        if (typeof val === "string" && val.trim().length > 100) {
          return val;
        }

        if (
          typeof val === "object" &&
          val !== null &&
          !Array.isArray(val)
        ) {
          const found = findLongString(val, depth + 1);
          if (found) return found;
        }
      }
    }

    return "";
  };

  const deepFound = findLongString(obj);
  if (deepFound) return deepFound;

  return "";
}


function ClauseAnalysisContent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeContractClausesOutput | null>(
    null
  );
  const [contractText, setContractText] = useState("");
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const contractId =
    searchParams.get("contractId") || searchParams.get("contract_id");

  useEffect(() => {
    // 1) Load prefilled transcript coming from Voice page (if present)
    try {
      const raw = sessionStorage.getItem("lexiguard_analysis_prefill");
      if (raw) {
        sessionStorage.removeItem("lexiguard_analysis_prefill");
        const parsed = JSON.parse(raw) as { text?: string };
        if (parsed.text) {
          setContractText(parsed.text);
          toast({
            title: "Transcript Loaded",
            description: "Voice transcript loaded into contract input.",
          });
          return;
        }
      }
    } catch {
      // ignore
    }

    if (!contractId) return;


    setLoading(true);


    (async () => {
      try {
        const data: any = await getContractById(contractId);

        if (!data) {
          toast({
            title: "Load Failed",
            description: "Invalid contract data received from server.",
            variant: "destructive",
          });
          return;
        }

        if (
          data.analysis_status &&
          data.analysis_status !== "completed"
        ) {
          toast({
            title: "Analysis Incomplete",
            description:
              "This contract is still processing or failed to process. Text may be empty.",
            variant: "destructive",
          });
          // Still try to extract text below.
        }



        const candidate = pickContractText(data);
        if (candidate) {
          setContractText(candidate);
          toast({
            title: "Contract Loaded",
            description: "The contract text was loaded successfully.",
          });
          return;
        }

        // If contract exists but extracted text isn't present, still try to reuse stored analysis.
        if (data?.analysis_status === "completed" && Array.isArray(data?.clauses)) {
          const clauses = data.clauses;
          const analysisResults = clauses.map((c: any) => ({
            clause:
              typeof c?.text === "string" && c.text.trim() ? c.text : c?.summary || "",
            suggestedImprovements:
              typeof c?.summary === "string" && c.summary.trim()
                ? c.summary
                : "",
            riskLevel:
              typeof c?.confidence === "number"
                ? c.confidence >= 0.8
                  ? "High"
                  : c.confidence >= 0.5
                    ? "Medium"
                    : "Low"
                : "Medium",
          }));

          setResult({
            summary: typeof data?.summary === "string" ? data.summary : "",
            analysisResults,
          } as AnalyzeContractClausesOutput);
          return;
        }

        // Fallback: try the analysis-status endpoint payload.
        const statusData: any = await getContractAnalysisStatus(
          contractId
        );
        const statusCandidate = pickContractText(statusData);

        if (statusCandidate) {
          setContractText(statusCandidate);
          toast({
            title: "Contract Loaded",
            description: "The contract text was loaded successfully.",
          });
          return;
        }

        toast({
          title: "No Text Found",
          description:
            "This contract was processed, but no text could be extracted.",
          variant: "destructive",
        });
      } catch (e) {
        console.error("Failed to load contract:", e);
        toast({
          title: "Load Failed",
          description: "Failed to load contract text from server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId, toast]);

  const handleSubmit = async () => {
    if (!contractText.trim()) {
      toast({
        title: "Error",
        description: "Contract text cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // If we have a contractId and the backend already completed analysis,
      // reuse it instead of re-running the AI analysis.
      if (contractId) {
        const statusData: any = await getContractAnalysisStatus(contractId);
        if (statusData?.analysis_status === "completed") {
          const clauses = Array.isArray(statusData?.clauses) ? statusData.clauses : [];

          const analysisResults = clauses.map((c: any) => ({
            clause:
              typeof c?.text === "string" && c.text.trim() ? c.text : c?.summary || "",
            suggestedImprovements:
              typeof c?.summary === "string" && c.summary.trim()
                ? c.summary
                : "",
            riskLevel:
              typeof c?.confidence === "number"
                ? c.confidence >= 0.8
                  ? "High"
                  : c.confidence >= 0.5
                    ? "Medium"
                    : "Low"
                : "Medium",
          }));

          setResult({
            summary: typeof statusData?.summary === "string" ? statusData.summary : "",
            analysisResults,
          } as AnalyzeContractClausesOutput);
          return;
        }
      }

      // Fallback: run analysis on current textarea content.
      const analysisResult = await analyzeContractClausesAction(contractText);
      setResult(analysisResult);
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "An error occurred during the analysis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillExample = () => {
    setContractText(exampleContract);
  };

  return (
    <div>
      <PageHeader title="Clause Analysis" />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Contract Input</CardTitle>
            <CardDescription>
              Paste your contract text below to begin the analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Textarea
              placeholder="Paste contract text here..."
              className="min-h-[20rem] md:min-h-96"
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              disabled={loading}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ScanText className="mr-2 h-4 w-4" />
                )}
                Analyze Contract
              </Button>
              <Button
                onClick={fillExample}
                variant="outline"
                disabled={loading}
              >
                Load Example
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Sparkles className="text-accent" /> Analysis Results
            </CardTitle>
            <CardDescription>
              AI-powered risk identification and suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex flex-col items-center justify-center h-[20rem] md:h-96 gap-4">
                <Loader2
                  className="h-12 w-12 animate-spin text-primary"
                />
                <p className="text-muted-foreground">Analyzing clauses...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="flex flex-col items-center justify-center h-[20rem] md:h-96 gap-4 text-center">
                <ScanText className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Your analysis results will appear here.
                </p>
              </div>
            )}

            {result && (
              <Accordion type="single" collapsible className="w-full">
                {result.analysisResults.map((item, index) => (
                  <AccordionItem
                    value={`item-${index}`}
                    key={index}
                    className="border-b-0 min-w-0"
                  >
                    <AccordionTrigger className="text-left min-w-0">
                      <div className="flex items-center gap-4 text-left min-w-0 w-full pr-4">
                        <Badge
                          variant={
                            item.riskLevel === "High"
                              ? "destructive"
                              : item.riskLevel === "Medium"
                                ? "secondary"
                                : "default"
                          }
                          className={cn(
                            "text-xs whitespace-nowrap flex-shrink-0",
                            {
                              "bg-accent text-accent-foreground":
                                item.riskLevel === "Medium",
                              "bg-green-700 hover:bg-green-800 text-white":
                                item.riskLevel === "Low",
                            }
                          )}
                        >
                          {item.riskLevel} Risk
                        </Badge>
                        <span className="truncate flex-1 min-w-0">{item.clause}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 w-full min-w-0 pt-2">
                      <div className="min-w-0 w-full">
                        <h4 className="font-semibold mb-2 text-sm">Original Clause:</h4>
                        <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md break-words whitespace-pre-wrap w-full min-w-0">
                          {item.clause}
                        </div>
                      </div>
                      <div className="min-w-0 w-full">
                        <h4 className="font-semibold mb-2 text-sm">Suggested Improvement:</h4>
                        <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md break-words whitespace-pre-wrap w-full min-w-0">
                          {item.suggestedImprovements}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClauseAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      }
    >
      <ClauseAnalysisContent />
    </Suspense>
  );
}

