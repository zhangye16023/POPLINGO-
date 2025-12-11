import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DictionaryEntry, StoryResult } from "../types";
import { playPCMAudio } from "./audioUtils";

/**
 * Helper to clean JSON string if the model returns markdown code blocks
 */
const cleanJsonString = (str: string) => {
  return str.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
};

export const lookupWord = async (
  text: string,
  nativeLang: string,
  targetLang: string
): Promise<Partial<DictionaryEntry>> => {
  // Initialize client inside the function to ensure process.env.API_KEY is available
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Define the following text: "${text}".
    Source Language: ${targetLang}.
    Target Language (for definitions/translations): ${nativeLang}.
    
    Provide a JSON response with:
    1. "definition": A clear, natural definition in ${nativeLang}.
    2. "examples": An array of 2 objects, each having "text" (in ${targetLang}) and "translation" (in ${nativeLang}).
    3. "usageNote": A fun, casual, and lively explanation of cultural nuance, tone, or similar confusing words. Write this like a friend explaining it to another friend. Be concise. No greetings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            definition: { type: Type.STRING },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  translation: { type: Type.STRING },
                },
              },
            },
            usageNote: { type: Type.STRING },
          },
          required: ["definition", "examples", "usageNote"],
        },
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    try {
      return JSON.parse(cleanJsonString(textResponse));
    } catch (e) {
      console.error("JSON Parse Error:", e, "Raw:", textResponse);
      throw new Error("Failed to parse AI response.");
    }
  } catch (error) {
    console.error("Lookup failed:", error);
    throw error;
  }
};

export const generateVisualization = async (term: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `A bright, fun, flat vector art style illustration representing the concept of "${term}". Simple shapes, vibrant pop colors (pink, yellow, cyan). White background.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    // Iterate to find image part, checking for valid candidates
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    console.warn("No image data found in response");
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    // Return null instead of throwing so we don't block the dictionary lookup
    return null;
  }
};

export const speakText = async (text: string, voiceName: string = 'Kore') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      await playPCMAudio(audioData);
    } else {
      console.warn("No audio data returned");
    }
  } catch (error) {
    console.error("TTS failed:", error);
  }
};

export const generateStory = async (words: string[], nativeLang: string): Promise<StoryResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const wordsStr = words.join(", ");
  const prompt = `
    Write a short, funny, and memorable story (max 150 words) that incorporates the following words: ${wordsStr}.
    The story should be in the user's native language: ${nativeLang}.
    Bold the keywords from the list in the story.
    Also provide a fun title.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            story: { type: Type.STRING },
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No story generated");
    
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("Story generation failed:", error);
    throw error;
  }
};