import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/types';
import dotenv from 'dotenv';
import pool from '../config/db';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN missing in .env');
  process.exit(1);
}

const bot = new Telegraf(token);

function isTextMessage(message: Message): message is Message.TextMessage {
  return 'text' in message;
}

bot.command('search', async (ctx: Context) => {
      console.log('🔍 Search command received'); // <-- add this

  if (!ctx.message || !isTextMessage(ctx.message)) return;

  const query = ctx.message.text.replace('/search', '').trim();
  if (!query) {
    return ctx.reply('🔍 Usage: /search <product name>');
  }

  try {
    const { rows } = await pool.query(
      `SELECT item_name, price, currency, condition, location, contact_info, fairness_status
       FROM structured_marketplace
       WHERE item_name ILIKE $1 OR category ILIKE $1
       ORDER BY id DESC
       LIMIT 10`,
      [`%${query}%`]
    );

    if (rows.length === 0) {
      return ctx.reply(`No products found for "${query}". Try a different term.`);
    }

    let message = `📦 *Results for "${query}"*\n\n`;
    for (const row of rows) {
      let fairnessStatus = row.fairness_status || 'unknown';
      let emoji = '⚪';
      if (fairnessStatus === 'fair') emoji = '🟢';
      else if (fairnessStatus === 'overpriced') emoji = '🟡';
      else if (fairnessStatus === 'extreme_overpriced') emoji = '🔴';
      else if (fairnessStatus === 'underpriced_good_deal') emoji = '💚';
      else if (fairnessStatus === 'insufficient_data') emoji = '⚪';
      else emoji = '⚪';

      message += `${emoji} *${row.item_name}* – ${row.price} ${row.currency}\n`;
      if (row.condition) message += `   📌 Condition: ${row.condition}\n`;
      if (row.location) message += `   📍 Location: ${row.location}\n`;
      if (row.contact_info) message += `   📞 Contact: ${row.contact_info}\n`;
      message += `   🏷️ Fairness: ${fairnessStatus}\n\n`;
    }
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('❌ Search error:', err);
    ctx.reply('Sorry, something went wrong. Please try later.');
  }
});

bot.start((ctx: Context) => {
  if (!ctx.message || !isTextMessage(ctx.message)) return;
  ctx.reply(
    'Welcome to EthioMarket-Pulse! 🔍\nUse /search <product> to find current listings with price fairness analysis.'
  );
});

console.log('🚀 Attempting to launch bot...');
bot.launch()
  .then(() => console.log('🤖 Search bot running...'))
  .catch((err) => {
    console.error('❌ Failed to launch bot:', err);
    process.exit(1);
  });
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));