
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PromptSuggestion } from "../types";

// Helper to initialize the client with the environment key
const getAIClient = () => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env.local file.');
  }
  return new GoogleGenAI({ apiKey });
};

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
  // Using gemini-2.5-flash for multimodal capabilities
  const model = 'models/gemini-2.5-flash';
  
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

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error('No response received from Gemini API');
    }

    // Check if image was generated
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // Gemini models don't support image generation - provide helpful error
    throw new Error(
      'Image generation is not supported by Gemini models. ' +
      'Gemini can analyze images but cannot create or edit them. ' +
      'To add image generation, you would need to integrate with Imagen API or another image generation service.'
    );
  } catch (error: any) {
    console.error("Gemini Image Edit Error:", error);

    // Provide more helpful error messages
    if (error?.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your GEMINI_API_KEY in .env.local');
    } else if (error?.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please check your Google AI Studio quota.');
    } else if (error?.message?.includes('not found') || error?.message?.includes('404')) {
      throw new Error('Model not available. The image generation feature may not be enabled for your API key.');
    } else {
      throw new Error(error?.message || 'Failed to generate image. Please try again.');
    }
  }
};

export const getPromptSuggestions = async (
  imageBase64: string,
  mimeType: string
): Promise<PromptSuggestion[]> => {
  const ai = getAIClient();
  
  const fetchSuggestions = async () => {
    // gemini-2.5-flash is excellent for multimodal analysis and JSON generation
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
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
  } catch (error: any) {
    console.error("Gemini Suggestion Error after retries:", error);
    // Return empty array on error so app continues to work
    // User can still type their own prompt
    return [];
  }
};
