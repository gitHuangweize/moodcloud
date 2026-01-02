
import { GoogleGenAI, Type } from "@google/genai";
import { Thought, ThoughtType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  /**
   * Generates a random set of grumbles and insights to fill the space
   */
  async generateMockThoughts(): Promise<Partial<Thought>[]> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Generate 10 short, poetic or witty Chinese sentences that are either a "grumble" (牢骚) or an "insight" (心得). Maximum 20 characters per sentence.',
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['GRUMBLE', 'INSIGHT', 'WHISPER'] },
              },
              required: ['content', 'type']
            }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error('Failed to generate thoughts:', error);
      return [];
    }
  },

  /**
   * Classifies a thought into GRUMBLE, INSIGHT, or WHISPER
   */
  async classifyThought(content: string): Promise<ThoughtType> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Classify the following text into "GRUMBLE" (complaint, venting), "INSIGHT" (learning, realization), or "WHISPER" (neutral, random thought). Text: "${content}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['GRUMBLE', 'INSIGHT', 'WHISPER'] }
            },
            required: ['type']
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      console.log(result);
      return (result.type as ThoughtType) || ThoughtType.WHISPER;
    } catch (error) {
      console.warn('AI classification failed, falling back to WHISPER', error);
      return ThoughtType.WHISPER;
    }
  },

  /**
   * Refines a user's raw grumble into something more poetic or structured
   */
  async refineThought(input: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine this Chinese grumble or insight into a more concise, evocative version (max 15 chars): "${input}"`,
      });
      return response.text.trim();
    } catch (error) {
      return input;
    }
  }
};
