import express from 'express';
import pool from '../config/db';

const app = express();
const port = process.env.PORT || 3000;

// Debug endpoint to check database connection and count
app.get('/debug', async (req, res) => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM structured_marketplace');
    const sample = await pool.query('SELECT item_name, price FROM structured_marketplace LIMIT 5');
    res.json({
      count: countResult.rows[0].count,
      sample: sample.rows,
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
    });
  } catch (err) {
    // Handle unknown error type
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMessage });
  }
});

// Main page with search
app.get('/', async (req, res) => {
  const q = req.query.q;
  let html = `
    <!DOCTYPE html>
    <html>
    <head><title>FairFind</title></head>
    <body>
      <h1>🔍 FairFind</h1>
      <form method="GET">
        <input name="q" value="${q || ''}" placeholder="Search products..." style="width: 300px; padding: 8px;">
        <button type="submit">Search</button>
      </form>
      <hr>
  `;

  if (q) {
    try {
      const result = await pool.query(
        `SELECT item_name, price, category FROM structured_marketplace 
         WHERE item_name ILIKE $1 OR category ILIKE $1 
         LIMIT 20`,
        [`%${q}%`]
      );
      if (result.rows.length === 0) {
        html += `<p>No results for "${q}".</p>`;
      } else {
        html += `<ul>`;
        for (const row of result.rows) {
          html += `<li>${row.item_name || 'Unnamed'} – ${row.price || '?'} ETB (${row.category || 'uncategorized'})</li>`;
        }
        html += `</ul>`;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      html += `<p>❌ Error: ${errorMessage}</p>`;
    }
  } else {
    // Show a sample of products when no search
    try {
      const sample = await pool.query('SELECT item_name, price FROM structured_marketplace LIMIT 5');
      html += `<h2>Sample products:</h2><ul>`;
      for (const row of sample.rows) {
        html += `<li>${row.item_name || 'Unnamed'} – ${row.price || '?'} ETB</li>`;
      }
      html += `</ul>`;
      html += `<p>Try searching: <strong>serum</strong>, <strong>cleanser</strong>, <strong>Medicube</strong></p>`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      html += `<p>❌ Error loading sample: ${errorMessage}</p>`;
    }
  }

  html += `</body></html>`;
  res.send(html);
});

app.listen(port, () => {
  console.log(`✅ Web dashboard running at http://localhost:${port}`);
});