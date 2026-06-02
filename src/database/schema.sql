CREATE TABLE raw_feeds (
    id SERIAL PRIMARY KEY,
    source_platform VARCHAR(20) NOT NULL, -- 'telegram' or 'tiktok'
    channel_or_username VARCHAR(100) NOT NULL,
    raw_text TEXT NOT NULL,
    media_url TEXT,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE structured_marketplace (
    id SERIAL PRIMARY KEY,
    raw_feed_id INT REFERENCES raw_feeds(id) ON DELETE CASCADE,
    category VARCHAR(50),      -- e.g., 'ELECTRONICS', 'CLOTHING', 'REAL_ESTATE'
    item_name VARCHAR(150) NOT NULL,
    price_etb NUMERIC(12, 2),
    location VARCHAR(100),     -- e.g., 'Bole', 'Megenagna'
    contact_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);