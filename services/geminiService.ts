import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ImageData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export interface SpectacleSuggestion {
  styleName: string;
  description: string;
  reason: string;
  color: string;
}

export const getSpectacleSuggestions = async (
  faceImage: ImageData
): Promise<SpectacleSuggestion[]> => {
  const model = 'gemini-2.5-flash';
  const prompt = `
    Analyze this person's face shape (e.g., oval, square, round, heart).
    Based on the analysis, suggest 5 distinct spectacle styles that would be flattering.
    For each style, provide a name, a brief description, a reason why it suits the face shape, and also suggest a suitable color (e.g., 'Tortoiseshell', 'Matte Black', 'Gold').
  `;
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: faceImage.base64,
              mimeType: faceImage.mimeType,
            },
          },
          {
            text: prompt,
          },
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              styleName: {
                type: Type.STRING,
                description: "The name of the spectacle style, e.g., 'Wayfarer', 'Cat-Eye'."
              },
              description: {
                type: Type.STRING,
                description: "A brief description of the spectacle style."
              },
              reason: {
                type: Type.STRING,
                description: "The reason why this style is suitable for the person's face shape."
              },
              color: {
                type: Type.STRING,
                description: "A suitable color for the spectacles, e.g., 'Matte Black'."
              }
            },
            required: ["styleName", "description", "reason", "color"],
          }
        }
      }
    });
    const suggestions = JSON.parse(response.text);
    return suggestions as SpectacleSuggestion[];
  } catch (error) {
    console.error("Error getting spectacle suggestions:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned an unexpected format. Please try again.");
    }
    throw new Error("Failed to get suggestions from Gemini API.");
  }
};

export const addSpectaclesToImage = async (faceImage: ImageData, styleName: string, color: string): Promise<ImageData> => {
  const prompt = `Photorealistically add a pair of ${color} ${styleName} spectacles to this person's face. The glasses should fit naturally, be appropriately sized, and match the lighting and angle of the photo. Do not alter the rest of the face or the background.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: faceImage.base64,
              mimeType: faceImage.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      }
    }
    throw new Error(`No edited image was generated for ${styleName}.`);
  } catch (error) {
    console.error(`Error adding ${styleName} spectacles to image:`, error);
    throw new Error(`Failed to generate an image with ${styleName} spectacles.`);
  }
};

// FIX: Add the missing 'editImageWithPrompt' function that is imported by ImageEditor.tsx.
export const editImageWithPrompt = async (image: ImageData, prompt: string): Promise<ImageData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      }
    }
    throw new Error(`No edited image was generated for the prompt.`);
  } catch (error) {
    console.error(`Error editing image with prompt:`, error);
    throw new Error(`Failed to generate an image with the given prompt.`);
  }
};