
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PromptSuggestion } from "../types";

// Helper to initialize the client with the environment key
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Utility to strip data URL prefix if present
 */
const cleanBase64 = (base64: string): string => {
  return base64.includes(",") ? base64.split(",")[1] : base64;
};

/**
 * Utility to retry a function call in case of transient network/RPC errors
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isTransient = error?.message?.includes("500") || 
                        error?.message?.includes("xhr") || 
                        error?.message?.includes("Rpc failed");
    
    if (retries <= 0 || !isTransient) throw error;
    
    console.warn(`Transient error detected, retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return callWithRetry(fn, retries - 1, delay * 1.5);
  }
}

export const editImage = async (
  originalImageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  const ai = getAIClient();
  // Using gemini-2.5-flash-image for high-quality general image editing tasks
  const model = 'gemini-2.5-flash-image';
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64(originalImageBase64),
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) return null;

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};

export const getPromptSuggestions = async (
  imageBase64: string,
  mimeType: string
): Promise<PromptSuggestion[]> => {
  const ai = getAIClient();
  
  const fetchSuggestions = async () => {
    // gemini-3-flash-preview is excellent for multimodal analysis and JSON generation
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64(imageBase64),
              mimeType: mimeType,
            },
          },
          {
            text: "Examine this image. Suggest 5 highly creative and specific editing prompts. Focus on artistic styles, atmospheric lighting, or adding imaginative elements. Return ONLY a JSON array of objects with 'title', 'prompt', and 'category'.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A punchy name for the edit" },
              prompt: { type: Type.STRING, description: "The descriptive edit prompt" },
              category: { type: Type.STRING, description: "Style (e.g., Cyberpunk, Retro, Surreal)" }
            },
            required: ["title", "prompt", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      try {
        return JSON.parse(text) as PromptSuggestion[];
      } catch (e) {
        console.error("Failed to parse AI JSON response", text);
        return [];
      }
    }
    return [];
  };

  try {
    return await callWithRetry(fetchSuggestions);
  } catch (error) {
    console.error("Gemini Suggestion Error after retries:", error);
    return [];
  }
};
