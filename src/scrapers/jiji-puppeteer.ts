import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import pool from '../config/db';

const CATEGORIES = ['phones', 'electronics', 'clothing', 'cars'];

async function scrapeJiji() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  for (const cat of CATEGORIES) {
    const url = `https://jiji.et/${cat}`;
    console.log(`🌐 Fetching ${url} with Puppeteer...`);
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
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
    } catch (err: any) {
      console.error(`❌ Error scraping ${cat}:`, err.message);
    }
  }
  await browser.close();
}

scrapeJiji().catch(console.error);