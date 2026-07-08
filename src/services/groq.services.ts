import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Gemini client (free tier)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ExtractedProduct {
  item_name: string | null;
  price: number | null;
  currency: string | null;
  condition: string | null;
  location: string | null;
  contact_info: string | null;
  category: string | null;
}

/**
 * Extracts structured product data from messy Telegram text.
 * Tries Groq first; if it fails (rate limit, server error), falls back to Gemini.
 */
export async function extractProductFromText(rawText: string): Promise<ExtractedProduct> {
  const prompt = `
You are an AI that extracts structured product data from Ethiopian marketplace posts on Telegram. The text may mix Amharic (Fidel), English, Latin-script Amharic, emojis, and inconsistent formatting.

Extract the following fields as JSON. If a field is missing, use null.

- item_name: the specific product name (e.g., 'Jumpsuit', 'Two piece', 'iPhone 12', 'Sweater')
- price: numeric value in Ethiopian Birr (extract only the number, ignore non-numeric characters like '❌', '✅', 'birr', 'ETB', '💵')
- currency: "ETB" (default)
- condition: "new", "used", or null
- location: city/area if mentioned, else null
- contact_info: Telegram username (e.g., @username) or phone number
- category: one word like 'clothing', 'electronics', 'shoes', 'accessories', 'books', 'cars'

Examples:

Text: "✋available On hand Jumpsuit ✨Size medium and small 3500💵Contact @Noh_online"
Output: {"item_name": "Jumpsuit", "price": 3500, "currency": "ETB", "condition": null, "location": null, "contact_info": "@Noh_online", "category": "clothing"}

Text: "Two piece Size medium 2300💵Contact @Noh_online"
Output: {"item_name": "Two piece", "price": 2300, "currency": "ETB", "condition": null, "location": null, "contact_info": "@Noh_online", "category": "clothing"}

Text: "▫️AVAILABLE ON HAND ▫️4500 Birr ▫️Contact @Lehem‼️"
Output: {"item_name": null, "price": 4500, "currency": "ETB", "condition": null, "location": null, "contact_info": "@Lehem", "category": "clothing"}

Now extract from this text: """${rawText}"""
Return ONLY valid JSON. No extra text, no markdown, no explanation.
`;

  // ---------- Step 1: Try Groq ----------
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonStr = content.replace(/```json\s*|\s*```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (groqError: any) {
    // Only fallback if it's a rate limit (429) or server error (5xx)
    const shouldFallback =
      groqError.status === 429 ||
      (groqError.status >= 500 && groqError.status < 600) ||
      groqError.message?.includes('rate limit') ||
      groqError.message?.includes('timeout');

    if (!shouldFallback) {
      // If it's a different error (e.g., invalid API key), rethrow
      console.error('❌ Groq error (non‑fallback):', groqError);
      throw groqError;
    }

    console.warn('⚠️ Groq failed, falling back to Gemini...', groqError.message || groqError);

    // ---------- Step 2: Fallback to Gemini ----------
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (geminiError) {
      console.error('❌ Gemini fallback also failed:', geminiError);
      // Return a safe fallback object to avoid crashing the pipeline
      return {
        item_name: null,
        price: null,
        currency: 'ETB',
        condition: null,
        location: null,
        contact_info: null,
        category: null,
      };
    }
  }
}