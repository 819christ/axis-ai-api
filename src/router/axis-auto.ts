/**
 * Module Axis Auto - Routage Intelligent en 2 étapes
 * 4 Niveaux de puissance : 'low', 'medium', 'high', 'ultra'
 * Filtrage par formule mathématique de palier : MaxAllowedCost(P_i) = alpha * i + beta
 */

export type PowerLevel = 'low' | 'medium' | 'high' | 'ultra';

export interface ModelMetadata {
  id: string;
  name: string;
  powerLevel: PowerLevel;
  combinedCostPerMillion: number;
  inputCostPerToken: number;
  outputCostPerToken: number;
  isFree: boolean;
  fallbackModelId?: string;
}

export const KNOWN_MODELS: Record<string, ModelMetadata> = {
  // LOW
  'meta-llama/llama-3.3-70b-instruct:free': {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Free',
    powerLevel: 'low',
    combinedCostPerMillion: 0.0,
    inputCostPerToken: 0.0,
    outputCostPerToken: 0.0,
    isFree: true,
  },
  'google/gemini-2.0-flash-exp:free': {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp Free',
    powerLevel: 'low',
    combinedCostPerMillion: 0.0,
    inputCostPerToken: 0.0,
    outputCostPerToken: 0.0,
    isFree: true,
  },
  'google/gemini-2.0-flash-001': {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    powerLevel: 'low',
    combinedCostPerMillion: 0.50,
    inputCostPerToken: 0.00000010,
    outputCostPerToken: 0.00000040,
    isFree: false,
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    powerLevel: 'low',
    combinedCostPerMillion: 0.75,
    inputCostPerToken: 0.00000015,
    outputCostPerToken: 0.00000060,
    isFree: false,
  },

  // MEDIUM
  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 Chat',
    powerLevel: 'medium',
    combinedCostPerMillion: 0.42,
    inputCostPerToken: 0.00000014,
    outputCostPerToken: 0.00000028,
    isFree: false,
  },
  'mistralai/mistral-small': {
    id: 'mistralai/mistral-small',
    name: 'Mistral Small',
    powerLevel: 'medium',
    combinedCostPerMillion: 0.80,
    inputCostPerToken: 0.00000020,
    outputCostPerToken: 0.00000060,
    isFree: false,
  },
  'anthropic/claude-3-haiku': {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    powerLevel: 'medium',
    combinedCostPerMillion: 1.50,
    inputCostPerToken: 0.00000025,
    outputCostPerToken: 0.00000125,
    isFree: false,
  },

  // HIGH
  'qwen/qwen-2.5-coder-32b-instruct': {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    powerLevel: 'high',
    combinedCostPerMillion: 0.23,
    inputCostPerToken: 0.00000007,
    outputCostPerToken: 0.00000016,
    isFree: false,
  },
  'google/gemini-pro-1.5': {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    powerLevel: 'high',
    combinedCostPerMillion: 6.25,
    inputCostPerToken: 0.00000125,
    outputCostPerToken: 0.00000500,
    isFree: false,
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    powerLevel: 'high',
    combinedCostPerMillion: 12.50,
    inputCostPerToken: 0.00000250,
    outputCostPerToken: 0.00001000,
    isFree: false,
  },

  // ULTRA
  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 Reasoning',
    powerLevel: 'ultra',
    combinedCostPerMillion: 2.74,
    inputCostPerToken: 0.00000055,
    outputCostPerToken: 0.00000219,
    isFree: false,
  },
  'openai/o1-mini': {
    id: 'openai/o1-mini',
    name: 'OpenAI o1 Mini',
    powerLevel: 'ultra',
    combinedCostPerMillion: 15.00,
    inputCostPerToken: 0.00000300,
    outputCostPerToken: 0.00001200,
    isFree: false,
  },
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    powerLevel: 'ultra',
    combinedCostPerMillion: 18.00,
    inputCostPerToken: 0.00000300,
    outputCostPerToken: 0.00001500,
    isFree: false,
  },
};

/**
 * Calcule le coût combiné maximum autorisé pour un palier donné
 * Formule : MaxAllowedCost(P_i) = alpha * i + beta
 */
