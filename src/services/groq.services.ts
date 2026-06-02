import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ExtractedProduct {
  item_name: string | null;
  price: number | null;
  currency: string | null;
  condition: string | null;
  location: string | null;
  contact_info: string | null;
  category: string | null;
}

export async function extractProductFromText(rawText: string): Promise<ExtractedProduct> {
  const prompt = `
Extract structured data from this Ethiopian marketplace post. Return ONLY valid JSON.

Fields: item_name, price (number in ETB), currency (default "ETB"), condition, location, contact_info, category.

Text: """${rawText}"""
`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0]?.message?.content || '{}';
  const jsonStr = content.replace(/```json\s*|\s*```/g, '').trim();
  return JSON.parse(jsonStr);
}