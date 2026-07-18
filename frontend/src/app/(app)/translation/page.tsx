"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Languages, ArrowRightLeft, Volume2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translateClauseAction } from "./actions";

const languages = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese", label: "Chinese" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Russian", label: "Russian" },
  { value: "Korean", label: "Korean" },
  { value: "Arabic", label: "Arabic" },
  { value: "Hindi", label: "Hindi" },
  { value: "Urdu", label: "Urdu" },
];

// We handle prefill loading in a useEffect to prevent Next.js hydration mismatches.

export default function TranslationPage() {
  const [loading, setLoading] = useState(false);
  // States initialize to default values for SSR/Hydration match
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [bannerVisible, setBannerVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Read from sessionStorage only on the client after hydration
    try {
      const raw = sessionStorage.getItem("lexiguard_translate_prefill");
      if (raw) {
        sessionStorage.removeItem("lexiguard_translate_prefill");
        const parsed = JSON.parse(raw) as { text?: string };
        if (parsed.text) {
          setSourceText(parsed.text);
          setBannerVisible(true);
        }
      }
    } catch {
      // safe ignore
    }
  }, []);

  const getLangCode = (languageName: string) => {
    const map: Record<string, string> = {
      English: "en-US",
      Spanish: "es-ES",
      French: "fr-FR",
      German: "de-DE",
      Japanese: "ja-JP",
      Chinese: "zh-CN",
      Italian: "it-IT",
      Portuguese: "pt-PT",
      Russian: "ru-RU",
      Korean: "ko-KR",
      Arabic: "ar-SA",
      Hindi: "hi-IN",
      Urdu: "ur-PK",
    };
    return map[languageName] || "en-US";
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (!translatedText.trim()) return;

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translatedText);
    const targetLangCode = getLangCode(targetLang);
    utterance.lang = targetLangCode;

    // Explicitly try to find a voice that matches the language code (vital for non-Latin scripts)
    const voices = window.speechSynthesis.getVoices();
    const prefix = targetLangCode.split('-')[0];
    const bestVoice = 
      voices.find((v) => v.lang === targetLangCode || v.lang.replace('_', '-') === targetLangCode) ||
      voices.find((v) => v.lang.startsWith(prefix));

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Error",
        description: "Source text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setTranslatedText("");
    try {
      const result = await translateClauseAction({
        clause: sourceText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });
      setTranslatedText(result.translatedClause);
    } catch (error) {
      console.error(error);
      toast({
        title: "Translation Failed",
        description: "An error occurred during translation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
  };

  return (
    <div>
      <PageHeader title="Legal Clause Translation" />

      {/* Info banner — shown when arriving from the Contracts page via "Translate PDF" */}
      {bannerVisible && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          <Languages className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">
            Contract content loaded from MongoDB — the text box has been pre-filled with the
            executive summary and all extracted clauses. Select a target language and click{" "}
            <strong>Translate</strong>.
          </span>
          <button
            className="shrink-0 text-primary/60 hover:text-primary transition-colors"
            onClick={() => setBannerVisible(false)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Translator</CardTitle>
          <CardDescription>
            Translate legal clauses with AI assistance, maintaining legal terminology.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg mb-6">
            <p className="text-sm text-muted-foreground">
              Have a full document? Go to <strong>Contract Management</strong> to upload and
              translate a full PDF.
            </p>
          </div>
          <div className="grid gap-4 mb-4 md:grid-cols-5 items-center">
            <div className="md:col-span-2">
              <Select value={sourceLang} onValueChange={setSourceLang} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Source Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="icon" onClick={handleSwapLanguages} disabled={loading}>
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="md:col-span-2">
              <Select value={targetLang} onValueChange={setTargetLang} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Textarea
              placeholder="Or paste a clause to translate..."
              className="min-h-64"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              disabled={loading}
            />
            <div className="relative">
              <Textarea
                placeholder="Translation will appear here..."
                className="min-h-64 bg-secondary/30 pb-12"
                value={translatedText}
                readOnly
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {translatedText && !loading && (
                <div className="absolute bottom-2 right-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 shadow-sm"
                    onClick={handleSpeak}
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="mr-2 h-4 w-4" /> Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" /> Read Aloud
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleTranslate} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Languages className="mr-2 h-4 w-4" />
              )}
              Translate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
