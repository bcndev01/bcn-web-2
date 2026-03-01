-- =============================================
-- BeaconAI App Configuration Tables
-- Run this in Supabase SQL Editor
-- =============================================

-- App Config Table (Public settings like CA, socials)
CREATE TABLE IF NOT EXISTS app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Public config: Anyone can read public items
CREATE POLICY "Public config readable by all" ON app_config
    FOR SELECT USING (is_public = true);

-- =============================================
-- Insert Default Config Values
-- =============================================

-- Token CA Address
INSERT INTO app_config (key, value, description, is_public) VALUES
    ('TOKEN_CA', 'YOUR_TOKEN_CA_HERE', 'Token Contract Address', true)
ON CONFLICT (key) DO NOTHING;

-- Social Links
INSERT INTO app_config (key, value, description, is_public) VALUES
    ('TWITTER_URL', 'https://x.com/YOUR_HANDLE', 'Twitter/X Profile URL', true),
    ('DISCORD_URL', 'https://discord.gg/YOUR_INVITE', 'Discord Invite URL', true),
    ('TELEGRAM_URL', 'https://t.me/YOUR_GROUP', 'Telegram Group URL', true)
ON CONFLICT (key) DO NOTHING;

-- App Settings
INSERT INTO app_config (key, value, description, is_public) VALUES
    ('APP_NAME', 'BeaconAI', 'Application Name', true),
    ('APP_VERSION', '1.0.0', 'Application Version', true)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- Helper Function: Get Config
-- =============================================

CREATE OR REPLACE FUNCTION get_public_config()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_object_agg(key, value)
        FROM app_config
        WHERE is_public = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Updated At Trigger
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_config_updated_at
    BEFORE UPDATE ON app_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
