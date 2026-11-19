-- ============================================================================
-- 06_vector.sql: pgvector Extension and Embedding Tables for Semantic Search
-- PRD Section 7.3 & 8.1
-- ============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop existing vector tables if needed
DROP TABLE IF EXISTS review_embedding CASCADE;
DROP TABLE IF EXISTS spec_embedding CASCADE;

-- 3. Spec Sheets Embedding Table
-- Stores 384-dimensional dense vectors corresponding to individual spec chunks
-- (display, camera, thermal, battery, chipset, overall)
CREATE TABLE spec_embedding (
    embedding_id SERIAL PRIMARY KEY,
    spec_id INT NOT NULL REFERENCES spec_sheet(spec_id) ON DELETE CASCADE,
    chunk_category VARCHAR(50) NOT NULL, -- e.g. 'display', 'camera', 'thermal', 'battery', 'chipset', 'general'
    chunk_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    metadata JSONB,                      -- e.g. {"product_id": 1, "model_name": "iPhone 15 Pro", "brand": "Apple"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Review Embedding Table
-- Stores 384-dimensional dense vectors for natural language retailer feedback
CREATE TABLE review_embedding (
    review_id INT PRIMARY KEY REFERENCES review(review_id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    region VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. HNSW (Hierarchical Navigable Small World) Vector Indexes
-- Uses cosine distance metric (vector_cosine_ops) for fast, scalable similarity search
CREATE INDEX IF NOT EXISTS idx_spec_embedding_hnsw 
    ON spec_embedding USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_review_embedding_hnsw 
    ON review_embedding USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 6. Auxiliary B-Tree Indexes for fast joining and filtering
CREATE INDEX IF NOT EXISTS idx_spec_embedding_spec_id 
    ON spec_embedding(spec_id);

CREATE INDEX IF NOT EXISTS idx_review_embedding_region 
    ON review_embedding(region);
