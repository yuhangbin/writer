-- Writer AI Database Schema
-- PostgreSQL Schema for Writer Application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Workspaces Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    target_reader TEXT,
    reference_example TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,

    -- Indexes
    CONSTRAINT workspace_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Index for faster workspace lookups
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at DESC);

-- ============================================================================
-- Articles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    prompt TEXT,
    word_count INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,

    -- Foreign key
    CONSTRAINT fk_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT article_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT word_count_not_negative CHECK (word_count >= 0)
);

-- Indexes for faster article lookups
CREATE INDEX idx_articles_workspace_id ON articles(workspace_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- ============================================================================
-- App Settings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    selected_model_id VARCHAR(100) NOT NULL DEFAULT 'gpt-4',
    provider_configs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Default settings row (single row application)
INSERT INTO app_settings (id, selected_model_id, provider_configs, created_at, updated_at)
VALUES (uuid_generate_v4(), 'gpt-4', '{}'::jsonb, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AI Models Reference Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_models (
    id VARCHAR(50) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_tokens INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,

    CONSTRAINT provider_valid CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'kimi'))
);

-- Insert default AI models
INSERT INTO ai_models (id, provider, name, description, max_tokens, created_at, updated_at) VALUES
    ('gpt-4', 'openai', 'GPT-4', 'OpenAI''s most capable model', 8192, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
    ('gpt-4-turbo', 'openai', 'GPT-4 Turbo', 'Faster and cheaper GPT-4', 128000, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
    ('gpt-3.5-turbo', 'openai', 'GPT-3.5 Turbo', 'Fast and cost-effective', 16385, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
    ('claude-3-opus', 'anthropic', 'Claude 3 Opus', 'Most powerful Claude model', 200000, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
    ('claude-3-5-sonnet', 'anthropic', 'Claude 3.5 Sonnet', 'Balanced performance and speed', 200000, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
    ('claude-3-haiku', 'anthropic', 'Claude 3 Haiku', 'Fastest Claude model', 200000, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
    ('gemini-pro', 'google', 'Gemini Pro', 'Google''s capable model', 91728, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Triggers for automatic timestamp updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = EXTRACT(EPOCH FROM NOW()) * 1000;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE workspaces IS 'User workspaces for organizing writing context';
COMMENT ON TABLE articles IS 'Generated articles linked to workspaces';
COMMENT ON TABLE app_settings IS 'Application-wide settings (single row)';
COMMENT ON TABLE ai_models IS 'Reference table of available AI models';

COMMENT ON COLUMN workspaces.target_reader IS 'Target audience for writing in this workspace';
COMMENT ON COLUMN workspaces.reference_example IS 'Example text for style reference';
COMMENT ON COLUMN articles.prompt IS 'The AI prompt used to generate this article';
COMMENT ON COLUMN articles.word_count IS 'Estimated word count of the article content';
