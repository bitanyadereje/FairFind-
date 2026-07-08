import axios from 'axios';
import * as cheerio from 'cheerio';
import pool from '../config/db';

const CATEGORIES = ['phones', 'electronics', 'clothing', 'cars'];

async function scrapeJiji() {
  for (const cat of CATEGORIES) {
    console.log(`🌐 Fetching ${cat} via Python service...`);
    try {
      const response = await axios.get(`http://localhost:8001/scrape?category=${cat}`);
      if (response.data.error) throw new Error(response.data.error);
      const html = response.data.html;
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
}

scrapeJiji().catch(console.error);
