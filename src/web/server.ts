import express from 'express';
import pool from '../config/db';

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './src/web/views');

// Home page with search and filters
app.get('/', async (req, res) => {
  const { q, category, fairness, sort } = req.query;

  let baseQuery = `
    SELECT item_name, price, currency, condition, location,
           contact_info, category, fairness_status, message_url
    FROM structured_marketplace
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  // Search term
  if (q && typeof q === 'string' && q.trim()) {
    baseQuery += ` AND (item_name ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
    params.push(`%${q.trim()}%`);
    paramIndex++;
  }

  // Category filter
  if (category && category !== 'all') {
    baseQuery += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  // Fairness filter
  if (fairness && fairness !== 'all') {
    baseQuery += ` AND fairness_status = $${paramIndex}`;
    params.push(fairness);
    paramIndex++;
  }

  // Sorting
  if (sort === 'price_asc') {
    baseQuery += ` ORDER BY price ASC NULLS LAST`;
  } else if (sort === 'price_desc') {
    baseQuery += ` ORDER BY price DESC NULLS LAST`;
  } else {
    baseQuery += ` ORDER BY id DESC`;   // fallback (always exists)
  }

  baseQuery += ` LIMIT 100`;

  const products = await pool.query(baseQuery, params);
  
  // Fetch distinct categories for filter dropdown
  const catRes = await pool.query(`SELECT DISTINCT category FROM structured_marketplace WHERE category IS NOT NULL ORDER BY category`);
  const categories = catRes.rows.map(r => r.category);

  res.render('index', {
    query: q || '',
    selectedCategory: category || 'all',
    selectedFairness: fairness || 'all',
    selectedSort: sort || 'recent',
    products: products.rows,
    categories: categories
  });
});

app.listen(port, () => {
  console.log(`✅ Web dashboard running at http://localhost:${port}`);
});