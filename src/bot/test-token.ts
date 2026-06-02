import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
console.log('Token exists:', !!token);
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
  process.exit(1);
}

const bot = new Telegraf(token);
bot.telegram.getMe().then((me) => {
  console.log('✅ Bot is valid:', me.username);
  process.exit(0);
}).catch((err) => {
  console.error('❌ Bot token invalid or network issue:', err.message);
  process.exit(1);
});