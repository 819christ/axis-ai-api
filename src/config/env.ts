import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  supabaseUrl: process.env.SUPABASE_URL || 'https://oahduqmmqiwdldsqmzhv.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  cronSecretToken: process.env.CRON_SECRET_TOKEN || 'axis_cron_secret_key_change_me_987654',
  defaultMaxOutputTokens: parseInt(process.env.DEFAULT_MAX_OUTPUT_TOKENS || '1024', 10),
  proxyTimeoutMs: parseInt(process.env.PROXY_TIMEOUT_MS || '60000', 10),
};
