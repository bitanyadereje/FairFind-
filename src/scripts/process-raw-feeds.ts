import pool from '../config/db';
import { extractProductFromText } from '../services/groq.services';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getFairnessAssessment(itemName: string | null, category: string | null, price: number): Promise<string> {
  if (!itemName && !category) return 'unknown';
  
  const query = `
    SELECT price FROM price_history 
    WHERE (item_name ILIKE $1 OR category = $2)
      AND captured_at > NOW() - INTERVAL '30 days'
      AND price IS NOT NULL
  `;
  const values = [itemName ? `%${itemName}%` : '%', category];
  const { rows } = await pool.query(query, values);
  
  if (rows.length < 3) return 'insufficient_data';
  
  const prices = rows.map(r => r.price);
  const avg = prices.reduce((a,b) => a + b, 0) / prices.length;
  const stdDev = Math.sqrt(prices.map(p => Math.pow(p - avg, 2)).reduce((a,b) => a + b, 0) / prices.length);
  
  if (price > avg + 2 * stdDev) return 'extreme_overpriced';
  if (price > avg + stdDev) return 'overpriced';
  if (price < avg - stdDev) return 'underpriced_good_deal';
  return 'fair';
}

async function processUnprocessed() {
  const { rows } = await pool.query(
    "SELECT id, raw_text FROM raw_feeds WHERE processed = false ORDER BY id LIMIT 2"
  );
  
  if (rows.length === 0) {
    console.log('No unprocessed feeds.');
    process.exit(0);
    return;
  }
  
  for (const feed of rows) {
    console.log(`\nProcessing feed ${feed.id}...`);
    try {
      const extracted = await extractProductFromText(feed.raw_text);
      console.log('Extracted:', extracted);
      
      // Calculate fairness
      let fairness = 'unknown';
      if (extracted.price) {
        fairness = await getFairnessAssessment(extracted.item_name, extracted.category, extracted.price);
        console.log(`Fairness: ${fairness}`);
      }
      
      // Insert into structured_marketplace
      await pool.query(
        `INSERT INTO structured_marketplace 
         (raw_feed_id, item_name, price, currency, condition, location, contact_info, category, fairness_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [feed.id, extracted.item_name, extracted.price, extracted.currency || 'ETB',
         extracted.condition, extracted.location, extracted.contact_info, extracted.category, fairness]
      );
      
      // Insert into price_history for future comparisons
      await pool.query(
        `INSERT INTO price_history (item_name, category, price, currency, source_feed_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [extracted.item_name, extracted.category, extracted.price, extracted.currency || 'ETB', feed.id]
      );
      
      // Mark raw feed as processed
      await pool.query("UPDATE raw_feeds SET processed = true WHERE id = $1", [feed.id]);
      console.log(`✅ Saved: ${extracted.item_name} – ${extracted.price} ETB (${fairness})`);
      
      await sleep(6000); // respect rate limits
    } catch (err) {
      console.error(`❌ Failed feed ${feed.id}:`, err);
    }
  }
  console.log('\nDone. Run again to process next batch.');
  process.exit(0);
}

processUnprocessed();