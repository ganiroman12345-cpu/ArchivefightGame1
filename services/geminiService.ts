import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateFightIntro = async (player: string, enemy: string): Promise<string> => {
  const client = getClient();
  if (!client) return "ROUND 1... FIGHT!";

  try {
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("ROUND 1... FIGHT!"), 1200);
    });

    const apiPromise = (async () => {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a very short (max 6 words), intense arcade fight intro for ${player} vs ${enemy}.`,
      });
      return response.text.toUpperCase().replace(/['"]+/g, '').trim() || "READY... FIGHT!";
    })();

    return await Promise.race([apiPromise, timeoutPromise]);
  } catch (error) {
    return "ROUND 1... FIGHT!";
  }
};

export const generateVictoryQuote = async (winner: string): Promise<string> => {
  const client = getClient();
  if (!client) return `${winner.toUpperCase()} WINS!`;

  try {
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve(`${winner.toUpperCase()} WINS!`), 1200);
    });

    const apiPromise = (async () => {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short (max 5 words) victory quote for ${winner}.`,
      });
      return response.text.toUpperCase().replace(/['"]+/g, '').trim() || `${winner.toUpperCase()} WINS!`;
    })();

    return await Promise.race([apiPromise, timeoutPromise]);
  } catch (error) {
    return `${winner.toUpperCase()} DOMINATES!`;
  }
};

