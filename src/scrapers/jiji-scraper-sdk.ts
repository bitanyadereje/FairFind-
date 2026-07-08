import * as cheerio from 'cheerio';
import pool from '../config/db';

// Use ScraperAPI SDK (install with: npm install scraperapi-sdk)
const scraperapiClient = require('scraperapi-sdk')('Y1dc8365d20d1d84be5b4317ca9991252'); // ⚠️ Replace with your actual key

const CATEGORIES = ['phones', 'electronics', 'clothing', 'cars'];

// Helper to wait between requests (avoid rate limits)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJijiPage(category: string): Promise<string> {
    const url = `https://jiji.et/${category}`;
    console.log(`🌐 Fetching ${url} via ScraperAPI...`);

    // Option 1: Simple fetch (no JS rendering)
    // const html = await scraperapiClient.get(url);

    // Option 2: Enable JavaScript rendering (use if listings are loaded dynamically)
    const html = await scraperapiClient.get(url, { render: true });

    // Debug: log first 500 chars to see if we got a captcha or error page
    console.log(`📄 Received ${html.length} chars, preview: ${html.substring(0, 500)}`);

    if (html.includes('captcha') || html.includes('access denied') || html.includes('Cloudflare')) {
        throw new Error('Blocked or CAPTCHA page returned');
    }
    return html;
}

async function scrapeJiji() {
    for (const cat of CATEGORIES) {
        try {
            const html = await fetchJijiPage(cat);
            const $ = cheerio.load(html);
            const listings: string[] = [];

            // Try different possible selectors (Jiji often changes class names)
            // Priority: data-testid, then known classes
            const selectors = [
                '[data-testid="advert-card"]',
                '[data-testid="listing"]',
                '.b-list-advert-item',
                '.b-advert-card',
                '.offers-list .item',
                '.serp-item'
            ];

            let found = false;
            for (const selector of selectors) {
                const elements = $(selector);
                if (elements.length > 0) {
                    console.log(`✅ Using selector: ${selector} (found ${elements.length} elements)`);
                    elements.each((_, el) => {
                        const title = $(el).find('.advert-title, [data-testid="advert-title"], .title').first().text().trim();
                        const price = $(el).find('.price, [data-testid="advert-price"]').first().text().trim();
                        const desc = $(el).find('.description, [data-testid="advert-description"]').first().text().trim();
                        const rawText = `${title} ${price} ${desc}`;
                        if (rawText.length > 20) listings.push(rawText);
                    });
                    found = true;
                    break;
                }
            }

            if (!found) {
                console.warn(`⚠️ No listings found for ${cat}. Check HTML structure manually.`);
                // Optionally save the HTML for manual inspection
                // fs.writeFileSync(`debug_${cat}.html`, html);
                continue;
            }

            for (const text of listings) {
                await pool.query(
                    `INSERT INTO raw_feeds (source, raw_text, captured_at, processed)
                     VALUES ($1, $2, NOW(), false)`,
                    [`jiji_et_${cat}`, text]
                );
            }
            console.log(`✅ ${cat}: inserted ${listings.length} messages`);
        } catch (err: any) {
            console.error(`❌ Error processing ${cat}:`, err.message);
        }
        await sleep(3000); // Be polite, 3s delay between categories
    }
}

scrapeJiji().catch(console.error);