export function calculateMaxAllowedCost(tierNumber: number, alpha = 5.0, beta = 0.0): number {
  return alpha * tierNumber + beta;
}

/**
 * Estimation rapide du nombre de tokens
 */
export function estimateTokens(messages: any[] = []): number {
  if (!Array.isArray(messages) || messages.length === 0) return 10;
  let totalChars = 0;
  for (const msg of messages) {
    totalChars += 10;
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
  return Math.max(1, Math.ceil(totalChars / 3.8));
}

// Mots-clés pour la détection d'effort
const ULTRA_KEYWORDS = [
  'preuve mathématique',
  'démontre',
  'théorème',
  'raisonnement approfondi',
  'analyse formelle',
  'concurrency bug',
  'distributed consensus',
  'step by step logical deduction',
  'formal verification',
];

const HIGH_KEYWORDS = [
  'architecture logicielle',
  'refactor',
  'code review',
  'algorithme',
  'optimise la complexité',
  'sql query optimization',
  'conception api',
  'analyse comparative détaillée',
];

const MEDIUM_KEYWORDS = [
  'résume',
  'explique',
  'compare',
  'traduis',
  'rédige un email',
  'corrige l orthographe',
  'liste les avantages',
];

/**
 * ÉTAPE 1 (DÉCISION) DU MODE AXIS AUTO :
 * Analyse ultra-rapide de l'intention pour classer la requête dans l'un des 4 niveaux :
 * 'low' | 'medium' | 'high' | 'ultra'
 */
export function decidePowerLevel(
  messages: any[] = [],
  tools?: any[]
): { powerLevel: PowerLevel; decisionReason: string } {
  // Si des outils (Function Calling) sont définis -> au minimum High
  if (Array.isArray(tools) && tools.length > 0) {
    return {
      powerLevel: 'high',
      decisionReason: 'Appel d\'outils (Function Calling) détecté : niveau High requis pour garantir la conformité JSON.',
    };
  }

  let textSample = '';
  const lastMessages = messages.slice(-3);
  for (const m of lastMessages) {
    if (typeof m.content === 'string') {
      textSample += ' ' + m.content;
    }
  }
  const lower = textSample.toLowerCase();

  // 1. Détection Ultra (Raisonnement lourd)
  for (const kw of ULTRA_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        powerLevel: 'ultra',
        decisionReason: `Besoin de fort raisonnement détecté (mot-clé: "${kw}").`,
      };
    }
  }

  // 2. Détection High (Code / Ingénierie)
  const codeCount = (textSample.match(/```/g) || []).length / 2;
  if (codeCount >= 1 || textSample.length > 3000) {
    return {
      powerLevel: 'high',
      decisionReason: 'Contenu technique avec code ou prompt volumineux : niveau High requis.',
    };
  }
  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        powerLevel: 'high',
        decisionReason: `Tâche d'ingénierie/analyse avancée (mot-clé: "${kw}").`,
      };
    }
  }

  // 3. Détection Medium
  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        powerLevel: 'medium',
        decisionReason: `Tâche standard de synthèse ou rédaction (mot-clé: "${kw}").`,
      };
    }
  }

  if (estimateTokens(messages) > 800) {
    return {
      powerLevel: 'medium',
      decisionReason: 'Longueur modérée du contexte : niveau Medium.',
    };
  }

  // 4. Par défaut : Low (Ultra-rapide et économique)
  return {
    powerLevel: 'low',
    decisionReason: 'Requête simple et concise : niveau Low ultra-rapide.',
  };
}

/**
 * ÉTAPE 2 (EXÉCUTION) DU MODE AXIS AUTO :
 * Sélectionne le meilleur modèle disponible correspondant au niveau de puissance
 * ET respectant le plafond de coût du palier de l'utilisateur MaxAllowedCost(P_i).
 */
