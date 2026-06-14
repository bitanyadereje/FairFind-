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

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '{}';
    // Remove any markdown code block markers if present
    const jsonStr = content.replace(/```json\s*|\s*```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error extracting product from text:', error);
    // Return a default object with nulls to avoid breaking the pipeline
    return {
      item_name: null,
      price: null,
      currency: 'ETB',
      condition: null,
      location: null,
      contact_info: null,
      category: null
    };
  }
}