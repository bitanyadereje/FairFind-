import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import pool from '../config/db';

const CHANNELS = [
  'Ethiomarket411',
  'ShinebySHEIN',
  'Noh_online_shopping',
  'pagesandpensco',
  'mis_shopping',
  'Yoni0965620926',
  'cuzoshchic',
  'lehemsclothing',
  'Nans_closet',
  'abolbookstore',
  'ETHIOPHARMAINFO',
  'sol54298',
  'liy2354',
  'nejashionlinemarketing',
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeChannel(username: string) {
  const url = `https://t.me/s/${username}`;
  console.log(`🌐 Fetching ${url}...`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const messages: { text: string; chatId: string; messageId: string }[] = [];

    $('.tgme_widget_message').each((_, el) => {
      const postData = $(el).attr('data-post');
      if (!postData) return;

      const parts = postData.split('/');
      if (parts.length !== 2 || !parts[0] || !parts[1]) return;

      // Use non-null assertion because we validated above
      const chatId = parts[0]!;
      const messageId = parts[1]!;

      const textEl = $(el).find('.tgme_widget_message_text');
      const text = textEl.text().trim();

      if (text && text.length > 10) {
        messages.push({ text, chatId, messageId });
      }
    });

    if (messages.length === 0) {
      console.log(`⚠️ No messages found for ${username}`);
      return;
    }

    let inserted = 0;
    let duplicates = 0;

    for (const msg of messages) {
      const check = await pool.query(
        `SELECT id FROM raw_feeds WHERE source = $1 AND telegram_message_id = $2`,
        [`telegram_web_${username}`, msg.messageId]
      );

      if (check.rows.length === 0) {
await pool.query(
  `INSERT INTO raw_feeds (source, raw_text, captured_at, processed, telegram_chat_id, telegram_message_id, channel_username)
   VALUES ($1, $2, NOW(), false, $3, $4, $5)`,
  [`telegram_web_${username}`, msg.text, msg.chatId, msg.messageId, username]
);
        inserted++;
      } else {
        duplicates++;
      }
    }

    console.log(`✅ ${username}: found ${messages.length} msgs, inserted ${inserted}, duplicates ${duplicates}`);
  } catch (err) {
    console.error(`❌ Error scraping ${username}:`, err);
  }
}

async function scrapeAll() {
  console.log(`🕷️ Starting scrape of ${CHANNELS.length} channels...`);
  for (const channel of CHANNELS) {
    await scrapeChannel(channel);
    await delay(2000);
  }
  console.log('🎉 Scraping cycle finished.');
}

scrapeAll().catch(console.error);