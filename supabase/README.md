# Supabase Setup Guide

## 1. Database Tables

Run the SQL migration in Supabase SQL Editor:

```sql
-- Copy contents from: migrations/001_app_config.sql
```

This creates:
- `app_config` - Public settings (CA, social links)
- `app_secrets` - Private settings (API keys)

## 2. Update Config Values

After running the migration, update the values in Supabase:

### Public Config (app_config table):
| key | value | description |
|-----|-------|-------------|
| TOKEN_CA | Your actual token CA | Token Contract Address |
| TWITTER_URL | https://x.com/yourhandle | Twitter Profile |
| DISCORD_URL | https://discord.gg/invite | Discord Invite |
| TELEGRAM_URL | https://t.me/group | Telegram Group |

### Secrets (app_secrets table):
| key | value | description |
|-----|-------|-------------|
| OPENAI_API_KEY | sk-proj-xxx... | Your OpenAI API Key |

## 3. Deploy Edge Function

### Option A: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref lmdryqxbjzheczmwjnlb

# Deploy function
supabase functions deploy ai-analyze
```

### Option B: Dashboard
1. Go to Supabase Dashboard > Edge Functions
2. Create new function named `ai-analyze`
3. Copy contents from `functions/ai-analyze/index.ts`

## 4. Environment Variables

Your `.env.local` should only contain:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

All other secrets (OpenAI API key, etc.) are stored in Supabase.

## 5. Test

1. Start the app: `npm run dev`
2. Go to Dashboard - should see your CA and social links
3. Go to Smart Money - click AI Analysis - should work via edge function

## Security Notes

- `app_config` with `is_public=true` is readable by anyone
- `app_secrets` is only accessible by service role (edge functions)
- OpenAI API key never exposed to frontend
- CA and social links loaded dynamically from database
