"use server";

import { AI_API_URL } from "@/lib/api";
import { z } from "zod";

export interface TranslateLegalClausesInput {
  clause: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslateLegalClausesOutput {
  translatedClause: string;
  audioUrl?: string;
}

const translationSchema = z.object({
  clause: z.string().min(1, "Clause cannot be empty."),
  sourceLanguage: z.string().min(1, "Source language must be selected."),
  targetLanguage: z.string().min(1, "Target language must be selected."),
});

export async function translateClauseAction(
  input: TranslateLegalClausesInput
): Promise<TranslateLegalClausesOutput> {
  const validation = translationSchema.safeParse(input);

  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  try {
    // The /api/v1/translate endpoint accepts: { text, target_language }
    // and returns a plain string (the translated text)
    const response = await fetch(`${AI_API_URL}/v1/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input.clause,
        target_language: getLanguageCode(input.targetLanguage),
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errBody.detail || `Backend error: ${response.statusText}`);
    }

    // The API returns an object like { original_text, translated_text, detected_language, target_language }
    const json = await response.json();
    const translated: string = json.translated_text || "";

    return {
      translatedClause: translated,
    };
  } catch (error: any) {
    console.error("Error translating clause:", error);
    throw new Error(
      error.message || "Translation service is currently unavailable. Please try again later."
    );
  }
}

function getLanguageCode(language: string): string {
  const map: Record<string, string> = {
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Japanese: "ja",
    Chinese: "zh-cn",
    Italian: "it",
    Portuguese: "pt",
    Russian: "ru",
    Korean: "ko",
    Arabic: "ar",
    Hindi: "hi",
    Urdu: "ur",
  };
  return map[language] || language.toLowerCase();
}
