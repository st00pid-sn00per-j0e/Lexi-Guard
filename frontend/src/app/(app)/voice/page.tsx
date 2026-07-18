"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, Upload, FileText, Languages, Square, Loader2, Copy, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { uploadAudioFile } from "./actions";

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export default function VoiceInterpretationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRecordingRef = useRef(false);

  const { toast } = useToast();

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setError("Your browser does not support the Web Speech API. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setError(null);

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (finalText) {
        setTranscript((prev) => prev + (prev ? " " : "") + finalText.trim());
      }
      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied.");
        setIsRecording(false);
        isRecordingRef.current = false;
      } else if (event.error !== "no-speech") {
        setError(`Error: ${event.error}`);
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach((track) => track.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const getMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setHasMicPermission(true);
      return stream;
    } catch (error) {
      setHasMicPermission(false);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please enable permissions.",
      });
      return null;
    }
  };

  const startAudioProcessing = (stream: MediaStream) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const audioContext = audioContextRef.current;
    if (!analyserRef.current) analyserRef.current = audioContext.createAnalyser();
    const analyser = analyserRef.current;
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
      dataArrayRef.current = new Uint8Array(bufferLength);
    }
    const dataArray = dataArrayRef.current;

    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray as Uint8Array);
      const average = Array.from(dataArray).reduce((acc, val) => acc + val, 0) / bufferLength;
      setAudioLevel(Math.min(100, (average / 128) * 100));
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    updateAudioLevel();
  };

  const stopAudioProcessing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      isRecordingRef.current = false;
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopAudioProcessing();
    } else {
      const stream = await getMicrophonePermission();
      if (stream) {
        setIsRecording(true);
        isRecordingRef.current = true;
        startAudioProcessing(stream);
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      }
    }
  };

  const handleCopy = () => {
    if (!transcript.trim()) return;
    navigator.clipboard.writeText(transcript);
    toast({ title: "Copied", description: "Transcript copied to clipboard." });
  };

  const handleClear = () => {
    setTranscript("");
    setInterimTranscript("");
    toast({ title: "Cleared", description: "Transcription output cleared." });
  };

  const handleSendToAnalysis = () => {
    if (!transcript.trim()) {
      toast({ variant: "destructive", title: "Error", description: "No transcript to send." });
      return;
    }
    sessionStorage.setItem("lexiguard_analysis_prefill", JSON.stringify({ text: transcript }));
    window.location.href = "/analysis";
  };

  const handleSendToTranslation = () => {
    if (!transcript.trim()) {
      toast({ variant: "destructive", title: "Error", description: "No transcript to send." });
      return;
    }
    sessionStorage.setItem("lexiguard_translate_prefill", JSON.stringify({ text: transcript }));
    window.location.href = "/translation";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast({ title: "Uploading...", description: "Processing audio file." });

    const result = await uploadAudioFile(file);

    if (result.success) {
      if (result.text) {
        setTranscript((prev) => prev + (prev ? " " : "") + result.text);
        toast({ title: "Success", description: "Audio transcribed successfully." });
      } else {
        toast({ title: "Success", description: "Audio uploaded successfully." });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: result.message || "Could not process audio file.",
      });
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!supported) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Unsupported Browser</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Voice Interpretation" />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Real-Time Transcription</CardTitle>
          <CardDescription>
            Convert spoken contracts or negotiations into text for analysis and translation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
            <Button size="lg" onClick={handleToggleRecording} disabled={hasMicPermission === false}>
              {isRecording ? (
                <>
                  <Square className="mr-2 h-5 w-5" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" /> Start Recording
                </>
              )}
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="audio/*"
              onChange={handleFileChange}
            />
          </div>

          {hasMicPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>Microphone Access Required</AlertTitle>
              <AlertDescription>Please allow microphone access in your browser.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-lg font-headline">Audio Level</h3>
            <div className="w-full h-24 bg-secondary rounded-lg flex items-center justify-center p-8">
              <Progress value={isRecording ? audioLevel : 0} className="h-4" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg font-headline">Transcription Output</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
            <div className="w-full min-h-48 p-4 bg-secondary rounded-lg border relative">
              {isRecording && (
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Recording and transcribing...</span>
                </div>
              )}
              <ScrollArea className="h-36 w-full">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript ? <span className="text-muted-foreground"> {interimTranscript}</span> : null}
                </p>
                {!transcript && !interimTranscript ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Press “Start Recording” and begin speaking...
                  </div>
                ) : null}
              </ScrollArea>
              {error ? (
                <div className="mt-3 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSendToAnalysis}>
              <FileText className="mr-2 h-4 w-4" />
              Send to Clause Analysis
            </Button>
            <Button onClick={handleSendToTranslation}>
              <Languages className="mr-2 h-4 w-4" />
              Send to Translation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
