"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  ScanText,
  Languages,
  Mic,
  Shield,
  BarChart2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  TrendingUp,
  Cpu,
  Github,
  BookOpen,
  Layers,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<"analysis" | "risk" | "voice">("analysis");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* ===== PARALLAX BACKGROUND LAYER ===== */}
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        {/* Shifting background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-purple-500/10 dark:from-primary/20 dark:via-accent/10 dark:to-purple-500/20 transition-all duration-300" />
        
        {/* Floating parallax blobs */}
        <div 
          className="absolute top-10 left-[-5%] w-[45rem] h-[45rem] rounded-full bg-primary/20 dark:bg-primary/30 blur-[120px] transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${scrollY * 0.25}px)` }}
        />
        <div 
          className="absolute bottom-20 right-[-5%] w-[40rem] h-[40rem] rounded-full bg-accent/20 dark:bg-accent/20 blur-[120px] transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${scrollY * -0.15}px)` }}
        />
        <div 
          className="absolute top-1/3 left-1/3 w-[30rem] h-[30rem] rounded-full bg-purple-500/15 dark:bg-purple-500/20 blur-[100px] transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />
      </div>

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo className="hover:scale-105 transition-transform" />
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#preview" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Product Tour
            </a>
            <a href="#model" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Core Model
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About Us
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hover:bg-accent/10 hover:text-accent font-medium transition-colors">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/95 hover:scale-105 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1">
        
        {/* --- HERO SECTION --- */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Banner Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm text-primary mb-6 hover:scale-105 transition-transform duration-300">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Next-Gen Contract Intelligence powered by <strong className="font-semibold text-primary underline">LEGAL-BERT</strong></span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline tracking-tight text-foreground max-w-4xl mx-auto leading-tight transition-all duration-500">
              Guard Your Agreements. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-pink-500 animate-pulse-glow">
                Analyze with AI Precision.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              LexiGuard uses state-of-the-art legal artificial intelligence models to scan contract PDFs, highlight liabilities, translate legal terminology, and explain complex obligations instantly.
            </p>

            {/* Actions */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 text-primary-foreground font-bold text-base px-8 py-6 rounded-lg transition-all duration-300 group">
                  Start Scanning Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-border/80 hover:bg-muted hover:text-primary hover:border-primary/50 text-base px-8 py-6 rounded-lg transition-all duration-300">
                  Explore Features
                </Button>
              </a>
            </div>

            {/* Stats Summary */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto border-t border-border/20 pt-8 text-center">
              <div className="hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold font-headline text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">99.4%</div>
                <div className="text-xs text-muted-foreground mt-1">Accuracy Rate</div>
              </div>
              <div className="hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold font-headline text-foreground bg-clip-text text-transparent bg-gradient-to-r from-accent to-pink-500">&lt; 30s</div>
                <div className="text-xs text-muted-foreground mt-1">Analysis Speed</div>
              </div>
              <div className="hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold font-headline text-foreground bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">10k+</div>
                <div className="text-xs text-muted-foreground mt-1">Contracts Scanned</div>
              </div>
              <div className="hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold font-headline text-foreground bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-primary">$2M+</div>
                <div className="text-xs text-muted-foreground mt-1">Legal Fees Saved</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE PREVIEW / PRODUCT TOUR --- */}
        <section id="preview" className="py-12 md:py-20 bg-muted/30 border-y border-border/20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold font-headline">Inside the Dashboard</h2>
              <p className="text-muted-foreground mt-2">Interact with the tabs below to explore different viewpoints of the LexiGuard analysis platform.</p>
              
              {/* Tab Selector */}
              <div className="flex justify-center gap-2 mt-6 bg-card/80 border border-border/40 p-1.5 rounded-full max-w-md mx-auto shadow-sm">
                <button 
                  onClick={() => setActiveTab("analysis")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold font-headline transition-all cursor-pointer ${activeTab === "analysis" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Clause Analysis
                </button>
                <button 
                  onClick={() => setActiveTab("risk")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold font-headline transition-all cursor-pointer ${activeTab === "risk" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Risk Scoring
                </button>
                <button 
                  onClick={() => setActiveTab("voice")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold font-headline transition-all cursor-pointer ${activeTab === "voice" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Voice Narration
                </button>
              </div>
            </div>

            {/* Mock Dashboard UI */}
            <div className="max-w-5xl mx-auto rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden p-6 sm:p-8 hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500">
              
              {/* Header of Mock App */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/40 pb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-foreground">LexiGuard Console</h3>
                    <p className="text-xs text-muted-foreground">Workspace: Acme Corp Legal</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs animate-pulse">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>AI Engine Online</span>
                </div>
              </div>

              {/* Dynamic content of mock app based on active tab */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                
                {/* Left side: Upload list mock */}
                <div className="md:col-span-1 border-r border-border/40 pr-0 md:pr-6 flex flex-col gap-4">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Recent Uploads</span>
                  
                  <div className="bg-accent/15 border border-accent/30 p-3 rounded-lg flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                    <FileText className="h-5 w-5 text-accent mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">Software_Service_Agreement.pdf</p>
                      <p className="text-[10px] text-muted-foreground">Today, 2:45 PM • 14 pages</p>
                    </div>
                    <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full font-semibold">High Risk</span>
                  </div>

                  <div className="bg-background/40 border border-border/40 p-3 rounded-lg flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer opacity-80">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">NDA_Consultant_Acme.pdf</p>
                      <p className="text-[10px] text-muted-foreground">Yesterday • 3 pages</p>
                    </div>
                    <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-semibold">Low Risk</span>
                  </div>

                  <div className="bg-background/40 border border-border/40 p-3 rounded-lg flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer opacity-60">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">Office_Lease_Extension.pdf</p>
                      <p className="text-[10px] text-muted-foreground">July 15, 2026 • 28 pages</p>
                    </div>
                    <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded-full font-semibold">Medium Risk</span>
                  </div>
                </div>

                {/* Right side: Mock interactive content */}
                <div className="md:col-span-2 flex flex-col gap-5 justify-center min-h-[220px]">
                  
                  {activeTab === "analysis" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">AI Clause Analysis Summary</span>
                        <span className="text-xs text-primary font-bold">2 Warnings Found</span>
                      </div>
                      
                      <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 flex gap-3 mb-3 hover:scale-[1.01] transition-transform">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <h4 className="text-sm font-bold text-destructive font-headline">Indemnification Clause Imbalance</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Section 9.2 states that the Customer indemnifies the Vendor for all third-party intellectual property claims, but contains no reciprocal indemnification from the Vendor.
                          </p>
                        </div>
                      </div>

                      <div className="border border-border/60 bg-muted/10 rounded-lg p-4 flex gap-3 hover:scale-[1.01] transition-transform">
                        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-foreground font-headline">Termination for Convenience</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Section 14.3 requires 90 days notice for termination for convenience. The industry standard benchmark is 30 days.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "risk" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Risk Rating breakdown</span>
                        <span className="text-sm font-bold text-red-500 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" /> Risk Score: 78 / 100
                        </span>
                      </div>
                      
                      <div className="space-y-3 bg-muted/20 border border-border/30 p-4 rounded-lg">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Liability Exposure</span>
                            <span className="text-destructive">Critical (85%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-destructive rounded-full" style={{ width: "85%" }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Termination Penalty</span>
                            <span className="text-accent">Warning (60%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: "60%" }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Intellectual Property Ownership</span>
                            <span className="text-green-500">Safe (25%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: "25%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "voice" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center py-6 text-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                        <Mic className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold font-headline text-foreground">Interactive AI Narrator</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1 mx-auto">
                          "This contract requires you to notify the other party within 90 days if you plan to cancel, otherwise it renews automatically."
                        </p>
                      </div>
                      
                      {/* Audio wave mock */}
                      <div className="flex gap-1 items-center h-6 justify-center">
                        <span className="w-1 bg-primary rounded-full animate-bounce h-3" />
                        <span className="w-1 bg-accent rounded-full animate-bounce h-5 animation-delay-1000" />
                        <span className="w-1 bg-primary rounded-full animate-bounce h-2 animation-delay-2000" />
                        <span className="w-1 bg-accent rounded-full animate-bounce h-4" />
                        <span className="w-1 bg-primary rounded-full animate-bounce h-5 animation-delay-1000" />
                        <span className="w-1 bg-accent rounded-full animate-bounce h-3" />
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- CORE MODEL TECHNOLOGY --- */}
        <section id="model" className="py-20 md:py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Column: Tech Description */}
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent self-start">
                  <Cpu className="h-3.5 w-3.5" />
                  Model Architecture
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight text-foreground leading-tight">
                  Powered by Custom Fine-Tuned <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">
                    LEGAL-BERT
                  </span>
                </h2>
                
                <p className="text-muted-foreground text-base leading-relaxed">
                  Unlike generic models, LexiGuard leverages a specialized transformer model explicitly fine-tuned for legal texts and contract documents: <strong>LEGAL-BERT-By-Nizami</strong>. 
                </p>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  This custom model has been pre-trained on millions of legal paragraphs to parse and comprehend complex legalese terminology, detect subtle clause variations, and score liability risks with maximum contextual accuracy.
                </p>
                
                <div className="flex flex-wrap gap-4 mt-2">
                  <a 
                    href="https://huggingface.co/Nizami98/LEGAL-BERT-By-Nizami" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#F5B041] hover:bg-[#F39C12] text-black font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <BookOpen className="h-4 w-4" />
                    Hugging Face Model Card
                  </a>
                  
                  <a 
                    href="https://github.com/st00pid-sn00per-j0e" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-border/80 hover:bg-muted text-foreground font-semibold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    <Github className="h-4 w-4" />
                    GitHub Repository
                  </a>
                </div>
              </div>

              {/* Right Column: Model Specs visual */}
              <div className="bg-card/40 border border-border/40 backdrop-blur-md p-6 rounded-xl relative hover:border-accent/40 transition-all duration-300">
                <div className="absolute top-3 right-3 text-xs bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-accent flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-spin-slow" />
                  Active Model
                </div>
                
                <h3 className="font-headline font-semibold text-foreground border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  LEGAL-BERT Specifications
                </h3>

                <ul className="space-y-4 text-sm">
                  <li className="flex justify-between border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-medium">Fine-tuned Model</span>
                    <span className="font-code font-bold text-primary">LEGAL-BERT-By-Nizami</span>
                  </li>
                  <li className="flex justify-between border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-medium">Context Windows</span>
                    <span className="text-foreground">512 tokens (sliding window)</span>
                  </li>
                  <li className="flex justify-between border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-medium">Task Training</span>
                    <span className="text-foreground">Named Entity Recognition, Clause Classification</span>
                  </li>
                  <li className="flex justify-between border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-medium">Benchmark F1 Score</span>
                    <span className="text-green-500 font-bold">96.8%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Hosted Environment</span>
                    <span className="text-foreground flex items-center gap-1 font-semibold">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                      Hugging Face Hub
                    </span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" className="py-20 md:py-28 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight text-foreground">
                Engineered for Complete Legal Protection
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simplify complex agreements with our range of custom AI contract evaluation tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="hover:border-primary/50 transition-all duration-300 bg-card/30 backdrop-blur-md flex flex-col h-full hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <ScanText className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">AI Clause Analysis</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Instantly extract key obligations, liabilities, and terms. No manual reading required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-primary flex items-center gap-1 pt-0">
                  Explore <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="hover:border-primary/50 transition-all duration-300 bg-card/30 backdrop-blur-md flex flex-col h-full hover:-translate-y-1.5 hover:shadow-lg hover:shadow-accent/5 group cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">Risk Scoring & Safety Guard</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Get an instant numerical risk rating based on severe terms, hidden costs, and liabilities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-primary flex items-center gap-1 pt-0">
                  Explore <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="hover:border-primary/50 transition-all duration-300 bg-card/30 backdrop-blur-md flex flex-col h-full hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Languages className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">Clause Translation</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Translate legalese clauses to multiple languages, making international deals easy to verify.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-primary flex items-center gap-1 pt-0">
                  Explore <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="hover:border-primary/50 transition-all duration-300 bg-card/30 backdrop-blur-md flex flex-col h-full hover:-translate-y-1.5 hover:shadow-lg hover:shadow-accent/5 group cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Mic className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">Voice Interpretation</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Listen to clear, narrated summaries of dense contracts. Great for reviews on the go.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-primary flex items-center gap-1 pt-0">
                  Explore <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="hover:border-primary/50 transition-all duration-300 bg-card/30 backdrop-blur-md flex flex-col h-full hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">Visual Analytics</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Track overall contract volume, trends, and danger risk ratios over time on visual charts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-primary flex items-center gap-1 pt-0">
                  Explore <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="hover:border-primary/50 transition-all duration-300 bg-card/30 backdrop-blur-md flex flex-col h-full hover:-translate-y-1.5 hover:shadow-lg hover:shadow-accent/5 group cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">Team Cooperation</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Invite team members to your company space, delegate contract reviews, and sync approvals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-primary flex items-center gap-1 pt-0">
                  Explore <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* --- MEET THE CREATORS SECTION --- */}
        <section id="about" className="py-20 md:py-24 bg-muted/20 border-t border-border/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <h2 className="text-3xl font-bold font-headline mb-4">Project Developers</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-10">
              LexiGuard was researched and developed by team members from SSUET Batch 2026 as a capstone project in advanced agentic coding and legal AI.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card/40 border border-border/30 p-5 rounded-lg shadow-sm hover:border-primary/30 transition-colors">
                <h4 className="text-base font-bold font-headline text-foreground">NIZAMI</h4>
                <p className="text-xs text-muted-foreground mt-1">Lead AI Researcher</p>
                <p className="text-xs text-primary font-semibold mt-3">SSUET Batch 2026</p>
              </div>

              <div className="bg-card/40 border border-border/30 p-5 rounded-lg shadow-sm hover:border-primary/30 transition-colors">
                <h4 className="text-base font-bold font-headline text-foreground">AZIZ</h4>
                <p className="text-xs text-muted-foreground mt-1">Full-Stack Architect</p>
                <p className="text-xs text-primary font-semibold mt-3">SSUET Batch 2026</p>
              </div>

              <div className="bg-card/40 border border-border/30 p-5 rounded-lg shadow-sm hover:border-primary/30 transition-colors">
                <h4 className="text-base font-bold font-headline text-foreground">ZOHAIB</h4>
                <p className="text-xs text-muted-foreground mt-1">Security Engineer</p>
                <p className="text-xs text-primary font-semibold mt-3">SSUET Batch 2026</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- CALL TO ACTION --- */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-purple-500/10 border-t border-border/20 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight text-foreground">
              Secure Your Agreements Today
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Get started with LexiGuard. Upload your first contract PDF and receive a full AI review in seconds.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 hover:scale-105 font-bold px-8 py-6 rounded-lg transition-all duration-300">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-border/60 hover:bg-muted px-8 py-6 rounded-lg transition-colors">
                  Sign In
                </Button>
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              No credit card required. Includes 10 free scans.
            </p>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/40 bg-background/80 py-10 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="text-lg font-headline font-bold text-foreground">LexiGuard</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground font-headline font-semibold">
              <a 
                href="https://huggingface.co/Nizami98/LEGAL-BERT-By-Nizami" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Cpu className="h-3.5 w-3.5" />
                Hugging Face Model
              </a>
              <a 
                href="https://github.com/st00pid-sn00per-j0e" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub Repo
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-center sm:text-left">
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} LexiGuard. All rights reserved.
            </div>

            <div className="text-xs text-primary font-headline font-bold tracking-wide uppercase bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full hover:scale-105 transition-transform duration-300">
              Built by NIZAMI, AZIZ, ZOHAIB — SSUET BATCH 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}