import { fetchJsonWithAuth, fetchWithAuth } from "@/lib/api-client";
import { API_URL } from "@/lib/api";

export interface SaveTranscriptionResult {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Saves the transcribed text to the backend using the authenticated API client.
 */
export async function saveTranscription(
  text: string
): Promise<SaveTranscriptionResult> {
  try {
    const data = await fetchJsonWithAuth(`${API_URL}/voice-transcripts`, {
      method: "POST",
      body: JSON.stringify({
        text,
        source: "voice_input",
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Error saving transcription:", error);
    return {
      success: false,
      message: error?.message || "Failed to save to database.",
    };
  }
}

/**
 * Uploads an audio file to the backend for transcription.
 */
export async function uploadAudioFile(
  file: File
): Promise<{ success: boolean; text?: string; message?: string }> {
  try {
    const formData = new FormData();
    formData.append("audio", file);

    // Use fetchWithAuth with skipContentType to allow the browser to set the multipart/form-data boundary
    const response = await fetchWithAuth(`${API_URL}/voice-transcripts/upload`, {
      method: "POST",
      body: formData,
      skipContentType: true,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Upload failed");
    }

    const data = await response.json();

    // Adjust the key based on what your backend actually returns (e.g., data.text, data.transcript)
    return { success: true, text: data?.text || data?.transcript };
  } catch (error: any) {
    console.error("Error uploading audio file:", error);
    return {
      success: false,
      message: error?.message || "Failed to upload audio file.",
    };
  }
}

