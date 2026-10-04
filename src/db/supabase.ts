import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { config } from '../config/env.js';

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  console.warn('[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined.');
}

export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Calcule l'empreinte cryptographique SHA-256 de la clé API
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
}

export interface GatekeeperValidationResult {
  is_allowed: boolean;
  http_status: number;
  error_code?: string;
  error_message?: string;
  is_free?: boolean;
  api_key_id?: string;
  subscription_id?: string;
  tier_number?: number;
  model_id?: string;
  power_level?: string;
  current_balance_usd?: number;
  estimated_cost_usd?: number;
  fallback_model_id?: string | null;
  details?: string;
}

export interface SettlementResult {
  success: boolean;
  cost_usd?: number;
  is_free?: boolean;
  new_balance_usd?: number;
  total_tokens?: number;
  error?: string;
}

export interface SubscribeResult {
  success: boolean;
  http_status: number;
  action?: 'ACTIVATED_IMMEDIATE' | 'QUEUED_PENDING_J7';
  subscription_id?: string;
  tier_number?: number;
  tier_name?: string;
  balance_usd?: number;
  starts_at?: string;
  expires_at?: string;
  message?: string;
  error_code?: string;
  error_message?: string;
}

/**
 * Procédure RPC de souscription avec respect de la règle anti-abus des 7 jours
 */
export async function subscribeUser(userId: string, tierNumber: number): Promise<SubscribeResult> {
  const { data, error } = await supabase.rpc('axis_subscribe', {
    p_user_id: userId,
    p_tier_number: tierNumber,
  });

  if (error) {
    console.error('[Subscribe RPC Error]', error);
    return {
      success: false,
      http_status: 500,
      error_code: 'SUBSCRIBE_DB_ERROR',
      error_message: error.message,
    };
  }

  return data as SubscribeResult;
}

/**
 * Procédure RPC synchrone de contrôle Gatekeeper (Vérification atomique temps, solde, et palier)
 */
export async function validateWithGatekeeper(
  keyHash: string,
  modelId: string,
  inputTokens: number,
  maxOutputTokens: number
): Promise<GatekeeperValidationResult> {
  const { data, error } = await supabase.rpc('axis_gatekeeper_validate', {
    p_key_hash: keyHash,
    p_model_id: modelId,
    p_input_tokens: inputTokens,
    p_max_output_tokens: maxOutputTokens,
  });

  if (error) {
    console.error('[Gatekeeper RPC Error]', error);
    return {
      is_allowed: false,
      http_status: 500,
      error_code: 'GATEKEEPER_DB_ERROR',
      error_message: `Erreur de validation de la base de données: ${error.message}`,
    };
  }

  return data as GatekeeperValidationResult;
}

/**
 * Procédure RPC de décompte réel (Settlement) atomique
 */
export async function settleUsage(params: {
  keyHash: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  statusCode: number;
  errorMessage?: string | null;
}): Promise<SettlementResult> {
  const { data, error } = await supabase.rpc('axis_settle_usage', {
    p_key_hash: params.keyHash,
    p_model_id: params.modelId,
    p_input_tokens: params.inputTokens,
    p_output_tokens: params.outputTokens,
    p_duration_ms: params.durationMs,
    p_status_code: params.statusCode,
    p_error_message: params.errorMessage || null,
  });

  if (error) {
    console.error('[Settlement RPC Error]', error);
    return { success: false, error: error.message };
  }

  return data as SettlementResult;
}
