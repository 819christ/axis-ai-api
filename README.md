# 🛡️ ACCESS AI / AXIS PROXY - GATEKEEPER INFRASTRUCTURE

Proxy d'API haute performance, sécurisé et intelligent pour **OpenRouter**, hébergé avec **Supabase** et propulsé par le routeur dynamique **Axis Auto**.

Ce système agit comme un **Gatekeeper** : il intercepte chaque requête, vérifie la validité de la clé API, contrôle le budget restant en USD sur l'abonnement rattaché selon la formule d'estimation, dispatche intelligemment les prompts vers le modèle optimal, et met à jour les soldes de manière découplée sans goulot d'étranglement.

---

## 📋 Architecture & Fonctionnalités Clés

1. **Gatekeeper Synchrone (Procédure stockée PL/pgSQL)** :
   - Vérification de la clé API hachée (SHA-256).
   - Détection des modèles gratuits (coût 0.00$) : passage immédiat sans déduction de solde.
   - Modèles payants : estimation budgétaire rigoureuse ($E = \text{Tokens entrée} \times \text{prix entrée} + \text{Max Tokens} \times \text{prix sortie}$).
   - Rejet net (HTTP 402 - *Payment Required*) si solde insuffisant.
   - Décompte asynchrone découplé en base après consommation réelle des tokens.

2. **Routeur Intelligent d'Amont ("Axis Auto")** :
   - Analyse d'intention et heuristiques de complexité (détection de code, mots-clés de raisonnement, contexte volumineux, function calling).
   - Routes virtuelles :
     - `axis-auto` : Sélection automatique entre *economy* et *performance*.
     - `axis-free` : Routage exclusif sur le pool de modèles gratuits.
     - `axis-economy` : Modèles ultra-rapides et économiques (ex: GPT-4o Mini, Gemini 2.0 Flash).
     - `axis-performance` : Modèles d'ingénierie et de raisonnement (ex: Claude 3.5 Sonnet, DeepSeek R1).
   - **Système de Fallback (Secours)** : Basculement automatique et transparent vers un modèle équivalent en cas d'erreur 502/503/504 ou timeout d'OpenRouter.

3. **Gestion des Clés & Abonnements** :
   - Clés préfixées `axis_live_...` affichées une seule fois à la création, stockées uniquement sous forme de hash SHA-256.
   - Fonctions RPC pour générer, rafraîchir et révoquer les clés.
   - Tâche automatisée (Cron Job) pour désactiver les abonnements expirés ou épuisés.

4. **Deux modes de déploiement inclus** :
   - **Serveur Proxy Node.js / Fastify** : ultra-rapide, streaming SSE natif zéro-latence.
   - **Supabase Edge Function** : déploiement sans serveur directement dans votre projet Supabase.

---

## 🗄️ 1. Déploiement de la Base de Données dans Supabase

Les scripts SQL se trouvent dans le dossier `supabase/migrations/` :
- [001_initial_schema.sql](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/supabase/migrations/001_initial_schema.sql) : Tables `models`, `subscriptions`, `api_keys`, `usage_logs` et toutes les fonctions PL/pgSQL.
- [002_seed_data.sql](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/supabase/migrations/002_seed_data.sql) : Modèles initiaux (Claude 3.5 Sonnet, GPT-4o, Llama 3.3 Free, Gemini Flash, DeepSeek, etc.) avec leurs tarifs et chaînes de fallback.

