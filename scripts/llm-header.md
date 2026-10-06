# AXIS AI — Contexte Global du Projet

```
Projet: Axis AI API + Frontend (Gatekeeper Proxy OpenRouter)
Stack: Fastify (backend), React/Vite (frontend), Supabase (DB)
```

## Résumé de l'architecture récente

### Pages du dashboard (routes dans frontend/src/App.jsx)
- `/dashboard/history` → `MySubscriptionsPage` : packs actifs (consommation + période écoulée, clé liée, bouton « Renouveler » à J-7) et packs terminés. Une demande en attente n'y apparaît pas (bannière vers les paiements). `?focus=<id>` vers une demande en attente redirige vers `/dashboard/payments?focus=<id>`.
- `/dashboard/payments` → `PaymentsPage` : TOUTES les demandes (en attente, validées, annulées), filtres, suivi en 3 étapes (Demande, Validation, Activation), WhatsApp, saisie du code MOD.
- Données partagées : `hooks/useMySubscriptions.js` et `lib/subscriptionUtils.js` (noms et prix des paliers en constantes, libellés de statuts).
- `HistoryPage.jsx` est l'ancienne page unique : elle n'est plus routée et peut être supprimée.

### Avatars
- `components/avatarLibrary.jsx` : 20 icônes SVG, teinte 0-359, 3 tons (Vif, Doux, Profond) = 21 600 variantes. Sans choix enregistré, l'avatar est dérivé du pseudo.
- `components/VectorAvatar.jsx` (rendu), `components/AvatarPicker.jsx` (sélecteur dans Paramètres).
- Colonnes `profiles.avatar_icon`, `avatar_hue`, `avatar_tone`.

### Paliers & Tarification
- « En attente » et « Demande en cours » ne s'affichent que si l'on arrive par une clé (état de navigation `targetKeyId` ou `?key=<id>`) dont l'abonnement est en attente, et seulement sur le palier de cette demande.

### Clés API
- Suppression interdite pour une clé liée à un abonnement `pending_validation`, `pending` ou `active` : bloquée en base (RPC `axis_revoke_api_key` + trigger `trg_prevent_key_delete`) et pop-up « Suppression impossible » dans l'interface (code d'erreur `KEY_HAS_SUBSCRIPTION`).

### Accès administrateur
- Le rôle `admin` est réservé à `aureltchiakpe819@gmail.com` (trigger `trg_enforce_single_admin`).
- Écran PIN `components/AdminGate.jsx` autour de `/dashboard/admin`. PIN par défaut 10606 (haché bcrypt dans `admin_security`), 5 erreurs = blocage 15 min, session déverrouillée 2 h. Bouton « Sécurité » (`AdminSecurityButton`) dans `AdminPage` pour changer le PIN.
- Côté base : les policies admin et les RPC admin exigent `is_admin_unlocked()` / `assert_admin_unlocked()`.
- Schéma SQL : `supabase_production_schema.sql` v2.3 (à exécuter dans le SQL Editor Supabase).

### Points ouverts
- La RPC `axis_moderator_validate_subscription_by_code` (bouton « Code MOD ») n'est définie dans aucun SQL : elle est listée dans les privilèges mais doit encore être écrite.
- L'abonnement ne peut être créé que si l'utilisateur possède au moins une clé API.

### Régénérer ce fichier
- `powershell -File scripts/build-llm-md.ps1` (en-tête : `scripts/llm-header.md`, puis tous les fichiers suivis par git).

---

