import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import pool from '../config/db';

// Helper function to introduce a delay, to be a good internet citizen.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeEngocha() {
    // We'll start with just the main classifieds page. You can expand this list later.
    const urls = ['https://engocha.com/classifieds']; 

    for (const url of urls) {
        console.log(`🌐 Scraping Engocha: ${url}`);
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            const ads: string[] = [];

            // Find all elements that look like a listing card. 
            // The HTML structure we looked at showed that each listing is wrapped in a <div class='classifieds' ...>
            $('.classifieds').each((_, element) => {
                // For each ad card, we extract the title, price, and a snippet of the description.
                const title = $(element).find('a.classifieds__title').text().trim();
                const price = $(element).find('.price').text().trim();
                const description = $(element).find('p').text().trim();
                const rawText = `${title} ${price} ${description}`;

                if (rawText.length > 20) {
                    ads.push(rawText);
                }
            });
            
            // Insert the captured ads into your database
            let inserted = 0;
            for (const adText of ads) {
                await pool.query(
                    `INSERT INTO raw_feeds (source, raw_text, captured_at, processed)
                     VALUES ($1, $2, NOW(), false)`,
                    [`engocha_et`, adText]
                );
                inserted++;
            }
            console.log(`✅ Inserted ${inserted} new raw messages from Engocha.`);
        } catch (error) {
            console.error(`❌ Error scraping Engocha: ${url}`, error);
        }
        await sleep(3000); // Add a 3-second pause between requests.
    }
}

scrapeEngocha().catch(console.error);