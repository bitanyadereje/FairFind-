import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import pool from '../config/db';

const CATEGORIES = ['phones', 'electronics', 'clothing', 'cars'];

async function scrapeJiji() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const cat of CATEGORIES) {
      const url = `https://jiji.et/${cat}`;
      console.log(`🌐 Fetching ${url} with Playwright...`);
      const page = await browser.newPage();
      // Playwright's default user agent is already a modern Chrome browser.
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const html = await page.content();
      await page.close();

      const $ = cheerio.load(html);
      const listings: string[] = [];
      $('.b-list-advert-item').each((_, el) => {
        const title = $(el).find('.advert-title').text().trim();
        const price = $(el).find('.price').text().trim();
        const desc = $(el).find('.description').text().trim();
        const rawText = `${title} ${price} ${desc}`;
        if (rawText.length > 20) listings.push(rawText);
      });

      for (const text of listings) {
        await pool.query(
          `INSERT INTO raw_feeds (source, raw_text, captured_at, processed)
           VALUES ($1, $2, NOW(), false)`,
          [`jiji_et_${cat}`, text]
        );
      }
      console.log(`✅ ${cat}: inserted ${listings.length} messages`);
    }
  } finally {
    await browser.close();
  }
}

scrapeJiji().catch(console.error);