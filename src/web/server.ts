import express from 'express';
import pool from '../config/db';

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './src/web/views');

app.get('/', async (req, res) => {
  const { q } = req.query;
  let products: any[] = [];
  let query = (q as string) || '';

  if (query.trim()) {
    const result = await pool.query(
      `SELECT item_name, price, currency, condition, location, contact_info, category, fairness_status, message_url
       FROM structured_marketplace
       WHERE item_name ILIKE $1 OR category ILIKE $1
       ORDER BY id DESC
       LIMIT 50`,
      [`%${query.trim()}%`]
    );
    products = result.rows;
  }

  res.render('index', { query, products });
});

app.listen(port, () => {
  console.log(`✅ Web dashboard running at http://localhost:${port}`);
});