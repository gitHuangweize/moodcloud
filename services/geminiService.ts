
import { GoogleGenAI, Type } from "@google/genai";
import { Thought, ThoughtType } from "../types";
import { supabase } from './supabaseService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const incrementAiStats = async () => {
  try {
    await supabase.rpc('increment_ai_calls_count');
  } catch (error) {
    console.error('Failed to increment AI stats:', error);
  }
};

export const geminiService = {
  /**
   * Generates a random set of grumbles and insights to fill the space
   */
  async generateMockThoughts(): Promise<Partial<Thought>[]> {
    try {
      await incrementAiStats();
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
      await incrementAiStats();
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
      await incrementAiStats();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一个精通文学的润色助手。请将下面这段话润色得更简练、更有意境或更具诗意。
要求：
1. 直接输出润色后的文本，禁止包含任何解析、风格选项、序号或解释性文字。
2. 字数控制在 15 字以内。
3. 保持原意但提升文采。

待润色内容： "${input}"`,
      });
      // 进一步确保清理掉可能的 Markdown 格式或多余换行
      return response.text.replace(/[*#>`-]/g, '').trim().split('\n')[0];
    } catch (error) {
      return input;
    }
  }
};
