/**
 * Module Axis Auto - Routeur Intelligent d'Amont
 * Analyse d'intention, heuristiques de complexité, routage par tier et gestion de secours
 */

export type ModelTier = 'free' | 'economy' | 'performance';

export interface RouteResolution {
  targetModel: string;
  originalRequestedModel: string;
  tier: ModelTier;
  isVirtualRoute: boolean;
  routingReason: string;
  fallbackChain: string[];
}

// Modèles par défaut par tier
export const TIER_DEFAULT_MODELS: Record<ModelTier, string> = {
  free: 'meta-llama/llama-3.3-70b-instruct:free',
  economy: 'openai/gpt-4o-mini',
  performance: 'anthropic/claude-3.5-sonnet',
};

// Chaînes de secours (Fallback chains) par modèle
export const FALLBACK_CHAINS: Record<string, string[]> = {
  // Free pool
  'meta-llama/llama-3.3-70b-instruct:free': [
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
  ],
  'google/gemini-2.0-flash-exp:free': [
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
  ],
  'mistralai/mistral-7b-instruct:free': [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
  ],

  // Economy pool
  'openai/gpt-4o-mini': [
    'google/gemini-2.0-flash-001',
    'deepseek/deepseek-chat',
    'anthropic/claude-3-haiku',
  ],
  'google/gemini-2.0-flash-001': [
    'openai/gpt-4o-mini',
    'deepseek/deepseek-chat',
  ],
  'deepseek/deepseek-chat': [
    'openai/gpt-4o-mini',
    'google/gemini-2.0-flash-001',
  ],

  // Performance pool
  'anthropic/claude-3.5-sonnet': [
    'openai/gpt-4o',
    'deepseek/deepseek-r1',
    'openai/o1-mini',
  ],
  'openai/gpt-4o': [
    'anthropic/claude-3.5-sonnet',
    'deepseek/deepseek-r1',
  ],
  'deepseek/deepseek-r1': [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
  ],
};

// Mots-clés indiquant un besoin de fort raisonnement (performance)
const REASONING_KEYWORDS = [
  'analyse approfondie',
  'analyse détaillée',
  'démontre',
  'démontrer',
  'preuve mathématique',
  'architecture logicielle',
  'refactor',
  'optimise cet algorithme',
  'step by step',
  'think step by step',
  'critique constructive',
  'solve this theorem',
  'analyse ce bug complexe',
  'security audit',
  'concurrency',
  'distributed system',
];

/**
 * Estimation rapide du nombre de tokens (entrée et sortie)
 */
export function estimateTokens(messages: any[] = []): number {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 10;
  }

  let totalChars = 0;
  for (const msg of messages) {
    totalChars += 10; // Message framing overhead
    if (typeof msg.content === 'string') {
      totalChars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part && typeof part.text === 'string') {
          totalChars += part.text.length;
        }
      }
    }
  }

  // Moyenne de ~3.8 caractères par token pour les textes multilingues/code
  return Math.max(1, Math.ceil(totalChars / 3.8));
}

/**
 * Évalue le prompt pour déterminer si la tâche nécessite un modèle économique ou performant
 */
