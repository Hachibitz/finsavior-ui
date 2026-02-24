import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your Gemini API Key to get insights.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a summary for the prompt
  const recentTransactions = transactions.slice(0, 15); // Analyze last 15
  const summary = recentTransactions.map(t => 
    `- ${t.date.split('T')[0]}: ${t.type === 'income' ? '+' : '-'}$${t.amount} (${t.category}) - ${t.description}`
  ).join('\n');

  const prompt = `
    You are an expert financial advisor named FinSavior.
    Analyze the following recent transactions and provide 3 short, actionable bullet points of advice or observations.
    Be encouraging but realistic. Focus on spending habits, savings potential, or unusual expenses.
    Keep the tone professional yet friendly. Use markdown formatting.

    Transactions:
    ${summary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights available at the moment.";
  } catch (error) {
    console.error("Error fetching financial advice:", error);
    return "Unable to generate insights right now. Please try again later.";
  }
};