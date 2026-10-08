# 🛡️ ACCESS AI / AXIS PROXY - GATEKEEPER INFRASTRUCTURE

Proxy d'API haute performance, sécurisé et intelligent pour **OpenRouter**, hébergé avec **Supabase** et propulsé par le routeur dynamique **Axis Auto**.

Ce système agit comme un **Gatekeeper atomique** : il intercepte chaque requête, vérifie la validité de la clé API, contrôle le crédit USD restant du pack rattaché, filtre les modèles selon le crédit initial du pack et met à jour les soldes de manière atomique.

---

## 📋 Architecture & Fonctionnalités Clés

Le catalogue commercial comprend trois familles et neuf packs pay-as-you-go. Chaque pack crédite un montant USD fixe à validation du paiement, sans échéance. Les modèles payants proposés sont sélectionnés depuis le catalogue actif selon le seuil `crédit initial / 40` USD combinés par million de tokens ; les modèles à coût nul sont des modèles de test, soumis aux quotas du fournisseur et non présentés comme illimités. La mutualisation CUMP des frais n'est pas encore incluse.

1. **Procédure Stockée RPC PostgreSQL Pure (Zéro Edge Function)** :
   - Atomicité stricte avec verrouillage de ligne (`FOR UPDATE`) pour éliminer tout risque de double dépense en forte concurrence.
   - Les packs et leur crédit n'expirent pas automatiquement ; l'accès s'arrête lorsque le pack est désactivé ou son solde épuisé.
   - Rejet net (**HTTP 402**) si le solde est épuisé ou le pack inactif.
   - Rejet immédiat (**HTTP 403**) si le modèle demandé dépasse le seuil de coût du pack.

2. **Neuf packs pay-as-you-go et filtrage par crédit** :
   - Trois familles : Étudiant & Découverte, Pro & Automatisation, Entreprise & Scale.
   - Chaque pack crédite un montant USD fixe correspondant à son prix en milliers de FCFA (de 1 500 XOF / 1,50 USD à 30 000 XOF / 30 USD).
   - Le coût combiné maximal des modèles payants est `crédit USD initial / 40` par million de tokens. Le catalogue est cumulatif à mesure que le crédit augmente.
   - Les modèles fournisseur à coût nul sont signalés comme modèles de test, instables et soumis aux quotas du fournisseur ; ils ne consomment pas le crédit Axis.

3. **Cycle de vie des packs** :
   - Une clé API est rattachée à un pack actif.
   - Le crédit reste disponible sans échéance et peut être consommé jusqu'à épuisement.
   - Un nouvel achat crée une demande de pack distincte, en attente de validation du paiement.

4. **Mode Axis Auto (Routage Intelligent en 2 Étapes)** :
   - Les modèles sont classés en 4 niveaux de puissance : `low`, `medium`, `high`, `ultra` (raisonnement).
   - **Étape 1 (Décision) :** Analyse ultra-légère du prompt pour déterminer le niveau d'effort requis.
   - **Étape 2 (Exécution) :** Routage vers un modèle payant du catalogue respectant le seuil de coût du pack.

---

## 🗄️ 1. Déploiement SQL dans Supabase

Les migrations Supabase sont dans `supabase/migrations/`. Pour une base existante, appliquez-les dans l'ordre, jusqu'à `007_pay_as_you_go_packs.sql`, qui ajoute le catalogue des neuf packs, les demandes de recharge sans expiration et la validation du crédit.

### Instructions d'installation dans Supabase :
1. Rendez-vous sur votre tableau de bord Supabase : [https://supabase.com/dashboard/project/oahduqmmqiwdldsqmzhv](https://supabase.com/dashboard/project/oahduqmmqiwdldsqmzhv)
2. Ouvrez l'onglet **SQL Editor**.
3. Appliquez les migrations dans l'ordre et cliquez sur **Run** pour chacune.
4. La migration `007_pay_as_you_go_packs.sql` requiert le schéma des migrations précédentes (`profiles`, `tiers`, `models`, `subscriptions` et `api_keys`).

---

## 🧪 2. Journal des Tests & Exécution (`test-results.log`)

La suite de tests existante se lance avec :

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

### Créer une demande de pack

Le point d'entrée `POST /v1/subscriptions` attend un jeton utilisateur Supabase Bearer et un code de pack du catalogue. Exemple de corps : `{"pack_code":"starter-light"}`. Le paiement reste en attente jusqu'à sa validation.

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

### Tentative d'accès à un modèle hors seuil de pack

```bash
# Réponse HTTP 403 :
# {
#   "error": {
#     "code": "MODEL_NOT_PERMITTED_FOR_PACK",
#     "message": "Ce modèle ne respecte pas le seuil de volume minimal du pack."
#   }
# }
```
