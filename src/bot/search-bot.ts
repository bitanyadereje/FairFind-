import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import pool from '../config/db';
import express from 'express';
dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.command('search', async (ctx) => {
  const query = ctx.message.text.replace('/search', '').trim();
  if (!query) {
    return ctx.reply('🔍 Usage: /search <product name>');
  }

  try { 
    const { rows } = await pool.query(
      `SELECT item_name, price, currency, condition, location, contact_info, fairness_status, message_url
       FROM structured_marketplace
       WHERE item_name ILIKE $1 OR category ILIKE $1
       LIMIT 10`,
      [`%${query}%`]
    );
    
    if (rows.length === 0) {
      return ctx.reply(`No products found for "${query}".`);
    }

    let response = `📦 Results for "${query}":\n\n`;
    for (const row of rows) {
      const name = row.item_name || 'Unnamed';
      const price = row.price !== null ? row.price : '?';
      const currency = row.currency || 'ETB';
      const fairness = row.fairness_status || 'unknown';
      let emoji = '⚪';
      if (fairness === 'fair') emoji = '🟢';
      else if (fairness === 'overpriced') emoji = '🟡';
      else if (fairness === 'extreme_overpriced') emoji = '🔴';
      else if (fairness === 'underpriced_good_deal') emoji = '💚';

      response += `${emoji} ${name} – ${price} ${currency}\n`;
      if (row.condition) response += `   📌 Condition: ${row.condition}\n`;
      if (row.location) response += `   📍 Location: ${row.location}\n`;
      if (row.contact_info) response += `   📞 Contact: ${row.contact_info}\n`;
      if (row.message_url) response += `   🔗 ${row.message_url}\n`;  // plain URL (Telegram will make it clickable)
      response += `   🏷️ Fairness: ${fairness}\n\n`;
    }
    for (const row of rows) {
  console.log(`URL being sent: ${row.message_url}`); // ✅ inside loop
  // ... rest of your response building
}
    // No parse_mode -> plain text, links are still clickable
    await ctx.reply(response);
  } catch (err) {
    console.error('Search error:', err);
    ctx.reply('Sorry, something went wrong.');
  }
});

bot.command('ping', (ctx) => ctx.reply('pong'));


const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('OK'));
app.listen(port, () => console.log(`✅ Health check server on port ${port}`));


bot.launch();
console.log('🤖 Search bot running...');