export function selectBestModelForTier(
  powerLevel: PowerLevel,
  tierNumber: number,
  alpha = 5.0,
  beta = 0.0
): { selectedModel: ModelMetadata; downgraded: boolean; originalLevel: PowerLevel } {
  const maxAllowedCost = calculateMaxAllowedCost(tierNumber, alpha, beta);

  // Hiérarchie de puissance descendante si le palier ne permet pas le niveau souhaité
  const powerLevelsPriority: PowerLevel[] =
    powerLevel === 'ultra' ? ['ultra', 'high', 'medium', 'low'] :
    powerLevel === 'high' ? ['high', 'medium', 'low'] :
    powerLevel === 'medium' ? ['medium', 'low'] : ['low'];

  for (const lvl of powerLevelsPriority) {
    const candidates = Object.values(KNOWN_MODELS)
      .filter((m) => m.powerLevel === lvl && m.combinedCostPerMillion <= maxAllowedCost)
      // Trier par qualité / coût combiné descendant (le plus performant sous le plafond)
      .sort((a, b) => b.combinedCostPerMillion - a.combinedCostPerMillion);

    if (candidates.length > 0) {
      return {
        selectedModel: candidates[0],
        downgraded: lvl !== powerLevel,
        originalLevel: powerLevel,
      };
    }
  }

  // Fallback ultime : modèle gratuit garanti
  return {
    selectedModel: KNOWN_MODELS['meta-llama/llama-3.3-70b-instruct:free'],
    downgraded: true,
    originalLevel: powerLevel,
  };
}

export interface RouteResolution {
  targetModel: string;
  originalRequestedModel: string;
  powerLevel: PowerLevel;
  isVirtualRoute: boolean;
  routingReason: string;
  fallbackChain: string[];
}

/**
 * Routeur Axis Auto complet intégrant les 2 étapes
 */
export function resolveAxisRoute(
  requestedModel: string,
  messages: any[] = [],
  tierNumber = 1,
  tools?: any[]
): RouteResolution {
  const norm = (requestedModel || 'axis-auto').trim().toLowerCase();

  // Mode Axis Auto en 2 étapes
  if (norm === 'axis-auto' || norm === 'auto') {
    // Étape 1 : Décision
    const decision = decidePowerLevel(messages, tools);
    // Étape 2 : Exécution
    const selection = selectBestModelForTier(decision.powerLevel, tierNumber);

    return {
      targetModel: selection.selectedModel.id,
      originalRequestedModel: requestedModel,
      powerLevel: selection.selectedModel.powerLevel,
      isVirtualRoute: true,
      routingReason: `[Axis Auto 2-Steps] Étape 1 (Décision): ${decision.decisionReason} -> Étape 2 (Exécution): Sélection de ${selection.selectedModel.name} (Palier ${tierNumber} cap: ${calculateMaxAllowedCost(tierNumber)}$/1M).`,
      fallbackChain: ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct:free'],
    };
  }

  // Routes directes par niveau
  if (norm === 'axis-low') {
    const selection = selectBestModelForTier('low', tierNumber);
    return {
      targetModel: selection.selectedModel.id,
      originalRequestedModel: requestedModel,
      powerLevel: 'low',
      isVirtualRoute: true,
      routingReason: '[Axis Low] Modèle léger sélectionné.',
      fallbackChain: ['meta-llama/llama-3.3-70b-instruct:free'],
    };
  }

  if (norm === 'axis-ultra') {
    const selection = selectBestModelForTier('ultra', tierNumber);
    return {
      targetModel: selection.selectedModel.id,
      originalRequestedModel: requestedModel,
      powerLevel: selection.selectedModel.powerLevel,
      isVirtualRoute: true,
      routingReason: `[Axis Ultra] Modèle ultra-raisonnement sélectionné (${selection.selectedModel.name}).`,
      fallbackChain: ['deepseek/deepseek-r1', 'google/gemini-2.0-flash-001'],
    };
  }

  // Modèle spécifique demandé par le client
  const meta = KNOWN_MODELS[requestedModel];
  return {
    targetModel: requestedModel,
    originalRequestedModel: requestedModel,
    powerLevel: meta?.powerLevel || 'medium',
    isVirtualRoute: false,
    routingReason: `Modèle explicite demandé : ${requestedModel}`,
    fallbackChain: meta?.fallbackModelId ? [meta.fallbackModelId] : [],
  };
}
