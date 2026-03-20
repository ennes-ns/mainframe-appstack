-- CLEAN RESET: Drop existing tables if they exist
DROP TRIGGER IF EXISTS update_characters_modtime ON characters;
DROP TABLE IF EXISTS document_embeddings;
DROP TABLE IF EXISTS features;
DROP TABLE IF EXISTS characters;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Characters Table
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    owner_id UUID, -- For future Auth integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Basic Policy: Allow service role (backend) total access.
-- This ensures the Go backend can still manage data.
CREATE POLICY "Allow full access to service_role" ON characters
    FOR ALL TO service_role USING (true);

-- Features & Traits Table (for easier searching)
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    source TEXT -- e.g. "Race", "Class", "Feat"
);

-- Vectorized Documents Table
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536), -- Assuming OpenAI embeddings (1536 dimensions)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_modtime
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
