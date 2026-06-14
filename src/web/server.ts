import express from 'express';
import pool from '../config/db';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const q = req.query.q;
  let html = '<h1>FairFind Debug</h1><form method="GET"><input name="q" value="' + (q || '') + '"><button>Search</button></form>';
  if (q) {
    try {
      const result = await pool.query('SELECT item_name, price FROM structured_marketplace WHERE item_name ILIKE $1 LIMIT 20', [`%${q}%`]);
      html += '<ul>' + result.rows.map(r => `<li>${r.item_name} – ${r.price} ETB</li>`).join('') + '</ul>';
    } catch (err) {
      html += '<p>Error: ' + err.message + '</p>';
    }
  } else {
    // Show sample data when no search
    const sample = await pool.query('SELECT item_name, price FROM structured_marketplace LIMIT 5');
    html += '<h2>Sample products:</h2><ul>' + sample.rows.map(r => `<li>${r.item_name} – ${r.price} ETB</li>`).join('') + '</ul>';
  }
  res.send(html);
});

app.get('/debug', async (req, res) => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM structured_marketplace');
    res.json({ count: countResult.rows[0].count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`✅ Debug server on port ${port}`));