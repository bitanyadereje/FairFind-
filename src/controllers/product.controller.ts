import { Request, Response } from 'express';
import pool from '../config/db';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;

    let sql = `
      SELECT id, item_name, price, currency, condition, location,
             contact_info, category, fairness_status, message_url
      FROM structured_marketplace
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (q) {
      sql += ` AND (item_name ILIKE $${idx} OR category ILIKE $${idx})`;
      params.push(`%${q}%`);
      idx++;
    }
    if (category) {
      sql += ` AND category = $${idx}`;
      params.push(category);
      idx++;
    }
    if (minPrice) {
      sql += ` AND price >= $${idx}`;
      params.push(parseFloat(minPrice as string));
      idx++;
    }
    if (maxPrice) {
      sql += ` AND price <= $${idx}`;
      params.push(parseFloat(maxPrice as string));
      idx++;
    }

    sql += ' ORDER BY id DESC LIMIT 50';

    const result = await pool.query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    // ✅ Get the id parameter and ensure it's a string
    const idParam = req.params.id;
    
    // ✅ If it's an array, take the first element
    const idString = Array.isArray(idParam) ? idParam[0] : idParam;
    
    if (!idString) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const productId = parseInt(idString, 10);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const result = await pool.query(
      `SELECT id, item_name, price, currency, condition, location,
              contact_info, category, fairness_status, message_url
       FROM structured_marketplace
       WHERE id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};