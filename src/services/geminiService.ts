import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface VocabQuestion {
  word: string;
  definition: string;
  options: string[];
  correctIndex: number;
  difficulty: string;
}

export async function generateVocabQuestions(difficulty: string, count: number = 5): Promise<VocabQuestion[]> {
  const prompt = `Generate ${count} English vocabulary questions for a ${difficulty} level learner.
  Each question should have:
  - A word (rare for that level)
  - A clear definition
  - 4 multiple choice options (one being the correct word, the others plausible but incorrect words)
  - The index of the correct word in the options array.
  Difficulty levels: easy (common words), medium (academic/professional), hard (rare/literary), mixed (a blend).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              definition: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctIndex: { type: Type.INTEGER },
              difficulty: { type: Type.STRING }
            },
            required: ["word", "definition", "options", "correctIndex", "difficulty"]
          }
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating vocab questions:", error);
    return [];
  }
}