### Instructions d'installation dans Supabase :
1. Rendez-vous sur votre tableau de bord Supabase : [https://supabase.com/dashboard/project/oahduqmmqiwdldsqmzhv](https://supabase.com/dashboard/project/oahduqmmqiwdldsqmzhv)
2. Ouvrez l'onglet **SQL Editor** dans la barre latérale.
3. Créez une nouvelle requête et copiez-y le contenu de [001_initial_schema.sql](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/supabase/migrations/001_initial_schema.sql), puis cliquez sur **Run**.
4. Créez une seconde requête avec le contenu de [002_seed_data.sql](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/supabase/migrations/002_seed_data.sql), puis cliquez sur **Run**.

---

## ⚙️ 2. Configuration & Variables d'Environnement

Le fichier `.env` est déjà préconfiguré avec vos clés Supabase. Pensez à renseigner votre clé OpenRouter :

```env
PORT=3000
HOST=0.0.0.0

# Votre clé API OpenRouter (https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Supabase Credentials (Projet: oahduqmmqiwdldsqmzhv)
SUPABASE_URL=https://oahduqmmqiwdldsqmzhv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Token secret pour le webhook Cron
CRON_SECRET_TOKEN=axis_cron_secret_key_change_me_987654

DEFAULT_MAX_OUTPUT_TOKENS=1024
PROXY_TIMEOUT_MS=60000
```

---

## 🚀 3. Démarrage Rapide

### A. Lancer la suite de tests automatisée
```bash
npm run test-proxy
```
*Vérifie le hachage cryptographique, le tokenizer, l'analyse d'intention Axis Auto, les endpoints Fastify et la protection du Cron.*

### B. Créer un abonnement et une clé de démonstration
Une fois les scripts SQL exécutés dans Supabase, générez votre première clé d'accès avec un solde de 10.00 USD :
```bash
npm run generate-key
```
La console affichera votre clé secrète en clair (ex: `axis_live_a3f819...`).

### C. Démarrer le serveur proxy
```bash
# Mode développement avec rechargement à chaud
npm run dev

# Ou mode production
npm start
```

### D. Synchroniser les tarifs OpenRouter en temps réel (Optionnel)
Pour mettre à jour automatiquement le catalogue et les tarifs depuis l'API officielle d'OpenRouter :
```bash
npm run sync-models
```

---

## 📡 4. Utilisation de l'API (Compatible OpenAI)

Le proxy s'utilise exactement comme l'API standard d'OpenAI. Remplacez simplement `https://api.openai.com/v1` par `http://localhost:3000/v1` (ou l'URL de votre serveur en production) et utilisez votre clé `axis_live_...`.

### Exemple 1 : Requête avec routage intelligent Axis Auto
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer axis_live_votre_cle_ici" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "axis-auto",
    "messages": [
      {"role": "user", "content": "Quelle est la différence entre une architecture microservices et un monolithe modulaire ?"}
    ]
  }'
```

### Exemple 2 : Requête 100% Gratuite (Modèle Axis Free)
*Aucun montant n'est débité sur le solde de votre abonnement :*
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer axis_live_votre_cle_ici" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "axis-free",
    "messages": [
      {"role": "user", "content": "Raconte-moi une blague sur les développeurs."}
    ]
  }'
```

### Exemple 3 : Streaming en temps réel (SSE)
```bash
curl -N -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer axis_live_votre_cle_ici" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "axis-auto",
    "stream": true,
    "messages": [
      {"role": "user", "content": "Écris un poème sur l intelligence artificielle."}
    ]
  }'
```

### Exemple 4 : Consulter son solde et quota restant
```bash
curl -X GET http://localhost:3000/v1/balance \
  -H "Authorization: Bearer axis_live_votre_cle_ici"
```
*Réponse :*
```json
{
  "key": {
    "id": "e21b...",
    "prefix": "axis_live_a3f8...",
    "name": "Test Key Dev",
    "is_enabled": true,
    "requests_today": 4
  },
  "subscription": {
    "budget_amount_usd": 10.00,
    "balance_usd": 9.984210,
    "expires_at": "2026-11-04T12:00:00Z",
    "is_active": true
  }
}
```

---

## 🔄 5. Automatisation du Nettoyage (Cron Job)

Pour désactiver automatiquement les abonnements expirés ou à solde nul et révoquer l'accès aux clés correspondantes :

### Avec cron-job.org :
- **URL** : `https://votre-domaine.com/v1/cron/cleanup`
- **Méthode** : `POST` ou `GET`
- **Fréquence** : Toutes les heures ou 1 fois par jour
- **En-têtes HTTP** :
  ```http
  x-cron-token: axis_cron_secret_key_change_me_987654
  ```

---

## ⚡ 6. Déploiement en Supabase Edge Function (Optionnel)

Le code Deno autonome est prêt dans [supabase/functions/axis-proxy/index.ts](file:///c:/Users/ThinkPad/Desktop/Axis%20AI%20api/supabase/functions/axis-proxy/index.ts).

Pour le déployer avec le CLI Supabase :
```bash
supabase functions deploy axis-proxy --project-ref oahduqmmqiwdldsqmzhv
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
```
L'URL d'appel sera alors : `https://oahduqmmqiwdldsqmzhv.supabase.co/functions/v1/axis-proxy`