export function evaluateIntent(
  messages: any[] = [],
  tools?: any[]
): { tier: ModelTier; reason: string } {
  // 1. Si des outils (Function Calling) sont définis, privilégier la performance
  if (Array.isArray(tools) && tools.length > 0) {
    return {
      tier: 'performance',
      reason: 'Détection de function calling (outils définis) nécessitant une conformité stricte au schéma JSON.',
    };
  }

  // 2. Concaténation des derniers messages pour analyse
  let textSample = '';
  const lastMessages = messages.slice(-3);
  for (const m of lastMessages) {
    if (typeof m.content === 'string') {
      textSample += ' ' + m.content;
    }
  }
  const lowerText = textSample.toLowerCase();

  // 3. Détection de mots-clés de raisonnement
  for (const kw of REASONING_KEYWORDS) {
    if (lowerText.includes(kw)) {
      return {
        tier: 'performance',
        reason: `Détection d'un besoin de raisonnement complexe (mot-clé: "${kw}").`,
      };
    }
  }

  // 4. Détection de code volumineux (blocs ```)
  const codeBlocksCount = (textSample.match(/```/g) || []).length / 2;
  if (codeBlocksCount >= 2 || (codeBlocksCount >= 1 && textSample.length > 1500)) {
    return {
      tier: 'performance',
      reason: 'Détection de blocs de code substantiels nécessitant des capacités avancées d\'ingénierie logicielle.',
    };
  }

  // 5. Analyse de la longueur du contexte
  const estimatedInputTokens = estimateTokens(messages);
  if (estimatedInputTokens > 3500) {
    return {
      tier: 'performance',
      reason: `Contexte volumineux (${estimatedInputTokens} tokens) nécessitant un modèle à grande fenêtre d'attention et haute fidélité.`,
    };
  }

  // Par défaut : tier économique ultra-rapide
  return {
    tier: 'economy',
    reason: 'Requête standard orientée vitesse et économie de coûts.',
  };
}

/**
 * Résolution du modèle cible via le routeur Axis Auto
 */
export function resolveTargetModel(
  requestedModel: string,
  messages: any[] = [],
  tools?: any[]
): RouteResolution {
  const normModel = (requestedModel || 'axis-auto').trim().toLowerCase();

  // Route virtuelle Axis Auto (dispatching intelligent)
  if (normModel === 'axis-auto' || normModel === 'auto') {
    const intent = evaluateIntent(messages, tools);
    const targetModel = TIER_DEFAULT_MODELS[intent.tier];
    return {
      targetModel,
      originalRequestedModel: requestedModel,
      tier: intent.tier,
      isVirtualRoute: true,
      routingReason: `[Axis Auto] ${intent.reason}`,
      fallbackChain: FALLBACK_CHAINS[targetModel] || [],
    };
  }

  // Route virtuelle Axis Free
  if (normModel === 'axis-free') {
    const targetModel = TIER_DEFAULT_MODELS.free;
    return {
      targetModel,
      originalRequestedModel: requestedModel,
      tier: 'free',
      isVirtualRoute: true,
      routingReason: '[Axis Free] Sélection directe du pool gratuit sans impact budgétaire.',
      fallbackChain: FALLBACK_CHAINS[targetModel] || [],
    };
  }

  // Route virtuelle Axis Economy
  if (normModel === 'axis-economy') {
    const targetModel = TIER_DEFAULT_MODELS.economy;
    return {
      targetModel,
      originalRequestedModel: requestedModel,
      tier: 'economy',
      isVirtualRoute: true,
      routingReason: '[Axis Economy] Sélection forcée du pool économique rapide.',
      fallbackChain: FALLBACK_CHAINS[targetModel] || [],
    };
  }

  // Route virtuelle Axis Performance
  if (normModel === 'axis-performance') {
    const targetModel = TIER_DEFAULT_MODELS.performance;
    return {
      targetModel,
      originalRequestedModel: requestedModel,
      tier: 'performance',
      isVirtualRoute: true,
      routingReason: '[Axis Performance] Sélection forcée du pool haute performance & raisonnement.',
      fallbackChain: FALLBACK_CHAINS[targetModel] || [],
    };
  }

  // Modèle spécifique explicitement demandé par le client (ex: 'anthropic/claude-3.5-sonnet')
  const isFree = normModel.includes(':free');
  const tier: ModelTier = isFree ? 'free' : 'performance';
  const fallbackList = FALLBACK_CHAINS[requestedModel] || [];

  return {
    targetModel: requestedModel,
    originalRequestedModel: requestedModel,
    tier,
    isVirtualRoute: false,
    routingReason: `Modèle explicite demandé par le client (${requestedModel}).`,
    fallbackChain: fallbackList,
  };
}
