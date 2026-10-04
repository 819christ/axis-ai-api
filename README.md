# 🛡️ ACCESS AI / AXIS PROXY - GATEKEEPER INFRASTRUCTURE

Proxy d'API haute performance, sécurisé et intelligent pour **OpenRouter**, hébergé avec **Supabase** et propulsé par le routeur dynamique **Axis Auto**.

Ce système agit comme un **Gatekeeper atomique** : il intercepte chaque requête, vérifie la validité de la clé API, contrôle le budget restant en USD sur l'abonnement rattaché, applique la formule mathématique de filtrage par palier ($P_1$ à $P_7$), dispatche intelligemment les prompts en 2 étapes, et met à jour les soldes de manière atomique sans goulot d'étranglement.

---

## 📋 Architecture & Fonctionnalités Clés

1. **Procédure Stockée RPC PostgreSQL Pure (Zéro Edge Function)** :
   - Atomicité stricte avec verrouillage de ligne (`FOR UPDATE`) pour éliminer tout risque de double dépense en forte concurrence.
   - Contrôle du cycle de vie des 30 jours et bascule automatique.
   - Rejet net (**HTTP 402**) si le solde est épuisé ou l'abonnement expiré.
   - Rejet immédiat (**HTTP 403**) si le modèle demandé dépasse le plafond du palier.

2. **Les 7 Paliers d'Abonnement et Formule Mathématique de Filtrage** :
   Chaque palier $P_i$ ($i \in [1..7]$) intègre la formule mathématique de filtrage par coût combiné maximum (Entrée + Sortie) par million de tokens :
   $$\text{MaxAllowedCost}(P_i) = \alpha \times i + \beta \quad (\text{avec } \alpha = 5.00\$ \text{ et } \beta = 0.00\$)$$
   - **Palier 1 (Starter)** : $\text{MaxAllowedCost} = 5.00\$ / 1\text{M}$ (ex: GPT-4o Mini, Gemini 2.0 Flash, DeepSeek-Chat, modèles gratuits).
   - **Palier 2 (Basic)** : $\text{MaxAllowedCost} = 10.00\$ / 1\text{M}$ (modèles légers et polyvalents).
   - **Palier 3 (Standard)** : $\text{MaxAllowedCost} = 15.00\$ / 1\text{M}$ (ex: GPT-4o, OpenAI o1-mini).
   - **Palier 4 (Pro)** : $\text{MaxAllowedCost} = 20.00\$ / 1\text{M}$ (ex: Claude 3.5 Sonnet).
   - **Palier 5 (Expert)** : $\text{MaxAllowedCost} = 25.00\$ / 1\text{M}$.
   - **Palier 6 (Master)** : $\text{MaxAllowedCost} = 30.00\$ / 1\text{M}$.
   - **Palier 7 (Enterprise)** : $\text{MaxAllowedCost} = 35.00\$ / 1\text{M}$.

3. **Cycle de Vie des 30 Jours & Règle Anti-Abus des 7 Derniers Jours (J-7)** :
   - **1 clé API = 1 abonnement actif unique** (pas de cumul non contrôlé).
   - **Durée stricte de 30 jours calendaires**.
   - **Règle J-7 :**
     - À plus de 7 jours de l'échéance : tentative de réabonnement rejetée (HTTP 409 `EARLY_RENEWAL_FORBIDDEN`).
     - Dans les 7 jours avant expiration (ou solde à 0) : souscription autorisée en statut `pending`.
     - À l'expiration de l'actuel, le pack `pending` s'active **atomiquement** sans aucune interruption de service.

4. **Mode Axis Auto (Routage Intelligent en 2 Étapes)** :
   - Les modèles sont classés en 4 niveaux de puissance : `low`, `medium`, `high`, `ultra` (raisonnement).
   - **Étape 1 (Décision) :** Analyse ultra-légère du prompt pour déterminer le niveau d'effort requis.
   - **Étape 2 (Exécution) :** Routage vers le meilleur modèle disponible correspondant au palier de l'utilisateur ($\le \text{MaxAllowedCost}(P_i)$).

---

## 🗄️ 1. Déploiement SQL dans Supabase

Le script de migration complet est disponible dans :
- [003_seven_tiers_lifecycle.sql](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/supabase/migrations/003_seven_tiers_lifecycle.sql)

### Instructions d'installation dans Supabase :
1. Rendez-vous sur votre tableau de bord Supabase : [https://supabase.com/dashboard/project/oahduqmmqiwdldsqmzhv](https://supabase.com/dashboard/project/oahduqmmqiwdldsqmzhv)
2. Ouvrez l'onglet **SQL Editor**.
3. Copiez l'intégralité du contenu de [003_seven_tiers_lifecycle.sql](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/supabase/migrations/003_seven_tiers_lifecycle.sql) et cliquez sur **Run**.
4. Toutes les tables (`tiers`, `models`, `subscriptions`, `api_keys`, `usage_logs`) et fonctions RPC (`axis_subscribe`, `axis_gatekeeper_validate`, `axis_settle_usage`) sont alors prêtes.

---

## 🧪 2. Journal des Tests & Exécution (`test-results.log`)

La suite de validation technique complète couvre tous les scénarios critiques :
- **Formule mathématique des 7 Paliers** ($P_1$ à $P_7$)
- **Filtrage des modèles** (accès autorisé vs refus HTTP 403 strict)
- **Cycle de vie 30 jours et expiration automatique** (HTTP 402 `SUBSCRIPTION_EXPIRED`)
- **Épuisement des tokens / budget** (HTTP 402 `SUBSCRIPTION_DEPLETED`)
- **Règle anti-abus des 7 jours** (Refus avant J-7, mise en attente `pending`, transition sans couture)
- **Mode Axis Auto en 2 étapes** (Décision `low`/`medium`/`high`/`ultra` puis Exécution sous plafond)
- **Test de charge et concurrence** (20 requêtes simultanées avec verrouillage atomique `FOR UPDATE`)

Pour lancer la suite et mettre à jour le journal :
```bash
npm test
```

Consultez le fichier généré à la racine : [test-results.log](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/test-results.log).

---

## 🚀 3. Démarrage du Proxy Node.js / Fastify

```bash
# Mode développement avec rechargement à chaud
npm run dev

# Mode production
npm start
```

---

## 📡 4. Exemples d'Appels API

### Souscrire à un palier (avec règle J-7)
```bash
curl -X POST http://localhost:3000/v1/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "00000000-0000-0000-0000-000000000001", "tier_number": 3}'
```

### Requête de Complétion avec Axis Auto
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer axis_live_votre_cle" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "axis-auto",
    "messages": [{"role": "user", "content": "Rédige une fonction de tri optimisée en TypeScript."}]
  }'
```

### Tentative d'accès à un modèle hors palier (Exemple Palier 1 demandant Claude 3.5 Sonnet)
```bash
# Réponse HTTP 403 :
# {
#   "error": {
#     "code": "TIER_MODEL_NOT_PERMITTED",
#     "message": "Ce modèle n'est pas inclus dans votre palier actuel."
#   }
# }
```
