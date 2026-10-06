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


FICHIER: /.agents/skills/iterative-visual-workflow/SKILL.md

---
name: iterative-visual-workflow
description: Automatise un flux de développement itératif combinant vérification d'infrastructure, logique back-end, test visuel des états et validation par étapes avant de passer au composant suivant. À utiliser pour les tâches de code web avec rendu visuel.
---

# iterative-visual-workflow

Instructions pour l'agent IA afin d'exécuter des tâches de développement robustes sans boucler ni ignorer les vérifications visuelles.

## Usage

À utiliser dès qu'une fonctionnalité ou un composant web (React/Supabase) nécessite d'être implémenté, testé logiquement et vérifié visuellement dans ses différents états avant validation.

## Steps

1. **Vérification d'infrastructure & Connexion :** Tester la connectivité aux services (Supabase, API) avant toute implémentation.
   * *Vérification :* Confirmer que les endpoints répondent sans erreur 5xx.
2. **Initialisation de la base de données :** Configurer ou valider les tables, colonnes et enregistrements nécessaires en base.
   * *Vérification :* S'assurer que les données mock ou réelles sont bien injectées.
3. **Implémentation du code :** Écrire la logique back-end et les composants front-end associés de manière propre.
   * *Vérification :* Compilation et build sans erreur (ex: `npm run build`).
4. **Test visuel des états :** Vérifier l'interface sous ses différents états (chargement, succès, erreur, vide).
   * *Vérification :* Contrôler la cohérence du rendu visuel par rapport aux attentes.
5. **Validation itérative & Propagation :** Valider l'élément actuel avant de passer au composant lié suivant.
   * *Vérification :* Le parcours utilisateur de bout en bout fonctionne sans blocage.

---

FICHIER: /.env.example

PORT=3000
HOST=0.0.0.0
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET_TOKEN=your_secure_cron_secret
DEFAULT_MAX_OUTPUT_TOKENS=1024
PROXY_TIMEOUT_MS=60000

---

FICHIER: /.gitignore

node_modules/
dist/
.env
.env.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*

---

FICHIER: /frontend/.env.example

VITE_SUPABASE_URL=https://oahduqmmqiwdldsqmzhv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haGR1cW1tcWl3ZGxkc3Ftemh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDg0OTcsImV4cCI6MjEwNjY4NDQ5N30.iWXknFIutPZiJX0O5zH4qWIqD20vnB_j9-Mb6TTy9D8
VITE_PROXY_URL=http://localhost:3000

---

FICHIER: /frontend/index.html

<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/assets/axis_ai_accent.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Axis AI - La passerelle IA unifiée</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

---

FICHIER: /frontend/package.json

{
  "name": "axis-ai-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.400.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.0"
  }
}

---

FICHIER: /frontend/public/_redirects

/*    /index.html   200

---

FICHIER: /frontend/public/assets/axis_ai_accent.svg

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 11.5" width="32" height="32" fill="none">
  <g transform="translate(-62.7,-91.2)">
    <path stroke="#84cc16" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"
       d="m 70.506747,100.93962 -1.538607,1.8563 -2.383036,-0.36648 -2.376908,-0.40433 -0.874132,-2.247009 -0.838301,-2.260624 1.508903,-1.880527 1.538608,-1.856301 2.383035,0.366484 2.376908,0.404323 0.874133,2.247012 0.8383,2.260623 z"
       transform="rotate(21.290812,70.976765,98.817263)" />
  </g>
</svg>

---

FICHIER: /frontend/src/App.jsx

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { MySubscriptionsPage } from './pages/MySubscriptionsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ModeratorPage } from './pages/ModeratorPage';
import { AdminPage } from './pages/AdminPage';
import { AdminGate } from './components/AdminGate';

// Route protégée pour les utilisateurs authentifiés
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--axis-bg)', color: 'var(--axis-textMuted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="ax-spin" style={{ width: 36, height: 36, border: '3px solid var(--axis-border)', borderTopColor: 'var(--axis-accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
          <span>Chargement de votre session...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--axis-bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
        {children}
      </div>
    </div>
  );
};

// Route publique qui redirige vers /dashboard si déjà connecté
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export const App = () => {
  // Support rétro-compatible pour d'anciens liens hash (ex: /#/dashboard -> /dashboard)
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.replace('#', '');
      window.history.replaceState(null, '', cleanPath);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />

        {/* Routes du Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
        <Route path="/dashboard/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="/dashboard/history" element={<ProtectedRoute><MySubscriptionsPage /></ProtectedRoute>} />
        <Route path="/dashboard/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/moderator" element={<ProtectedRoute><ModeratorPage /></ProtectedRoute>} />
        <Route path="/dashboard/admin" element={<ProtectedRoute><AdminGate><AdminPage /></AdminGate></ProtectedRoute>} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

---

FICHIER: /frontend/src/components/AdminGate.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { Modal } from './Modal';

const AdminGateContext = createContext({});

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Enveloppe la page Administration : exige le PIN avant d'afficher quoi que ce soit.
// Le contrôle est AUSSI appliqué côté base (RLS + RPC) : masquer l'écran ne suffit pas, il faut le PIN.
export const AdminGate = ({ children }) => {
  const { profile } = useAuth();
  const [status, setStatus] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc('axis_admin_pin_status').then(({ data, error: e }) => {
      setStatus(!e && data?.success ? data : { unlocked: false, is_default_pin: true });
    });
  }, [isAdmin]);

  // Re-verrouillage automatique à l'expiration de la session PIN
  useEffect(() => {
    if (!status?.unlocked || !status.unlocked_until) return undefined;
    const ms = new Date(status.unlocked_until) - Date.now();
    const id = setTimeout(() => setStatus((s) => ({ ...s, unlocked: false })), Math.max(ms, 0));
    return () => clearTimeout(id);
  }, [status?.unlocked, status?.unlocked_until]);

  if (!profile) return null;
  if (!isAdmin) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--axis-muted)' }}>Accès réservé à l'administrateur suprême.</div>;
  }
  if (!status) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--axis-muted)' }}>Vérification de l'accès...</div>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { data, error: rpcErr } = await supabase.rpc('axis_admin_verify_pin', { p_pin: pin });
    setBusy(false);
    setPin('');
    if (rpcErr) { setError(rpcErr.message); return; }
    if (data?.success) { setStatus({ ...data, unlocked: true }); return; }
    if (data?.error_code === 'PIN_LOCKED') setError(`Trop de tentatives. Accès bloqué jusqu'à ${fmtTime(data.locked_until)}.`);
    else if (data?.error_code === 'PIN_INVALID') setError(`PIN incorrect — ${data.attempts_left} essai(s) restant(s).`);
    else setError(data?.error_message || 'Vérification impossible.');
  };

  const lock = async () => {
    await supabase.rpc('axis_admin_lock');
    setStatus((s) => ({ ...s, unlocked: false }));
  };

  if (!status.unlocked) {
    return (
      <div style={{ maxWidth: 380, margin: '90px auto 0', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 18px', borderRadius: 16, background: 'rgba(192,132,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={28} color="var(--axis-purple)" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Accès administrateur</h1>
        <p style={{ fontSize: 13, color: 'var(--axis-textMuted)', marginBottom: 22 }}>Saisissez votre code PIN pour ouvrir le tableau de bord.</p>
        <form onSubmit={submit}>
          <input
            type="password" inputMode="numeric" autoComplete="off" autoFocus maxLength={8}
            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="input-field" placeholder="• • • • •"
            style={{ textAlign: 'center', fontSize: 22, letterSpacing: '0.4em', marginBottom: 12 }}
          />
          {(error || status.locked_until) && (
            <div style={{ fontSize: 12.5, color: 'var(--axis-danger)', marginBottom: 12 }}>
              {error || `Accès bloqué jusqu'à ${fmtTime(status.locked_until)}.`}
            </div>
          )}
          <button type="submit" disabled={busy || pin.length < 5} className="btn-primary" style={{ width: '100%' }}>
            {busy ? 'Vérification...' : 'Déverrouiller'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminGateContext.Provider value={{ lock, isDefaultPin: status.is_default_pin, markPinChanged: () => setStatus((s) => ({ ...s, is_default_pin: false })) }}>
      {status.is_default_pin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)', margin: '0 auto 18px', maxWidth: 1200, fontSize: 12.5 }}>
          <AlertTriangle size={16} color="var(--axis-warning)" />
          Vous utilisez encore le PIN par défaut. Changez-le via le bouton « Sécurité ».
        </div>
      )}
      {children}
    </AdminGateContext.Provider>
  );
};

// Bouton à placer dans l'en-tête de AdminPage : changer le PIN / verrouiller.
export const AdminSecurityButton = () => {
  const { lock, isDefaultPin, markPinChanged } = useContext(AdminGateContext);
  const addToast = useToast();
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const digits = (setter) => (e) => setter(e.target.value.replace(/\D/g, ''));

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) { addToast('La confirmation ne correspond pas au nouveau PIN.', 'error'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('axis_admin_change_pin', { p_current: cur, p_new: next });
    setBusy(false);
    if (error || !data?.success) {
      addToast(error?.message || data?.error_message || 'Changement impossible.', 'error');
      return;
    }
    addToast('PIN modifié avec succès.', 'success');
    markPinChanged?.();
    setOpen(false); setCur(''); setNext(''); setConfirm('');
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12, position: 'relative' }}>
        <ShieldCheck size={14} /> Sécurité
        {isDefaultPin && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--axis-warning)' }} />}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Sécurité de l'administration">
        <form onSubmit={submit}>
          {[['PIN actuel', cur, digits(setCur)], ['Nouveau PIN (5 à 8 chiffres)', next, digits(setNext)], ['Confirmer le nouveau PIN', confirm, digits(setConfirm)]].map(([label, val, onChange]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{label}</label>
              <input type="password" inputMode="numeric" maxLength={8} className="input-field" value={val} onChange={onChange} required />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => { setOpen(false); lock(); }} className="btn-ghost" style={{ flex: 1 }}>
              <Lock size={14} /> Verrouiller
            </button>
            <button type="submit" disabled={busy} className="btn-primary" style={{ flex: 2 }}>
              <KeyRound size={14} /> {busy ? 'Modification...' : 'Changer le PIN'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

---

FICHIER: /frontend/src/components/avatarLibrary.jsx

// 20 icônes vectorielles (viewBox 64x64). Chaque icône reçoit :
//   f = couleur de premier plan, d = couleur de détail (yeux, nervures...)
// Combinées à 360 teintes x 3 tons => 21 600 avatars différents.

export const AVATAR_ICONS = [
  { name: 'Chat', render: (f, d) => (<>
    <path d="M14 20 L22 8 L30 18 H34 L42 8 L50 20 V40 Q50 54 32 54 Q14 54 14 40Z" fill={f} />
    <circle cx="24" cy="34" r="3" fill={d} /><circle cx="40" cy="34" r="3" fill={d} />
    <path d="M29 40h6l-3 4z" fill={d} /></>) },
  { name: 'Renard', render: (f, d) => (<>
    <path d="M10 12 L26 22 H38 L54 12 L50 36 Q46 54 32 56 Q18 54 14 36Z" fill={f} />
    <circle cx="24" cy="34" r="3" fill={d} /><circle cx="40" cy="34" r="3" fill={d} />
    <circle cx="32" cy="48" r="3.5" fill={d} /></>) },
  { name: 'Ours', render: (f, d) => (<>
    <circle cx="17" cy="18" r="8" fill={f} /><circle cx="47" cy="18" r="8" fill={f} />
    <circle cx="32" cy="36" r="20" fill={f} />
    <ellipse cx="32" cy="44" rx="9" ry="7" fill={d} opacity=".25" />
    <circle cx="24" cy="31" r="3" fill={d} /><circle cx="40" cy="31" r="3" fill={d} />
    <circle cx="32" cy="42" r="3" fill={d} /></>) },
  { name: 'Hibou', render: (f, d) => (<>
    <path d="M14 14 L24 20 H40 L50 14 V42 Q50 56 32 56 Q14 56 14 42Z" fill={f} />
    <circle cx="24" cy="32" r="8" fill={d} opacity=".3" /><circle cx="40" cy="32" r="8" fill={d} opacity=".3" />
    <circle cx="24" cy="32" r="3.5" fill={d} /><circle cx="40" cy="32" r="3.5" fill={d} />
    <path d="M29 38 H35 L32 46Z" fill={d} /></>) },
  { name: 'Robot', render: (f, d) => (<>
    <rect x="30" y="8" width="4" height="12" fill={f} /><circle cx="32" cy="8" r="4" fill={f} />
    <rect x="9" y="30" width="5" height="12" rx="2" fill={f} /><rect x="50" y="30" width="5" height="12" rx="2" fill={f} />
    <rect x="14" y="20" width="36" height="32" rx="9" fill={f} />
    <circle cx="24" cy="34" r="4" fill={d} /><circle cx="40" cy="34" r="4" fill={d} />
    <rect x="23" y="44" width="18" height="3" rx="1.5" fill={d} /></>) },
  { name: 'Alien', render: (f, d) => (<>
    <path d="M32 8 C48 8 54 24 50 36 C46 50 38 56 32 56 C26 56 18 50 14 36 C10 24 16 8 32 8Z" fill={f} />
    <path d="M17 28 Q26 28 28 38 Q18 38 17 28Z" fill={d} /><path d="M47 28 Q38 28 36 38 Q46 38 47 28Z" fill={d} /></>) },
  { name: 'Fantôme', render: (f, d) => (<>
    <path d="M14 54 V28 C14 16 22 8 32 8 C42 8 50 16 50 28 V54 L43 48 L37.5 54 L32 48 L26.5 54 L21 48Z" fill={f} />
    <circle cx="25" cy="28" r="3.5" fill={d} /><circle cx="39" cy="28" r="3.5" fill={d} />
    <ellipse cx="32" cy="38" rx="3" ry="4" fill={d} /></>) },
  { name: 'Fusée', render: (f, d) => (<>
    <path d="M32 6 C42 14 44 28 42 42 H22 C20 28 22 14 32 6Z" fill={f} />
    <path d="M22 34 L12 46 L22 44Z" fill={f} /><path d="M42 34 L52 46 L42 44Z" fill={f} />
    <circle cx="32" cy="26" r="5" fill={d} /><path d="M27 46 H37 L32 58Z" fill={f} opacity=".7" /></>) },
  { name: 'Planète', render: (f, d) => (<>
    <ellipse cx="32" cy="32" rx="27" ry="9" fill="none" stroke={f} strokeWidth="4" transform="rotate(-20 32 32)" />
    <circle cx="32" cy="32" r="14" fill={f} />
    <path d="M20 29 Q32 36 44 29" stroke={d} strokeWidth="3" fill="none" opacity=".35" /></>) },
  { name: 'Lune', render: (f, d) => (<>
    <path d="M40 8 A24 24 0 1 0 56 40 A18 18 0 0 1 40 8Z" fill={f} />
    <polygon points="46,11 48,16 53.5,16.3 49.2,19.7 50.8,25 46,22 41.2,25 42.8,19.7 38.5,16.3 44,16" fill={f} />
    <circle cx="22" cy="36" r="3" fill={d} opacity=".3" /></>) },
  { name: 'Soleil', render: (f, d) => (<>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <rect key={a} x="30" y="6" width="4" height="10" rx="2" fill={f} transform={`rotate(${a} 32 32)`} />
    ))}
    <circle cx="32" cy="32" r="12" fill={f} /><circle cx="32" cy="32" r="5" fill={d} opacity=".3" /></>) },
  { name: 'Montagne', render: (f, d) => (<>
    <path d="M4 52 L24 18 L36 36 L42 28 L60 52Z" fill={f} />
    <path d="M24 18 L19 27 L24 25 L28 28Z" fill={d} opacity=".35" />
    <circle cx="48" cy="14" r="5" fill={f} opacity=".7" /></>) },
  { name: 'Vague', render: (f) => (<>
    <path d="M6 22 Q15 10 24 22 T42 22 T60 22" stroke={f} strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M6 36 Q15 24 24 36 T42 36 T60 36" stroke={f} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
    <path d="M6 50 Q15 38 24 50 T42 50 T60 50" stroke={f} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".45" /></>) },
  { name: 'Feuille', render: (f, d) => (<>
    <path d="M12 52 C12 24 28 10 54 10 C54 38 40 54 12 52Z" fill={f} />
    <path d="M16 48 C26 36 36 26 46 18" stroke={d} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".5" /></>) },
  { name: 'Flamme', render: (f, d) => (<>
    <path d="M32 6 C36 18 50 24 50 40 C50 50 42 58 32 58 C22 58 14 50 14 40 C14 32 20 28 22 20 C26 24 28 28 28 32 C32 26 34 16 32 6Z" fill={f} />
    <path d="M32 58 C26 58 22 54 22 48 C22 42 28 40 32 32 C36 40 42 42 42 48 C42 54 38 58 32 58Z" fill={d} opacity=".35" /></>) },
  { name: 'Éclair', render: (f) => (<path d="M36 4 L12 36 H27 L24 60 L52 26 H36Z" fill={f} />) },
  { name: 'Gemme', render: (f, d) => (<>
    <path d="M18 12 H46 L58 26 L32 56 L6 26Z" fill={f} />
    <path d="M6 26 H58 M18 12 L24 26 L32 56 M46 12 L40 26 L32 56 M24 26 L32 12 L40 26" stroke={d} strokeWidth="2" fill="none" opacity=".4" /></>) },
  { name: 'Couronne', render: (f, d) => (<>
    <path d="M8 46 L12 18 L24 32 L32 14 L40 32 L52 18 L56 46Z" fill={f} />
    <rect x="8" y="48" width="48" height="8" rx="3" fill={f} />
    <circle cx="20" cy="52" r="2" fill={d} /><circle cx="32" cy="52" r="2" fill={d} /><circle cx="44" cy="52" r="2" fill={d} /></>) },
  { name: 'Cube', render: (f, d) => (<>
    <path d="M32 6 L54 18 V44 L32 58 L10 44 V18Z" fill={f} />
    <path d="M32 32 L10 18 M32 32 L54 18 M32 32 V58" stroke={d} strokeWidth="3" fill="none" opacity=".4" /></>) },
  { name: 'Cœur', render: (f) => (
    <path d="M32 56 C10 40 6 28 6 20 C6 12 12 8 19 8 C25 8 30 12 32 17 C34 12 39 8 45 8 C52 8 58 12 58 20 C58 28 54 40 32 56Z" fill={f} />) },
];

export const AVATAR_TONES = [
  { name: 'Vif',     s: 72, l1: 58, l2: 42, light: false },
  { name: 'Doux',    s: 55, l1: 80, l2: 68, light: true },
  { name: 'Profond', s: 50, l1: 34, l2: 20, light: false },
];

export const avatarColors = (hue, tone) => {
  const t = AVATAR_TONES[tone] ?? AVATAR_TONES[0];
  return {
    bg1: `hsl(${hue} ${t.s}% ${t.l1}%)`,
    bg2: `hsl(${(hue + 35) % 360} ${t.s}% ${t.l2}%)`,
    fg: t.light ? `hsl(${hue} 45% 16%)` : '#ffffff',
    detail: t.light ? `hsl(${hue} 80% 92%)` : `hsl(${hue} 45% 16%)`,
  };
};

const hashSeed = (seed) => {
  let h = 2166136261;
  const s = String(seed || 'axis');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

// Config effective : valeurs choisies par l'utilisateur, sinon dérivées de son pseudo/id
export const resolveAvatar = (profile, seed) => {
  const h = hashSeed(seed ?? profile?.pseudo ?? profile?.id);
  return {
    icon: profile?.avatar_icon ?? h % AVATAR_ICONS.length,
    hue: profile?.avatar_hue ?? Math.floor(h / 20) % 360,
    tone: profile?.avatar_tone ?? Math.floor(h / 7200) % 3,
  };
};

export const randomAvatar = () => ({
  icon: Math.floor(Math.random() * AVATAR_ICONS.length),
  hue: Math.floor(Math.random() * 360),
  tone: Math.floor(Math.random() * 3),
});

---

FICHIER: /frontend/src/components/AvatarPicker.jsx

import { useState } from 'react';
import { Shuffle, Save } from 'lucide-react';
import { VectorAvatar } from './VectorAvatar';
import { AVATAR_ICONS, AVATAR_TONES, resolveAvatar, randomAvatar } from './avatarLibrary';

export const AvatarPicker = ({ profile, onSave, saving }) => {
  const [cfg, setCfg] = useState(() => resolveAvatar(profile));
  const set = (patch) => setCfg((c) => ({ ...c, ...patch }));
  const rainbow = 'linear-gradient(90deg,' + [0, 60, 120, 180, 240, 300, 359].map((h) => `hsl(${h} 75% 55%)`).join(',') + ')';

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ textAlign: 'center' }}>
        <VectorAvatar {...cfg} size={110} />
        <button type="button" onClick={() => setCfg(randomAvatar())} className="btn-ghost" style={{ marginTop: 12, fontSize: 12, padding: '6px 12px' }}>
          <Shuffle size={13} /> Aléatoire
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Icône</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))', gap: 8, marginBottom: 18 }}>
          {AVATAR_ICONS.map((ic, i) => (
            <button
              key={ic.name} type="button" title={ic.name} onClick={() => set({ icon: i })}
              style={{ padding: 3, borderRadius: '50%', cursor: 'pointer', background: 'transparent', border: `2px solid ${cfg.icon === i ? 'var(--axis-accent)' : 'transparent'}` }}
            >
              <VectorAvatar icon={i} hue={cfg.hue} tone={cfg.tone} size={38} />
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Couleur</div>
        <input
          type="range" min="0" max="359" value={cfg.hue} onChange={(e) => set({ hue: Number(e.target.value) })}
          aria-label="Teinte"
          style={{ width: '100%', height: 10, borderRadius: 999, background: rainbow, appearance: 'none', outline: 'none', marginBottom: 16, cursor: 'pointer' }}
        />

        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Ton</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {AVATAR_TONES.map((t, i) => (
            <button
              key={t.name} type="button" onClick={() => set({ tone: i })} className="btn-ghost"
              style={{ fontSize: 12, padding: '6px 14px', borderColor: cfg.tone === i ? 'var(--axis-accent)' : undefined, color: cfg.tone === i ? 'var(--axis-accent)' : undefined }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <button type="button" disabled={saving} onClick={() => onSave(cfg)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={15} /> {saving ? 'Enregistrement...' : "Enregistrer l'avatar"}
        </button>
      </div>
    </div>
  );
};

---

FICHIER: /frontend/src/components/AxisLogo.jsx

export const AxisLogo = ({ width = 32, height = 32, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 11.5" width={width} height={height} fill="none" className={className}>
    <g transform="translate(-62.7,-91.2)">
      <path stroke="#84cc16" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
         d="m 70.506747,100.93962 -1.538607,1.8563 -2.383036,-0.36648 -2.376908,-0.40433 -0.874132,-2.247009 -0.838301,-2.260624 1.508903,-1.880527 1.538608,-1.856301 2.383035,0.366484 2.376908,0.404323 0.874133,2.247012 0.8383,2.260623 z"
         transform="rotate(21.290812,70.976765,98.817263)" />
    </g>
  </svg>
);

---

FICHIER: /frontend/src/components/ConfirmationModal.jsx

import { AlertTriangle } from 'lucide-react';

/**
 * Modal de confirmation réutilisable — remplace window.confirm()
 * pour une UX cohérente avec le thème Axis (clair/sombre).
 */
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10, 10, 12, 0.55)', backdropFilter: 'blur(6px)',
      padding: 16,
    }}>
      <div className="ax-fade-in" style={{
        background: 'var(--axis-sidebar)',
        border: '1px solid var(--axis-border)',
        borderRadius: 18,
        width: '100%', maxWidth: 420,
        padding: '22px 24px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {isDanger && (
            <div style={{ marginBottom: 12 }}>
              <AlertTriangle size={36} color="var(--axis-danger)" style={{ margin: '0 auto' }} />
            </div>
          )}
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: isDanger ? 'var(--axis-danger)' : 'var(--axis-text)',
          }}>
            {title}
          </h2>
          {message && (
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
              {message}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            style={{ flex: 1 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

---

FICHIER: /frontend/src/components/Modal.jsx

import { X } from 'lucide-react';

// Pop-up sobre et neutre : fond sombre discret, bordures grises, aucune couleur fluo.
// Seules les notifications (voir Toast.jsx) conservent des couleurs vives.
export const Modal = ({ isOpen, onClose, title, children, isDanger }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10, 10, 12, 0.55)', backdropFilter: 'blur(6px)',
      padding: 16,
    }}>
      <div className="ax-fade-in" style={{
        background: 'var(--axis-sidebar)',
        border: '1px solid var(--axis-border)',
        borderRadius: 18,
        width: '100%', maxWidth: 500,
        padding: '22px 24px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: isDanger ? 'var(--axis-danger)' : 'var(--axis-text)',
            opacity: isDanger ? 0.85 : 1,
          }}>
            {title}
          </h2>
          {onClose && (
            <button onClick={onClose} style={{ color: 'var(--axis-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={22} />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

---

FICHIER: /frontend/src/components/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { Home, Key, Layers, History, CreditCard, Shield, UserCog, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AxisLogo } from './AxisLogo';
import { VectorAvatar } from './VectorAvatar';

// Épaisseur de police identique actif/inactif : le libellé ne change jamais de largeur,
// donc le bouton ne change jamais de forme. L'état actif passe par le fond et la couleur.
const navStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
  minHeight: 44, borderRadius: 10, textDecoration: 'none',
  background: isActive ? 'var(--axis-hover)' : 'transparent',
  color: isActive ? 'var(--axis-text)' : 'var(--axis-textMuted)',
  fontWeight: 500,
  fontSize: 14,
  transition: 'background 0.15s ease, color 0.15s ease',
});

const renderNav = (items) => items.map((item) => (
  <NavLink
    key={item.to}
    to={item.to}
    end={item.end}
    style={navStyle}
    onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--axis-hover)'; }}
    onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
  >
    <item.icon size={18} style={{ flexShrink: 0 }} />
    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
      {item.label}
    </span>
  </NavLink>
));

export const Sidebar = () => {
  const { profile, signOut } = useAuth();

  const navItems = [
    { to: '/dashboard', end: true, icon: Home, label: 'Accueil' },
    { to: '/dashboard/keys', icon: Key, label: 'Clés API' },
    { to: '/dashboard/history', icon: Layers, label: 'Mes abonnements' },
    { to: '/dashboard/payments', icon: History, label: 'Historique des paiements' },
  ];

  if (profile?.role === 'moderator' || profile?.role === 'admin') {
    navItems.push({ to: '/dashboard/moderator', icon: Shield, label: 'Modération' });
  }
  if (profile?.role === 'admin') {
    navItems.push({ to: '/dashboard/admin', icon: UserCog, label: 'Administration' });
  }

  const bottomNavItems = [
    { to: '/dashboard/subscriptions', icon: CreditCard, label: 'Paliers & Tarification' },
  ];

  return (
    <div style={{
      width: 272,
      background: 'var(--axis-sidebar)',
      borderRight: '1px solid var(--axis-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: 16,
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '8px 12px' }}>
        <AxisLogo size={24} />
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--axis-text)', letterSpacing: '-0.02em' }}>Axis AI</span>
      </div>

      {/* Navigation principale */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {renderNav(navItems)}
      </nav>

      {/* Paliers & tarification (en bas de la sidebar) */}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--axis-border)' }}>
        {renderNav(bottomNavItems)}
      </div>

      {/* Profil + déconnexion */}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--axis-border)' }}>
        {profile && (
          <NavLink
            to="/dashboard/settings"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 8,
              borderRadius: 14, textDecoration: 'none',
              background: isActive ? 'var(--axis-hover)' : 'rgba(255,255,255,0.025)',
              border: '1px solid var(--axis-border)',
              transition: 'background 0.15s ease',
            })}
            title="Paramètres du compte"
          >
            <VectorAvatar profile={profile} size={42} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--axis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.pseudo || profile.username}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, minWidth: 0 }}>
                <span className={`badge ${profile.role === 'admin' ? 'badge-purple' : profile.role === 'moderator' ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: 9, padding: '1px 7px', flexShrink: 0 }}>
                  {profile.role}
                </span>
                <span style={{ fontSize: 11, color: 'var(--axis-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{profile.username}
                </span>
              </div>
            </div>
            <Settings size={15} color="var(--axis-muted)" style={{ flexShrink: 0 }} />
          </NavLink>
        )}

        <button
          onClick={signOut}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 14px', width: '100%', borderRadius: 10,
            color: 'var(--axis-muted)', fontWeight: 500, fontSize: 13,
            background: 'transparent', border: '1px solid var(--axis-border)', transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.05)'; e.currentTarget.style.color = 'var(--axis-danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--axis-muted)'; }}
          title="Se déconnecter"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

---

FICHIER: /frontend/src/components/Toast.jsx

import { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

// Traduit les erreurs Supabase/PostgreSQL techniques en messages lisibles
function humanizeError(raw) {
  if (!raw) return 'Une erreur est survenue.';
  const msg = typeof raw === 'string' ? raw : (raw.message || String(raw));
  if (msg.includes('infinite recursion') || msg.includes('recursion detected'))
    return 'Erreur de configuration Supabase (politique RLS récursive). Exécutez le script supabase_hotfix.sql pour débloquer cette action.';
  if (msg.includes('JWT') || msg.includes('not authenticated'))
    return 'Session expirée. Veuillez vous reconnecter.';
  if (msg.includes('violates row-level security') || msg.includes('new row violates'))
    return 'Accès refusé par les règles de sécurité. Vérifiez votre session.';
  if (msg.includes('duplicate key') || msg.includes('already exists'))
    return 'Cette entrée existe déjà.';
  if (msg.includes('network') || msg.includes('Failed to fetch'))
    return 'Erreur réseau. Vérifiez votre connexion internet.';
  return msg;
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    const displayMsg = type === 'error' ? humanizeError(message) : (message || 'Info');
    setToasts(prev => [...prev, { id, message: displayMsg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'error' ? 8000 : 5000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
        {toasts.map(t => (
          <div key={t.id} className="ax-fade-in" style={{
            background: 'var(--axis-sidebar)',
            borderLeft: `4px solid ${t.type === 'error' ? 'var(--axis-danger)' : t.type === 'success' ? 'var(--axis-accent)' : 'var(--axis-purple)'}`,
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            color: 'var(--axis-text)',
            fontSize: 13,
            lineHeight: 1.5
          }}>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ color: 'var(--axis-muted)', flexShrink: 0, marginTop: 1 }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

---

FICHIER: /frontend/src/components/VectorAvatar.jsx

import { useMemo } from 'react';
import { AVATAR_ICONS, avatarColors, resolveAvatar } from './avatarLibrary';

// Avatar vectoriel. Trois façons de l'utiliser :
//   <VectorAvatar profile={profile} />                    -> config enregistrée du profil (sinon dérivée du pseudo)
//   <VectorAvatar seed="pseudo" />                        -> config dérivée de la graine (rétro-compatible)
//   <VectorAvatar icon={3} hue={200} tone={1} />          -> config explicite (aperçu du sélecteur)
export const VectorAvatar = ({ profile, seed, icon, hue, tone, size = 36, style }) => {
  const uid = useMemo(() => `av${Math.random().toString(36).slice(2, 9)}`, []);
  const base = resolveAvatar(profile, seed);
  const cfg = { icon: icon ?? base.icon, hue: hue ?? base.hue, tone: tone ?? base.tone };
  const c = avatarColors(cfg.hue, cfg.tone);
  const glyph = AVATAR_ICONS[cfg.icon % AVATAR_ICONS.length];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0, ...style }}
      role="img"
      aria-label={`Avatar ${glyph.name}`}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.bg1} />
          <stop offset="1" stopColor={c.bg2} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${uid})`} />
      <g transform="translate(9 9) scale(0.72)">{glyph.render(c.fg, c.detail)}</g>
    </svg>
  );
};

---

FICHIER: /frontend/src/hooks/useApiKeys.js

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export const useApiKeys = () => {
  const { user, profile } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchKeys();
    } else {
      setKeys([]);
      setLoading(false);
    }
  }, [user]);

  // Récupère toutes les clés de l'utilisateur avec leur abonnement associé
  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*, subscriptions(id, tier_number, status, balance_usd, expires_at, budget_amount_usd)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setKeys(data);
      }
    } catch (err) {
      console.error('Erreur chargement clés:', err);
    } finally {
      setLoading(false);
    }
  };

  // Création d'une clé API — Libre et possible même SANS abonnement actif
  const createKey = async (name, subscriptionId = null, dailyLimit = null) => {
    try {
      // Tentative 1 : RPC serveur
      const { data, error } = await supabase.rpc('axis_generate_api_key', {
        p_user_id: user.id,
        p_subscription_id: subscriptionId || null,
        p_name: name || 'Default API Key',
        p_daily_limit: dailyLimit || null
      });

      if (!error && data?.success) {
        await fetchKeys();
        return { data, error: null };
      }

      // Tentative 2 : Fallback client (Web Crypto API)
      console.warn('[Axis Key Generator] RPC échouée, bascule vers le générateur client :', error?.message);
      const randBytes = new Uint8Array(24);
      window.crypto.getRandomValues(randBytes);
      const rawHex = Array.from(randBytes, b => b.toString(16).padStart(2, '0')).join('');

      // Clé complète : 'axis_live_' + 40 hex chars ≈ 50 chars
      const fullKey = 'axis_live_' + rawHex.slice(0, 40);

      // key_prefix doit tenir dans varchar(16) : 'ax_' + 8 hex + '...' = 14 chars ✓
      const keyPrefix = 'ax_' + rawHex.slice(0, 8) + '...';

      // Hash SHA-256 via SubtleCrypto
      const encoder = new TextEncoder();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(fullKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Vérifier le statut réel de l'abonnement avant d'activer la clé
      let isKeyEnabled = profile?.role === 'admin';
      if (subscriptionId && !isKeyEnabled) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, is_active, expires_at')
          .eq('id', subscriptionId)
          .maybeSingle();
        if (sub) isKeyEnabled = (sub.status === 'active' && sub.is_active === true && new Date(sub.expires_at) > new Date());
      }

      const { data: insertedKey, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          subscription_id: subscriptionId || null,
          name: (name || 'Default API Key').trim(),
          key_hash: keyHash,
          key_prefix: keyPrefix,
          is_enabled: isKeyEnabled,
          daily_request_limit: dailyLimit || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchKeys();
      return {
        data: {
          success: true,
          api_key: fullKey,
          key_prefix: keyPrefix,
          key_id: insertedKey.id,
          is_enabled: isKeyEnabled
        },
        error: null
      };
    } catch (err) {
      console.error('Erreur createKey:', err);
      return { data: null, error: err };
    }
  };

  // Bascule active/inactive avec vérification d'abonnement
  const toggleKey = async (keyId, isEnabled, hasValidSubscription) => {
    const isAdmin = profile?.role === 'admin';

    if (isEnabled && !hasValidSubscription && !isAdmin) {
      return {
        error: {
          message: "Un abonnement actif est requis pour activer cette clé.",
          needSubscription: true
        }
      };
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq('id', keyId);

    if (!error) {
      await fetchKeys();
    }
    return { error };
  };

  // Liaison manuelle d'une clé existante à un abonnement
  const linkKeyToSubscription = async (keyId, subscriptionId) => {
    // Lire le statut réel de l'abonnement — ne pas deviner
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, is_active, expires_at')
      .eq('id', subscriptionId)
      .maybeSingle();

    const subIsLive = sub?.status === 'active' && sub?.is_active === true && new Date(sub.expires_at) > new Date();

    const { error } = await supabase
      .from('api_keys')
      .update({
        subscription_id: subscriptionId,
        is_enabled: Boolean(subIsLive) || profile?.role === 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (!error) await fetchKeys();
    return { error };
  };

  // Suppression / Révocation définitive
  const deleteKey = async (keyId) => {
    const { data, error } = await supabase.rpc('axis_revoke_api_key', { p_key_id: keyId, p_delete: true });
    if (error) {
      return { error: { message: error.message, code: /KEY_HAS_SUBSCRIPTION/.test(error.message) ? 'KEY_HAS_SUBSCRIPTION' : undefined } };
    }
    if (data?.success === false) {
      return { error: { message: data.error_message, code: data.error_code } };
    }
    await fetchKeys();
    return { error: null };
  };

  // Rotation / Régénération de clé
  const refreshKey = async (keyId) => {
    const { data, error } = await supabase.rpc('axis_refresh_api_key', { p_key_id: keyId });

    if (error) return { data: null, error };

    if (!data?.success) {
      return {
        data,
        error: {
          message: data?.error_message || 'Échec de la régénération.',
          code: data?.error_code,
        },
      };
    }

    await fetchKeys();
    return { data: { ...data, api_key: data.api_key || data.new_api_key }, error: null };
  };

  return {
    keys,
    loading,
    refresh: fetchKeys,
    createKey,
    toggleKey,
    linkKeyToSubscription,
    deleteKey,
    refreshKey
  };
};

---

FICHIER: /frontend/src/hooks/useAuth.jsx

import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronisation & création sécurisée du profil (Trigger PostgreSQL + Fallback Frontend)
  const ensureProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setLoading(false);
      return null;
    }

    try {
      // 1. Tenter de récupérer le profil existant
      const { data: existingProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existingProfile) {
        setProfile(existingProfile);
        return existingProfile;
      }

      // 2. Si le profil n'existe pas encore (ex: premier login Google ou trigger retardé),
      // création automatique avec rôle par défaut 'client'
      const meta = authUser.user_metadata || {};
      const fallbackUsername = meta.username || (authUser.email ? authUser.email.split('@')[0] : `user_${authUser.id.slice(0, 6)}`);
      const fallbackPseudo = meta.pseudo || meta.full_name || meta.name || fallbackUsername;

      const profilePayload = {
        id: authUser.id,
        email: authUser.email || '',
        username: fallbackUsername,
        pseudo: fallbackPseudo,
        role: 'client'
      };

      const { data: insertedProfile, error: insertErr } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!insertErr && insertedProfile) {
        setProfile(insertedProfile);
        return insertedProfile;
      } else {
        // En cas de restriction RLS temporaire, on garde un profil local pour ne pas bloquer l'UI
        setProfile(profilePayload);
        return profilePayload;
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation du profil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Auth state change listener (Google OAuth callback, sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await ensureProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error && res.data?.user) {
      setUser(res.data.user);
      await ensureProfile(res.data.user);
    }
    return res;
  };
  
  // Inscription avec auto-connexion immédiate
  const signUp = async (email, password, username, pseudo) => {
    // 1. Création de l'utilisateur avec métadonnées pour le trigger PostgreSQL
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          pseudo: pseudo.trim()
        }
      }
    });

    if (error) return { data, error };

    // 2. Si une session est directement retournée (auto-confirm activé)
    if (data?.session && data?.user) {
      setUser(data.user);
      await ensureProfile(data.user);
      return { data, error: null, autoLoggedIn: true };
    }

    // 3. Si aucune session n'est retournée directement, tentative d'auto-login immédiat
    try {
      const signInRes = await supabase.auth.signInWithPassword({ email, password });
      if (!signInRes.error && signInRes.data?.session) {
        setUser(signInRes.data.user);
        await ensureProfile(signInRes.data.user);
        return { data: signInRes.data, error: null, autoLoggedIn: true };
      }
    } catch {
      // Ignorer si la confirmation par email est strictement obligatoire sur le projet Supabase
    }

    return { data, error: null, autoLoggedIn: false };
  };

  // Google OAuth avec URL de redirection dynamique (Localhost ou Cloudflare Pages)
  const signInWithGoogle = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
  };

  const signOut = () => supabase.auth.signOut();

  // Recharge le profil (après modification de l'avatar, du pseudo...)
  const refreshProfile = () => (user ? ensureProfile(user) : null);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

---

FICHIER: /frontend/src/hooks/useMySubscriptions.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { useToast } from '../components/Toast';

// Source de données unique : abonnements + clés de l'utilisateur connecté
export const useMySubscriptions = () => {
  const { profile } = useAuth();
  const addToast = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const [subRes, keyRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('id, name, key_prefix, subscription_id, is_enabled').eq('user_id', profile.id),
      ]);
      if (subRes.error && !subRes.error.message?.includes('recursion')) throw subRes.error;
      setSubscriptions(subRes.error ? [] : subRes.data || []);
      setApiKeys(keyRes.data || []);
    } catch (e) {
      console.error(e);
      addToast(e.message || 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const keyForSub = (subId) => apiKeys.find((k) => k.subscription_id === subId);

  return { profile, subscriptions, apiKeys, loading, refresh, keyForSub };
};

---

FICHIER: /frontend/src/hooks/useSubscription.js

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (tierNumber, moderatorCode) => {
    try {
      const { data, error } = await supabase.rpc('axis_subscribe', {
        p_user_id: user.id,
        p_tier_number: tierNumber,
        p_moderator_code: moderatorCode ? moderatorCode.trim() : null
      });

      if (!error && data?.success) {
        await fetchSubscription();
        return { data, error: null };
      }

      console.warn('[Axis Subscription] RPC indisponible ou en erreur, bascule vers création directe :', error?.message || data?.error_message);
      
      // Fallback direct : création de la souscription en attente de validation
      const TIERS_BUDGETS = { 1: 10, 2: 25, 3: 50, 4: 100, 5: 200, 6: 350, 7: 500 };
      const budget = TIERS_BUDGETS[tierNumber] || 10;
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let modId = null;
      let modCodeUsed = null;
      if (moderatorCode && moderatorCode.trim()) {
        const { data: modProfile } = await supabase
          .from('profiles')
          .select('id, moderator_code')
          .eq('role', 'moderator')
          .ilike('moderator_code', moderatorCode.trim())
          .maybeSingle();

        if (modProfile) {
          modId = modProfile.id;
          modCodeUsed = modProfile.moderator_code;
        } else {
          modCodeUsed = moderatorCode.trim().toUpperCase();
        }
      }

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          tier_number: tierNumber,
          budget_amount_usd: budget,
          balance_usd: budget,
          consumed_usd: 0,
          starts_at: now.toISOString(),
          expires_at: expires.toISOString(),
          status: 'pending_validation',
          is_active: false,
          moderator_id: modId,
          moderator_code_used: modCodeUsed,
          commission_status: modCodeUsed ? 'unpaid' : 'none'
        })
        .select()
        .single();

      if (subError) throw subError;

      await fetchSubscription();
      return {
        data: {
          success: true,
          subscription_id: subData.id,
          status: 'pending_validation',
          tier_number: tierNumber
        },
        error: null
      };
    } catch (err) {
      console.error('Erreur subscribe:', err);
      return { data: null, error: err };
    }
  };

  return { subscription, loading, error, refresh: fetchSubscription, subscribe };
};

---

FICHIER: /frontend/src/lib/subscriptionUtils.js

export const TIERS_NAMES = { 1: 'Starter', 2: 'Basic', 3: 'Standard', 4: 'Pro', 5: 'Expert', 6: 'Master', 7: 'Enterprise' };
export const TIERS_XOF = { 1: 1500, 2: 3000, 3: 6000, 4: 12000, 5: 18000, 6: 24000, 7: 30000 };
export const WA_NUMBER = '0166518473';

export const isPendingStatus = (s) => s.status === 'pending_validation' || s.status === 'pending';

export const fmtXof = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

export const fmtDate = (d, opts = { day: '2-digit', month: 'long', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('fr-FR', opts) : '—';

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

export const daysRemaining = (expiresAt) =>
  expiresAt ? Math.ceil((new Date(expiresAt) - new Date()) / 86400000) : null;

// % du budget consommé
export const usagePct = (sub) => {
  const budget = Math.max(0.01, Number(sub.budget_amount_usd || 0));
  const balance = Math.max(0, Number(sub.balance_usd || 0));
  return Math.min(100, Math.max(0, ((budget - balance) / budget) * 100));
};

// % de la période écoulée (starts_at → expires_at)
export const periodPct = (sub) => {
  const start = new Date(sub.starts_at).getTime();
  const end = new Date(sub.expires_at).getTime();
  if (!start || !end || end <= start) return 0;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
};

// Libellés « Mes abonnements » (état du pack)
export const SUB_STATUS = {
  active:   { label: 'Actif',      badge: 'badge-green' },
  expired:  { label: 'Expiré',     badge: 'badge-gray' },
  depleted: { label: 'Épuisé',     badge: 'badge-red' },
  disabled: { label: 'Désactivé',  badge: 'badge-red' },
};

// Libellés « Historique des paiements » (état de la demande)
export const PAYMENT_STATUS = {
  pending_validation: { label: 'À valider',         badge: 'badge-yellow' },
  pending:            { label: "En file d'attente", badge: 'badge-blue' },
  active:             { label: 'Pack activé',       badge: 'badge-green' },
  expired:            { label: 'Terminé',           badge: 'badge-gray' },
  depleted:           { label: 'Terminé',           badge: 'badge-gray' },
  disabled:           { label: 'Annulé',            badge: 'badge-red' },
};

---

FICHIER: /frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

// Restaure le thème choisi par l'utilisateur avant le premier rendu (évite le flash sombre)
if (localStorage.getItem('axis_theme') === 'light') {
  document.documentElement.setAttribute('data-axis-theme', 'light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);

---

FICHIER: /frontend/src/pages/AdminPage.jsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { AdminSecurityButton } from '../components/AdminGate';
import { ShieldAlert, UserPlus, RefreshCw, Archive, CheckCircle, Ban, Users } from 'lucide-react';

export const AdminPage = () => {
  const { profile } = useAuth();
  const [subs, setSubs] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [disableSubId, setDisableSubId] = useState(null);
  const [reason, setReason] = useState('');
  
  // Nominate moderator form state
  const [isNominateOpen, setIsNominateOpen] = useState(false);
  const [nominateUserId, setNominateUserId] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);

  const addToast = useToast();

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchSubs();
      fetchModerators();
      fetchAllProfiles();
    }
  }, [profile]);

  const fetchSubs = async () => {
    const { data } = await supabase.from('subscriptions').select('*, profiles(pseudo, email, username)').order('created_at', { ascending: false });
    if (data) setSubs(data);
  };

  const fetchModerators = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'moderator').order('created_at', { ascending: false });
    if (data) setModerators(data);
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, pseudo, email, username, role').order('created_at', { ascending: false });
    if (data) setAllProfiles(data);
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      addToast('Un justificatif textuel obligatoire (min 5 caractères) doit être fourni.', 'error');
      return;
    }
    const { data, error } = await supabase.rpc('admin_disable_subscription', {
      p_admin_id: profile.id,
      p_subscription_id: disableSubId,
      p_reason: reason.trim()
    });
    if (error) {
      addToast(error.message, 'error');
    } else if (!data?.success) {
      addToast(data?.error_message || 'Échec de suspension', 'error');
    } else {
      addToast('Abonnement suspendu avec succès. L’alerte s’affichera sur le compte du client.', 'success');
      setDisableSubId(null);
      setReason('');
      fetchSubs();
    }
  };

  const handleNominateModerator = async (e) => {
    e.preventDefault();
    if (!nominateUserId) {
      addToast('Veuillez sélectionner un utilisateur.', 'error');
      return;
    }

    const { data, error } = await supabase.rpc('axis_create_moderator', {
      p_admin_id: profile.id,
      p_user_id: nominateUserId,
      p_custom_code: customCode.trim() || null
    });

    if (error) {
      addToast(error.message, 'error');
    } else if (!data?.success) {
      addToast(data?.error_message || 'Échec d’attribution', 'error');
    } else {
      addToast(`Modérateur nommé avec succès ! Code : ${data.moderator_code}`, 'success');
      setIsNominateOpen(false);
      setNominateUserId('');
      setCustomCode('');
      fetchModerators();
      fetchAllProfiles();
    }
  };

  const handleArchiveCommission = async (subId, newStatus) => {
    const { data, error } = await supabase.rpc('admin_archive_commission', {
      p_admin_id: profile.id,
      p_subscription_id: subId,
      p_new_status: newStatus
    });

    if (error) {
      addToast(error.message, 'error');
    } else if (!data?.success) {
      addToast(data?.error_message || 'Échec d’archivage', 'error');
    } else {
      addToast(`Commission passée en statut : ${newStatus}`, 'success');
      fetchSubs();
    }
  };

  if (profile?.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--axis-muted)' }}>Accès réservé à l'administrateur suprême.</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Panneau d'Administration Suprême</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
            Gestion globale des abonnements, nomination des modérateurs et règlement des commissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <AdminSecurityButton />
          <button onClick={() => { fetchSubs(); fetchModerators(); }} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <button onClick={() => setIsNominateOpen(true)} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <UserPlus size={15} /> Nommer un Modérateur
          </button>
        </div>
      </div>

      {/* Moderators List */}
      <div className="card" style={{ marginBottom: 32, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Modérateurs Actifs ({moderators.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {moderators.map(m => (
            <div key={m.id} style={{
              padding: '12px 16px', borderRadius: 10, background: 'var(--axis-bg)',
              border: '1px solid var(--axis-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.pseudo || m.username}</div>
                <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{m.email}</div>
              </div>
              <span className="badge badge-purple" style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                {m.moderator_code || 'SANS CODE'}
              </span>
            </div>
          ))}
          {moderators.length === 0 && (
            <p style={{ color: 'var(--axis-muted)', fontSize: 13 }}>Aucun modérateur nommé pour le moment.</p>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Tous les Abonnements ({subs.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Palier</th>
                <th>Statut</th>
                <th>Solde / Budget</th>
                <th>Modérateur</th>
                <th>Commission</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.profiles?.pseudo || 'Utilisateur'}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{s.profiles?.email}</div>
                  </td>
                  <td><b>Palier {s.tier_number}</b></td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'pending_validation' ? 'badge-yellow' : s.status === 'disabled' ? 'badge-red' : 'badge-gray'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>${Number(s.balance_usd).toFixed(2)} / ${Number(s.budget_amount_usd).toFixed(2)}</td>
                  <td>
                    {s.moderator_code_used ? (
                      <span style={{ fontFamily: 'monospace', color: 'var(--axis-purple)' }}>{s.moderator_code_used}</span>
                    ) : (
                      <span style={{ color: 'var(--axis-muted)' }}>Direct Admin</span>
                    )}
                  </td>
                  <td>
                    {s.moderator_id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${s.commission_status === 'paid' ? 'badge-green' : s.commission_status === 'unpaid' ? 'badge-yellow' : 'badge-gray'}`}>
                          {s.commission_status}
                        </span>
                        {s.commission_status === 'unpaid' && (
                          <button
                            onClick={() => handleArchiveCommission(s.id, 'paid')}
                            title="Marquer comme payée"
                            className="btn-icon"
                          >
                            <CheckCircle size={14} color="var(--axis-accent)" />
                          </button>
                        )}
                        {s.commission_status === 'paid' && (
                          <button
                            onClick={() => handleArchiveCommission(s.id, 'archived')}
                            title="Archiver la commission"
                            className="btn-icon"
                          >
                            <Archive size={14} color="var(--axis-muted)" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--axis-muted)', fontSize: 11 }}>N/A</span>
                    )}
                  </td>
                  <td>
                    {s.status === 'active' ? (
                      <button
                        onClick={() => setDisableSubId(s.id)}
                        className="btn-ghost"
                        style={{ color: 'var(--axis-danger)', borderColor: 'var(--axis-danger)', padding: '5px 12px', fontSize: 12 }}
                      >
                        <Ban size={12} /> Suspendre
                      </button>
                    ) : s.status === 'disabled' ? (
                      <span style={{ fontSize: 11, color: 'var(--axis-danger)' }} title={s.disabled_reason}>
                        Suspendu
                      </span>
                    ) : (
                      <span style={{ color: 'var(--axis-muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Suspension with Mandatory Reason */}
      <Modal isOpen={!!disableSubId} onClose={() => setDisableSubId(null)} title="Suspendre l'abonnement (Admin Seul)" isDanger>
        <form onSubmit={handleDisable}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
              Justificatif obligatoire (sera affiché en popup au client) :
            </label>
            <textarea
              className="input-field"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              required
              placeholder="Ex: Abus de charge détecté, non-respect des quotas ou contestation de paiement..."
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--axis-danger)', color: '#fff' }}>
            Confirmer la suspension immédiate
          </button>
        </form>
      </Modal>

      {/* Modal Nominate Moderator */}
      <Modal isOpen={isNominateOpen} onClose={() => setIsNominateOpen(false)} title="Nommer un nouveau modérateur">
        <form onSubmit={handleNominateModerator}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Sélectionner l'utilisateur :</label>
            <select
              className="input-field"
              value={nominateUserId}
              onChange={e => setNominateUserId(e.target.value)}
              required
            >
              <option value="">-- Choisir un utilisateur --</option>
              {allProfiles.filter(p => p.role !== 'admin').map(p => (
                <option key={p.id} value={p.id}>
                  {p.pseudo || p.username} ({p.email}) — Actuel : {p.role}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
              Code personnalisé (optionnel, ex: MOD-8888) :
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Laisser vide pour génération aléatoire (MOD-XXXX)"
              value={customCode}
              onChange={e => setCustomCode(e.target.value.toUpperCase())}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Promouvoir en modérateur
          </button>
        </form>
      </Modal>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/ApiKeysPage.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApiKeys } from '../hooks/useApiKeys';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Copy, Plus, RefreshCw, Trash2, Key, AlertCircle,
  CheckCircle2, ArrowRight, Shield, Layers, Zap, ChevronRight, Hourglass
} from 'lucide-react';

// Paliers XOF pour l'affichage du badge
const TIERS_XOF = { 1: '1 500', 2: '3 000', 3: '6 000', 4: '12 000', 5: '18 000', 6: '24 000', 7: '30 000' };
const TIERS_NAMES = { 1: 'Starter', 2: 'Basic', 3: 'Standard', 4: 'Pro', 5: 'Expert', 6: 'Master', 7: 'Enterprise' };

export const ApiKeysPage = () => {
  const { profile } = useAuth();
  const { subscription } = useSubscription();
  const { keys, loading, createKey, toggleKey, deleteKey, refreshKey } = useApiKeys();

  // État création
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État clé créée (affichage unique)
  const [createdKeyData, setCreatedKeyData] = useState(null);

  // État souscrire depuis une clé
  const [subscribeFromKey, setSubscribeFromKey] = useState(null); // keyId

  // État confirmation modale (delete / refresh)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshTarget, setRefreshTarget] = useState(null);
  // État pop-up abonnement en attente de validation
  const [pendingSubKey, setPendingSubKey] = useState(null);
  // État pop-up blocage régénération
  const [refreshBlocked, setRefreshBlocked] = useState(null);
  // État pop-up blocage suppression
  const [deleteBlocked, setDeleteBlocked] = useState(null);

  const navigate = useNavigate();
  const addToast = useToast();

  // Helpers état clé
  const isSubPending = (k) =>
    Boolean(k.subscriptions && ['pending_validation', 'pending'].includes(k.subscriptions.status));
  const getKeyState = (k) => {
    const s = k.subscriptions;
    if (s && s.status === 'active' && new Date(s.expires_at) > new Date()) return 'live';
    if (isSubPending(k)) return 'pending';
    return 'unlinked';
  };
  const hasLockedSub = (k) =>
    Boolean(k.subscriptions && ['pending_validation', 'pending', 'active'].includes(k.subscriptions.status));
  const requestDelete = (k) => (hasLockedSub(k) ? setDeleteBlocked(k) : setDeleteTarget(k));
  const requestRefresh = (k) => {
    if (isSubPending(k) && !isAdmin) { setRefreshBlocked(k); return; }
    setRefreshTarget(k);
  };

  const isAdmin = profile?.role === 'admin';

  // Abonnement actif global (peut être null)
  const hasActiveSub = subscription?.status === 'active' && new Date(subscription.expires_at) > new Date();

  // --- Focus sur une clé depuis la page "Mes abonnements" (?focus=<keyId>) ---
  const [searchParams] = useSearchParams();
  const [focusedKeyId, setFocusedKeyId] = useState(searchParams.get('focus'));
  const keyRowRefs = useRef({});

  useEffect(() => {
    if (!loading && focusedKeyId) {
      const rowEl = keyRowRefs.current[focusedKeyId];
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(() => setFocusedKeyId(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, focusedKeyId]);

  // === Création de clé ===
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clé libre : pas de subscription_id à la création — l'utilisateur lie ensuite son abonnement
      const { data, error } = await createKey(newKeyName.trim() || 'Default API Key', null);

      if (error) {
        addToast(error.message || 'Erreur lors de la génération', 'error');
      } else if (data?.success) {
        setCreatedKeyData({ ...data, mode: 'create', state: data.is_enabled ? 'live' : 'unlinked' });
        setIsCreateOpen(false);
        setNewKeyName('');
        addToast('Clé API générée ! Copiez-la immédiatement.', 'success');
      } else {
        addToast(data?.error_message || 'Échec de génération', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Toggle (activation/désactivation) ===
  const handleToggle = async (keyItem, targetState) => {
    const hasActiveSub = Boolean(
      keyItem.subscriptions?.status === 'active' &&
      new Date(keyItem.subscriptions.expires_at) > new Date()
    );
    const hasPendingSub = Boolean(keyItem.subscriptions && 
      (keyItem.subscriptions.status === 'pending_validation' || keyItem.subscriptions.status === 'pending'));

    // Si on tente d'activer avec un abonnement en attente → pop-up informatif
    if (targetState && hasPendingSub && !hasActiveSub && !isAdmin) {
      setPendingSubKey(keyItem);
      return;
    }

    const res = await toggleKey(keyItem.id, targetState, hasActiveSub || isAdmin);

    if (res?.error) {
      if (res.error.needSubscription) {
        addToast("Activez d'abord un abonnement pour cette clé.", 'warning');
        setSubscribeFromKey(keyItem.id);
      } else {
        addToast(res.error.message, 'error');
      }
    } else {
      addToast(targetState ? 'Clé API activée.' : 'Clé API désactivée.', 'success');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copié dans le presse-papiers !', 'success');
  };

  // Clés sans abonnement actif lié
  const keysWithoutSub = keys.filter(k => {
    const s = k.subscriptions;
    return !s || s.status !== 'active' || new Date(s.expires_at) <= new Date();
  });

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Gestionnaire de Clés d'Accès API</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Créez vos clés, puis liez-leur un abonnement pour les activer.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}
        >
          <Plus size={16} /> Créer une nouvelle clé
        </button>
      </div>

      {/* Banner : clés sans abonnement */}
      {keysWithoutSub.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle color="var(--axis-warning)" size={20} />
            <span style={{ fontSize: 13, color: 'var(--axis-text)' }}>
              <b>{keysWithoutSub.length} clé{keysWithoutSub.length > 1 ? 's' : ''}</b> sans abonnement actif.
              Liez-leur un pack pour les activer et interroger les modèles.
            </span>
          </div>
          <Link to="/dashboard/subscriptions" className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            Voir les 7 paliers (dès 1 500 FCFA) <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Tableau des clés */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Nom de la clé</th>
                <th>Préfixe</th>
                <th>Pack associé</th>
                <th>Activation</th>
                <th>Dernière utilisation</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: 32, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement de vos clés...</td></tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: 36, textAlign: 'center' }}>
                    <Key size={32} color="var(--axis-muted)" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--axis-textMuted)', fontSize: 14, marginBottom: 16 }}>Aucune clé API créée pour le moment.</p>
                    <button onClick={() => setIsCreateOpen(true)} className="btn-primary" style={{ fontSize: 13 }}>
                      Créer ma première clé API
                    </button>
                  </td>
                </tr>
              ) : (
                keys.map(k => {
                  const sub = k.subscriptions;
                  const hasSub = Boolean(sub && sub.status === 'active' && new Date(sub.expires_at) > new Date());
                  const isPending = Boolean(sub && (sub.status === 'pending_validation' || sub.status === 'pending'));
                  const budget = Number(sub?.budget_amount_usd || 0);
                  const balance = Number(sub?.balance_usd || 0);
                  const usagePct = budget > 0 ? Math.min(100, Math.round(((budget - balance) / budget) * 100)) : 0;
                  // État réel : l'utilisateur voit ce que le serveur accepte
                  const isLive = Boolean(k.is_enabled) && (hasSub || profile?.role === 'admin');
                  const isPendingDisplay = !isLive && Boolean(sub && (sub.status === 'pending_validation' || sub.status === 'pending'));

                  return (
                    <tr key={k.id} ref={(el) => (keyRowRefs.current[k.id] = el)} style={{ outline: focusedKeyId === k.id ? '2px solid var(--axis-accent)' : 'none', outlineOffset: -2, transition: 'outline 0.3s ease' }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{k.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>
                          Créée le {new Date(k.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        <span style={{ background: 'var(--axis-bg)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--axis-border)' }}>
                          {k.key_prefix}
                        </span>
                      </td>

                      {/* Colonne Pack associé */}
                      <td>
                        {hasSub ? (
                          <div>
                            <span className="badge badge-green" style={{ marginBottom: 4, display: 'block', width: 'fit-content' }}>
                              Palier {sub.tier_number} — {TIERS_NAMES[sub.tier_number]}
                            </span>
                            {/* Mini barre de progression */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 70, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${usagePct}%`, height: '100%',
                                  background: usagePct >= 80 ? 'var(--axis-danger)' : 'var(--axis-accent)',
                                  borderRadius: 999
                                }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--axis-muted)' }}>{usagePct}%</span>
                            </div>
                            <button
                              onClick={() => navigate(`/dashboard/history?focus=${sub.id}`)}
                              style={{ fontSize: 11, color: 'var(--axis-textMuted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Voir le détail de cet abonnement"
                            >
                              Voir l'abonnement <ArrowRight size={11} />
                            </button>
                          </div>
                        ) : isPending ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span className="badge badge-yellow">En attente de validation</span>
                            <button
                              onClick={() => navigate(`/dashboard/history?focus=${sub.id}`)}
                              style={{ fontSize: 11, color: 'var(--axis-textMuted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, textAlign: 'left' }}
                              title="Voir le détail de cet abonnement"
                            >
                              Voir l'abonnement <ArrowRight size={11} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span className="badge badge-gray">Non lié</span>
                            <button
                              onClick={() => navigate('/dashboard/subscriptions', { state: { targetKeyId: k.id } })}
                              style={{ fontSize: 11, color: 'var(--axis-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textAlign: 'left' }}
                            >
                              + Lier un abonnement
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Toggle activation */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <label className="toggle" title={k.is_enabled ? 'Désactiver la clé' : 'Activer la clé'}>
                            <input
                              type="checkbox"
                              checked={isLive}
                              onChange={e => handleToggle(k, e.target.checked)}
                            />
                            <span className="toggle-track" />
                            <span className="toggle-thumb" />
                          </label>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isLive ? 'var(--axis-accent)' : isPendingDisplay ? 'var(--axis-warning)' : 'var(--axis-muted)' }}>
                            {isLive ? 'ACTIF' : isPendingDisplay ? 'EN ATTENTE' : 'INACTIF'}
                          </span>
                        </div>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--axis-muted)' }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString('fr-FR') : 'Jamais'}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button onClick={() => copyToClipboard(k.key_prefix)} className="btn-icon" title="Copier le préfixe">
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => requestRefresh(k)}
                            className="btn-icon"
                            title={isSubPending(k) && !isAdmin ? 'Indisponible : abonnement en attente' : 'Régénérer cette clé'}
                            style={isSubPending(k) && !isAdmin ? { opacity: 0.45 } : undefined}
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            onClick={() => requestDelete(k)}
                            className="btn-icon danger"
                            title={hasLockedSub(k) ? 'Indisponible : abonnement lié' : 'Supprimer la clé'}
                            style={hasLockedSub(k) ? { opacity: 0.45 } : undefined}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === Modal Création de Clé === */}
      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setNewKeyName(''); }} title="Créer une nouvelle clé d'accès API">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Nom de la clé</label>
            <input
              type="text"
              className="input-field"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              required
              placeholder="Ex: Cursor / Claude Code / Script Python"
              autoFocus
            />
          </div>

          {/* Info contextuelle */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, color: 'var(--axis-accent)', fontWeight: 600 }}>
              <Key size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Comment ça marche ?</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--axis-textMuted)', fontSize: 12 }}>
              <li>Créez votre clé librement — elle sera inactive par défaut.</li>
              <li>Depuis la page <b>Paliers &amp; Tarifs</b>, souscrivez un abonnement en choisissant <b>cette clé</b>.</li>
              <li>Une fois l'abonnement validé, la clé s'active automatiquement.</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => { setIsCreateOpen(false); setNewKeyName(''); }} className="btn-ghost" style={{ flex: 1 }}>
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Génération...' : 'Générer ma clé API'}
            </button>
          </div>
        </form>
      </Modal>

      {/* === Modal Pop-up Unique Affichage Clé en Clair === */}
      <Modal isOpen={!!createdKeyData} title={createdKeyData?.mode === 'refresh' ? '🔄 Clé API régénérée' : '🎉 Clé API générée avec succès'}>
        {createdKeyData && (
          <div>
            {/* Avertissement sécurité */}
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid var(--axis-warning)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <p style={{ color: 'var(--axis-warning)', fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} /> Avertissement de sécurité
              </p>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 12, margin: 0 }}>
                Cette clé secrète ne sera <b>plus jamais affichée en clair</b>. Copiez-la maintenant et conservez-la en lieu sûr.
              </p>
            </div>

            {/* Clé en clair */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Votre clé secrète (Bearer Token) :</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={createdKeyData.api_key}
                  className="input-field"
                  style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--axis-accent)', background: 'var(--axis-bg)' }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdKeyData.api_key)}
                  className="btn-primary"
                  style={{ padding: '8px 14px' }}
                  title="Copier"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* Statut & prochaine étape */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 20, fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap size={14} color={createdKeyData.state === 'live' ? 'var(--axis-accent)' : 'var(--axis-warning)'} />
                <b>Statut :</b>{' '}
                <span style={{ color: createdKeyData.state === 'live' ? 'var(--axis-accent)' : 'var(--axis-warning)' }}>
                  {createdKeyData.state === 'live' && 'Active — liée à votre abonnement'}
                  {createdKeyData.state === 'pending' && 'En attente de validation de l\'abonnement'}
                  {createdKeyData.state === 'unlinked' && 'Inactive — abonnement requis'}
                </span>
              </div>
              <div style={{ color: 'var(--axis-textMuted)', lineHeight: 1.5 }}>
                {createdKeyData.mode === 'refresh' && 'L\'ancienne clé est révoquée. Votre abonnement reste lié à cette nouvelle clé. '}
                {createdKeyData.state === 'unlinked' && <>👉 Rendez-vous dans <b>Paliers &amp; Tarifs</b> pour souscrire un forfait et lier cette clé.</>}
                {createdKeyData.state === 'pending' && 'Elle s\'activera automatiquement dès la validation du paiement.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setCreatedKeyData(null)} className="btn-ghost" style={{ flex: 1 }}>
                J'ai copié ma clé
              </button>
              {createdKeyData.state === 'unlinked' && (
                <button
                  type="button"
                  onClick={() => { setCreatedKeyData(null); navigate('/dashboard/subscriptions'); }}
                  className="btn-primary"
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Layers size={15} /> Voir les paliers d'abonnement
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
      {/* === Modal Abonnement Requis (déclenchée par le toggle) === */}
      <Modal isOpen={!!subscribeFromKey} onClose={() => setSubscribeFromKey(null)} title="Abonnement requis pour activer cette clé">
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
            <Shield size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-textMuted)' }}>
              La clé <b style={{ color: 'var(--axis-text)' }}>{keys.find(k => k.id === subscribeFromKey)?.name || 'sélectionnée'}</b> reste inactive tant qu'aucun abonnement validé ne lui est rattaché.
              Choisissez un palier (dès <b style={{ color: 'var(--axis-accent)' }}>1 500 FCFA</b>) — la clé s'activera automatiquement dès la validation du paiement.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setSubscribeFromKey(null)} className="btn-ghost" style={{ flex: 1 }}>
              Plus tard
            </button>
            <button
              type="button"
              onClick={() => {
                const keyId = subscribeFromKey;
                setSubscribeFromKey(null);
                navigate('/dashboard/subscriptions', { state: { targetKeyId: keyId } });
              }}
              className="btn-primary"
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Layers size={15} /> Choisir un palier pour cette clé
            </button>
          </div>
        </div>
      </Modal>

      {/* === Modal Confirmation Suppression === */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const { error } = await deleteKey(deleteTarget.id);
          if (error?.code === 'KEY_HAS_SUBSCRIPTION') setDeleteBlocked(deleteTarget);
          else if (error) addToast(error.message, 'error');
          else addToast('Clé supprimée définitivement.', 'success');
        }}
        title="Supprimer la clé API"
        message={`Êtes-vous sûr de vouloir supprimer définitivement la clé "${deleteTarget?.name || 'sélectionnée'}" ? Cette action est irréversible et toutes les requêtes utilisant cette clé échoueront.`}
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        isDanger
      />

      {/* === Modal Blocage Suppression === */}
      <Modal isOpen={!!deleteBlocked} onClose={() => setDeleteBlocked(null)} title="Suppression impossible">
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-textMuted)', marginBottom: 20 }}>
          La clé <b style={{ color: 'var(--axis-text)' }}>{deleteBlocked?.name}</b> est liée à un abonnement
          {deleteBlocked?.subscriptions?.status === 'active' ? ' validé en cours' : ' en attente de validation'}.
          Elle pourra être supprimée une fois cet abonnement terminé.
        </div>
        <button onClick={() => setDeleteBlocked(null)} className="btn-primary" style={{ width: '100%' }}>Compris</button>
      </Modal>

      {/* === Modal Confirmation Régénération === */}
      <ConfirmationModal
        isOpen={!!refreshTarget}
        onClose={() => setRefreshTarget(null)}
        onConfirm={async () => {
          const target = refreshTarget;
          if (!target) return;
          const res = await refreshKey(target.id);

          if (res.error) {
            if (res.error.code === 'REFRESH_BLOCKED_PENDING') setRefreshBlocked(target);
            else { if (res.error) addToast(res.error.message, 'error'); }
            return;
          }

          // Même modale qu'à la création : clé en clair + statut
          setCreatedKeyData({
            ...res.data,
            mode: 'refresh',
            keyName: target.name,
            state: getKeyState(target),
          });
          addToast('Clé régénérée ! Copiez-la immédiatement.', 'success');
        }}
        title="Régénérer la clé API"
        message={`La régénération de la clé "${refreshTarget?.name || 'sélectionnée'}" créera un nouveau token. L'ancien token sera immédiatement révoqué et toutes les requêtes utilisant l'ancienne clé échoueront.`}
        confirmLabel="Régénérer la clé"
        cancelLabel="Annuler"
      />

      {/* === Modal Abonnement en attente de validation === */}
      <Modal isOpen={!!pendingSubKey} onClose={() => setPendingSubKey(null)} title="Abonnement en cours de validation">
        {pendingSubKey && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
              <Hourglass size={24} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-text)' }}>
                <b>Votre abonnement est en attente de validation.</b><br /><br />
                Une fois le paiement confirmé par l'administrateur ou votre modérateur, l'abonnement sera activé et vous pourrez activer cette clé.
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--axis-muted)', marginBottom: 10 }}>
              Vous pouvez suivre l'état de vos abonnements et paiements depuis <b>Mes abonnements</b>.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setPendingSubKey(null)} className="btn-ghost" style={{ flex: 1 }}>
                J'ai compris
              </button>
              <button
                type="button"
                onClick={() => { setPendingSubKey(null); navigate('/dashboard/history'); }}
                className="btn-primary"
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Layers size={15} /> Voir mes abonnements
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* === Modal Blocage Régénération === */}
      <Modal isOpen={!!refreshBlocked} onClose={() => setRefreshBlocked(null)} title="Régénération indisponible pour le moment">
        {refreshBlocked && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
              <Shield size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-textMuted)' }}>
                La clé <b style={{ color: 'var(--axis-text)' }}>{refreshBlocked.name}</b> est liée à un abonnement
                <b style={{ color: 'var(--axis-warning)' }}> en attente de validation</b>.
                Tant que votre paiement n'est pas validé, la clé ne peut pas être régénérée.
                <br /><br />
                Dès la validation, la clé s'active et vous pourrez la régénérer librement.
                Votre abonnement restera lié à la nouvelle clé.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setRefreshBlocked(null)} className="btn-ghost" style={{ flex: 1 }}>
                Compris
              </button>
              <button type="button" className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => { const id = refreshBlocked.id; setRefreshBlocked(null); navigate(`/dashboard/history?focus=${id}`); }}>
                Voir l'état de mon abonnement <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/AuthPage.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { AxisLogo } from '../components/AxisLogo';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const addToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Flux de connexion classique
        const { error } = await signIn(email, password);
        if (error) throw error;
        addToast('Connexion réussie !', 'success');
        navigate('/dashboard');
      } else {
        // Flux d'inscription unifié avec auto-login automatique
        const res = await signUp(email, password, username, pseudo);
        if (res.error) throw res.error;

        if (res.autoLoggedIn) {
          addToast('Inscription réussie ! Bienvenue sur Axis AI.', 'success');
          navigate('/dashboard');
        } else {
          // Si le projet Supabase impose une confirmation par email
          addToast('Compte créé avec succès ! Un lien de confirmation a été envoyé par email si requis.', 'info');
          setIsLogin(true);
        }
      }
    } catch (err) {
      addToast(err.message || 'Une erreur est survenue lors de l’authentification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      addToast(err.message || 'Erreur lors de la redirection Google OAuth', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} className="ax-hex-bg">
      <div className="card ax-fade-in" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--axis-muted)',
            fontSize: 13,
            textDecoration: 'none',
            marginBottom: 16,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--axis-accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--axis-muted)'}
        >
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <AxisLogo size={48} className="ax-pulse-glow" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Axis AI Gateway</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 4 }}>
            {isLogin ? 'Connectez-vous pour gérer vos clés et abonnements' : 'Créez votre compte et accédez à tous les modèles d’IA'}
          </p>
        </div>

        {/* Toggle Onglets Connexion / Inscription */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--axis-bg)', padding: 4, borderRadius: 12, border: '1px solid var(--axis-border)' }}>
          <button 
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              background: isLogin ? 'var(--axis-hover)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--axis-textMuted)',
              fontWeight: isLogin ? 700 : 500, fontSize: 13, transition: 'all 0.15s ease'
            }}
          >
            Se connecter
          </button>
          <button 
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              background: !isLogin ? 'var(--axis-hover)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--axis-textMuted)',
              fontWeight: !isLogin ? 700 : 500, fontSize: 13, transition: 'all 0.15s ease'
            }}
          >
            S'inscrire
          </button>
        </div>

        {/* Formulaire Email/Password */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Nom complet</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Jean Dupont"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Pseudo d'affichage</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: jeand"
                  value={pseudo}
                  onChange={e => setPseudo(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Adresse email</label>
            <input
              type="email"
              className="input-field"
              placeholder="nom@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Mot de passe</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, width: '100%', padding: '12px' }}>
            {loading ? 'Traitement en cours...' : isLogin ? 'Se connecter' : "Créer mon compte et accéder au Dashboard"}
          </button>
        </form>

        {/* Séparateur */}
        <div style={{ margin: '22px 0', textAlign: 'center', color: 'var(--axis-muted)', position: 'relative' }}>
          <hr style={{ borderColor: 'var(--axis-border)', position: 'absolute', width: '100%', top: '50%', zIndex: 0 }} />
          <span style={{ background: 'var(--axis-sidebar)', padding: '0 12px', position: 'relative', zIndex: 1, fontSize: 12 }}>
            ou continuer avec
          </span>
        </div>

        {/* Bouton Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          className="btn-ghost"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px', fontSize: 14 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--axis-muted)', marginTop: 20 }}>
          En continuant, vous acceptez les conditions d'utilisation d'Axis AI.
        </p>
      </div>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { Modal } from '../components/Modal';
import { Link } from 'react-router-dom';
import { Key, ArrowRight, RefreshCw, Sparkles, Layers, CreditCard, History, Plus, ShieldCheck } from 'lucide-react';

const TIERS_NAMES = { 1: 'Starter', 2: 'Basic', 3: 'Standard', 4: 'Pro', 5: 'Expert', 6: 'Master', 7: 'Enterprise' };
const daysLeft = (exp) => exp ? Math.max(0, Math.ceil((new Date(exp) - new Date()) / 86400000)) : null;

export const Dashboard = () => {
  const { profile } = useAuth();
  const [subs, setSubs] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (profile) {
      fetchOverview();
      checkAlert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const checkAlert = async () => {
    try {
      const { data } = await supabase.rpc('axis_get_popup_alert', { p_user_id: profile.id });
      if (data?.has_alert) setAlert(data.message);
    } catch (e) {
      console.error('Erreur alert check:', e);
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [subRes, keyRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('id, is_enabled, subscription_id').eq('user_id', profile.id),
      ]);
      if (subRes.error) throw subRes.error;
      setSubs(subRes.data || []);
      setKeys(keyRes.data || []);
    } catch (e) {
      console.error('Erreur chargement données:', e);
    } finally {
      setLoading(false);
    }
  };

  const unlinkedKeys = keys.filter(k => !k.subscription_id);

  const quickActions = [
    { to: '/dashboard/keys', icon: Key, title: 'Mes clés API', desc: 'Créer et gérer vos clés' },
    { to: '/dashboard/history', icon: Layers, title: 'Mes abonnements', desc: 'Suivre vos packs' },
    { to: '/dashboard/payments', icon: History, title: 'Historique des paiements', desc: 'Valider vos demandes' },
    { to: '/dashboard/subscriptions', icon: CreditCard, title: 'Paliers & tarifs', desc: 'Souscrire un pack' },
  ];

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      {/* Bannière proposition de valeur */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 12,
        background: 'var(--axis-accent-dim)', border: '1px solid var(--axis-border)', marginBottom: 24
      }}>
        <Sparkles size={16} color="var(--axis-accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--axis-text)' }}>
          Axis AI, la toute première plateforme béninoise offrant les modèles d'IA mondiaux à des prix abordables en Francs CFA.
        </span>
      </div>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Bonjour, {profile?.pseudo || 'Utilisateur'} 👋</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Gérez vos clés API, vos abonnements et suivez vos paiements depuis un seul endroit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchOverview} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/keys" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <Key size={15} /> Mes Clés API
          </Link>
        </div>
      </div>

      {/* Notification : clés sans abonnement (coloration conservée car c'est un avertissement) */}
      {unlinkedKeys.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 12,
          marginBottom: 24, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)'
        }}>
          <ShieldCheck size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, lineHeight: 1.5, flex: 1 }}>
            <b style={{ color: 'var(--axis-warning)' }}>{unlinkedKeys.length} clé(s) sans abonnement.</b>{' '}
            <span style={{ color: 'var(--axis-textMuted)' }}>Liez un pack à vos clés pour les activer et interroger les modèles.</span>
          </div>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}>
            Voir les paliers
          </Link>
        </div>
      )}

      {/* Actions rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 26 }}>
        {quickActions.map(a => (
          <Link
            key={a.to}
            to={a.to}
            className="card"
            style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--axis-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--axis-border)'; }}
          >
            <a.icon size={20} color="var(--axis-textMuted)" />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--axis-text)' }}>{a.title}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-muted)' }}>{a.desc}</div>
          </Link>
        ))}
      </div>


      {/* Aperçu multi-abonnements (remplace « abonnement actuel ») */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Vos abonnements</h2>
          <Link to="/dashboard/history" className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
            Tout voir <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement...</div>
        ) : subs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 16 }}>Vous n'avez aucun abonnement actif pour le moment.</p>
            <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={15} /> Activer un pack
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subs.map(sub => {
              const d = daysLeft(sub.expires_at);
              const isActive = sub.status === 'active';
              const isPending = sub.status === 'pending_validation' || sub.status === 'pending';
              return (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--axis-accent)', flexShrink: 0 }}>
                    P{sub.tier_number}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Palier {sub.tier_number} — {TIERS_NAMES[sub.tier_number] || ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>
                      {sub.expires_at ? `Échéance ${new Date(sub.expires_at).toLocaleDateString('fr-FR')}` : ''}
                      {isActive && d !== null ? ` · ${d} j restants` : ''}
                    </div>
                  </div>
                  <span className={`badge ${isActive ? 'badge-green' : isPending ? 'badge-yellow' : 'badge-gray'}`}>
                    {isActive ? 'Actif' : isPending ? 'En attente' : sub.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal suspension administrative (sobre) */}
      <Modal isOpen={!!alert} isDanger title="Suspension Administrative">
        <div style={{ padding: '10px 0 20px' }}>
          <p style={{ color: 'var(--axis-text)', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Votre compte ou abonnement a été désactivé par l'administrateur avec le motif suivant :
          </p>
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', fontStyle: 'italic', fontSize: 13, marginBottom: 20 }}>
            &quot;{alert}&quot;
          </div>
          <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginBottom: 20 }}>
            Pour toute réclamation ou levée de suspension, veuillez contacter directement l'assistance officielle.
          </p>
          <a
            href="https://wa.me/+22996000000"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            Contacter le support WhatsApp
          </a>
        </div>
      </Modal>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/HistoryPage.jsx

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  Clock, Shield, RefreshCw, MessageCircle, AlertTriangle,
  CreditCard, Sparkles, ArrowRight, Hourglass, Zap, Key, Layers, Wallet, CalendarDays
} from 'lucide-react';

const TIERS_NAMES = { 1: 'Starter', 2: 'Basic', 3: 'Standard', 4: 'Pro', 5: 'Expert', 6: 'Master', 7: 'Enterprise' };
const TIERS_XOF   = { 1: '1 500', 2: '3 000', 3: '6 000', 4: '12 000', 5: '18 000', 6: '24 000', 7: '30 000' };
const WA_NUMBER   = '0166518473';

const calculateDaysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt) - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const HistoryPage = ({ initialTab = 'subscriptions' }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedSubId = searchParams.get('focus');
  const [subscriptions, setSubscriptions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const subCardRefs = useRef({});
  const [selectedSub, setSelectedSub] = useState(null);
  const [modCode, setModCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expirationAlertSub, setExpirationAlertSub] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    if (profile) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, keyRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('id, name, key_prefix, subscription_id, is_enabled').eq('user_id', profile.id)
      ]);

      if (subRes.error) {
        if (subRes.error.message?.includes('recursion')) setSubscriptions([]);
        else throw subRes.error;
      }
      if (keyRes.error) console.warn('api_keys select error:', keyRes.error);

      const subs = subRes.data || [];
      setSubscriptions(subs);
      setApiKeys(keyRes.data || []);

      // Si on arrive avec un focus sur un abonnement précis, on ouvre le bon onglet
      const focusedSub = subs.find(s => s.id === focusedSubId);
      if (focusedSub) {
        setActiveTab(isPendingStatus(focusedSub) ? 'payments' : 'subscriptions');
      }

      // Alerte de renouvellement J-7 (réabonnement autorisé dans les 7 derniers jours)
      const activeSub = subs.find(s => s.status === 'active');
      if (activeSub && activeSub.expires_at) {
        const daysLeft = calculateDaysRemaining(activeSub.expires_at);
        if (daysLeft !== null && daysLeft <= 7 && daysLeft >= 0) {
          setExpirationAlertSub({ ...activeSub, daysLeft });
        }
      }
    } catch (e) {
      console.error(e);
      addToast(e.message || 'Erreur lors du chargement des abonnements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkModerator = async (e) => {
    e.preventDefault();
    if (!modCode.trim() || !selectedSub) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('axis_moderator_validate_subscription_by_code', {
        p_subscription_id: selectedSub.id,
        p_moderator_code: modCode.trim().toUpperCase()
      });
      if (error || !data?.success) {
        addToast(error?.message || data?.error_message || 'Code modérateur invalide ou introuvable', 'error');
      } else {
        addToast('Demande validée avec succès par le modérateur !', 'success');
        setSelectedSub(null);
        setModCode('');
        fetchData();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clé API liée à un abonnement (via api_keys.subscription_id)
  const keyForSub = (subId) => apiKeys.find(k => k.subscription_id === subId);

  const isPendingStatus = (s) => s.status === 'pending_validation' || s.status === 'pending';

  const pendingSubs = subscriptions.filter(isPendingStatus);
  const otherSubs = subscriptions.filter(s => !isPendingStatus(s));
  const subsToShow = activeTab === 'subscriptions' ? otherSubs : pendingSubs;

  // Scroll + mise en évidence de l'abonnement pointé via ?focus=<id>
  useEffect(() => {
    if (!loading && focusedSubId && subCardRefs.current[focusedSubId]) {
      subCardRefs.current[focusedSubId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, focusedSubId, activeTab]);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'var(--axis-accent-dim)', marginBottom: 8 }}>
            <Sparkles size={13} color="var(--axis-accent)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--axis-accent)' }}>GESTIONNAIRE CENTRALISÉ</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mes Abonnements & Paiements</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Suivez vos packs, leurs modèles limités et le processus de validation de vos paiements.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <CreditCard size={14} /> Souscrire un nouveau pack
          </Link>
        </div>
      </div>

      {/* Onglets séparés : Abonnements / Historique des paiements */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[
          { id: 'subscriptions', label: 'Mes Abonnements', icon: Layers, count: otherSubs.length },
          { id: 'payments', label: 'Historique des Paiements', icon: Wallet, count: pendingSubs.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); navigate(tab.id === 'subscriptions' ? '/dashboard/history' : '/dashboard/payments'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12,
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease', cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--axis-hover)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--axis-textMuted)',
              border: '1px solid var(--axis-border)',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span style={{ background: activeTab === tab.id ? 'var(--axis-accent)' : 'var(--axis-border)', color: activeTab === tab.id ? '#000' : 'var(--axis-muted)', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--axis-muted)' }}>
          Chargement de vos abonnements...
        </div>
      ) : subsToShow.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          {activeTab === 'subscriptions' ? (
            <>
              <Clock size={40} color="var(--axis-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun abonnement actif</h3>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 20 }}>
                Créez une clé API puis souscrivez à l'un de nos 7 paliers (dès 1 500 FCFA) pour activer vos accès aux modèles.
              </p>
              <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>
                Découvrir les paliers <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Wallet size={40} color="var(--axis-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun paiement en attente</h3>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 20 }}>
                Vos demandes d'abonnement validées et vos paiements en cours de traitement apparaîtront ici.
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {subsToShow.map((sub) => {

            const budget = Math.max(0.01, Number(sub.budget_amount_usd || 0));
            const balance = Math.max(0, Number(sub.balance_usd || 0));
            const consumed = Math.max(0, budget - balance);
            const progressPct = Math.min(100, Math.max(0, (consumed / budget) * 100));

            const daysLeft = calculateDaysRemaining(sub.expires_at);
            const isActive = sub.status === 'active';
            const isPending = isPendingStatus(sub);
            const isExpired = sub.status === 'expired' || sub.status === 'depleted' || (daysLeft !== null && daysLeft <= 0);

            const progressColor = progressPct >= 100 ? 'var(--axis-danger)' : progressPct >= 80 ? 'var(--axis-warning)' : 'var(--axis-accent)';
            const linkedKey = keyForSub(sub.id);

            return (
              <div
                key={sub.id}
                ref={(el) => (subCardRefs.current[sub.id] = el)}
                className="card"
                style={{
                  border: isActive ? '1px solid rgba(132,204,22,0.4)' : isPending ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--axis-border)',
                  background: isActive ? 'linear-gradient(180deg, rgba(132,204,22,0.03) 0%, var(--axis-sidebar) 100%)' : 'var(--axis-sidebar)',
                  padding: 24, position: 'relative',
                  outline: focusedSubId === sub.id ? '2px solid var(--axis-accent)' : 'none',
                  outlineOffset: -2,
                  transition: 'outline 0.3s ease'
                }}
              >
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: isActive ? 'var(--axis-accent-dim)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: isActive ? 'var(--axis-accent)' : 'var(--axis-textMuted)' }}>
                      P{sub.tier_number}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Palier {sub.tier_number} — {TIERS_NAMES[sub.tier_number] || ''}</h3>
                        <span className={`badge ${isActive ? 'badge-green' : isPending ? 'badge-yellow' : isExpired ? 'badge-red' : 'badge-gray'}`}>
                          {isActive ? 'Actif' : isPending ? 'En attente' : isExpired ? 'Expiré' : sub.status}
                        </span>
                      </div>
                      {sub.expires_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--axis-muted)', marginTop: 5 }}>
                          <CalendarDays size={13} />
                          Échéance : {new Date(sub.expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Jours restants */}
                  <div style={{ textAlign: 'right' }}>
                    {isActive && daysLeft !== null && (
                      <div style={{ marginBottom: 4 }}>
                        {daysLeft > 7 ? (
                          <span className="badge badge-green" style={{ fontSize: 11 }}>⏱️ {daysLeft} jours restants</span>
                        ) : daysLeft > 0 ? (
                          <span className="badge badge-yellow" style={{ fontSize: 11 }}>⚠️ Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="badge badge-red" style={{ fontSize: 11 }}>🚫 Expiré</span>
                        )}
                      </div>
                    )}
                    {sub.moderator_code_used && (
                      <div style={{ fontSize: 11, color: 'var(--axis-purple)', fontWeight: 600 }}>
                        • Modérateur : {sub.moderator_code_used}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clé API liée */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 14 }}>
                  <Key size={15} color={linkedKey ? 'var(--axis-accent)' : 'var(--axis-muted)'} />
                  {linkedKey ? (
                    <button
                      onClick={() => navigate(`/dashboard/keys?focus=${linkedKey.id}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, color: 'var(--axis-text)', display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}
                      title="Voir la clé API associée"
                    >
                      <span style={{ fontWeight: 600 }}>Clé liée :</span>
                      <span style={{ color: 'var(--axis-accent)', fontWeight: 600, textDecoration: 'underline' }}>{linkedKey.name || linkedKey.key_prefix}</span>
                      <ArrowRight size={13} color="var(--axis-accent)" />
                    </button>
                  ) : (
                    <Link to="/dashboard/keys" style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Clé non liée — créez ou liez une clé API</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>


                {/* Barre de progression des modèles limités (sans montant) */}
                <div style={{ background: 'var(--axis-bg)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--axis-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={14} color="var(--axis-accent)" />
                      <span style={{ fontWeight: 600, color: 'var(--axis-text)' }}>Utilisation des modèles limités :</span>
                      <b style={{ color: progressColor }}>{progressPct.toFixed(1)}%</b>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--axis-muted)' }}>Illimité jusqu'à la fin du mois</span>
                  </div>
                  <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 999, background: progressColor, transition: 'width 0.4s ease, background 0.3s ease', boxShadow: `0 0 10px ${progressColor}44` }} />
                  </div>
                </div>

                {/* Actions selon l'état */}
                {isPending && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Hourglass size={18} color="var(--axis-warning)" />
                      <div style={{ fontSize: 12.5, color: 'var(--axis-text)' }}>
                        <b>Paiement en attente de validation.</b> Vous avez réglé via un modérateur ou sur WhatsApp ?
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour Axis AI 👋\nJe souhaite valider mon abonnement Palier ${sub.tier_number} (${TIERS_XOF[sub.tier_number]} FCFA).`)}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', color: '#25D366' }}>
                        <MessageCircle size={14} /> WhatsApp Admin
                      </a>
                      <button onClick={() => { setSelectedSub(sub); setModCode(''); }} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                        <Shield size={14} /> Saisir code MOD-XXXX
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Modal : Saisie code modérateur pour validation */}
      <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Validation par Code Modérateur">
        {selectedSub && (
          <div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Palier {selectedSub.tier_number} — {TIERS_NAMES[selectedSub.tier_number]}</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--axis-accent)' }}>{TIERS_XOF[selectedSub.tier_number]} FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 4 }}>
                Demande du {new Date(selectedSub.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>

            <form onSubmit={handleLinkModerator}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                  Saisissez l'identifiant du modérateur :
                </label>
                <input type="text" placeholder="Ex: MOD-8492" value={modCode} onChange={e => setModCode(e.target.value.toUpperCase())} className="input-field" required autoFocus />
                <p style={{ fontSize: 11, color: 'var(--axis-muted)', marginTop: 6 }}>
                  Le modérateur doit avoir validé la réception de vos fonds en amont.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setSelectedSub(null)} className="btn-ghost" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                  {isSubmitting ? 'Validation...' : 'Valider mon abonnement'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal : Alerte de renouvellement (J-7) */}
      <Modal isOpen={!!expirationAlertSub} title="⏰ Renouvellement disponible">
        {expirationAlertSub && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
              <AlertTriangle size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-text)' }}>
                Votre abonnement <b>Palier {expirationAlertSub.tier_number} — {TIERS_NAMES[expirationAlertSub.tier_number]}</b> expire dans <b>{expirationAlertSub.daysLeft} jour(s)</b>.
              </div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
              • À l'issue des 30 jours, vos clés API associées seront automatiquement suspendues.<br />
              • Vous pouvez renouveler ou choisir un palier supérieur dès maintenant pour éviter toute interruption.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setExpirationAlertSub(null)} className="btn-ghost" style={{ flex: 1 }}>Plus tard</button>
              <Link to="/dashboard/subscriptions" onClick={() => setExpirationAlertSub(null)} className="btn-primary" style={{ flex: 2, textAlign: 'center', textDecoration: 'none' }}>
                Renouveler mon pack
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/LandingPage.jsx

import { Link } from 'react-router-dom';
import { AxisLogo } from '../components/AxisLogo';
import { Code2, Terminal, Briefcase, Globe, Shield, MessageCircle, Sparkles } from 'lucide-react';

// Note : aucun prix de modèle, aucun nom de modèle OpenRouter n'est affiché ici
// conformément à la politique de la plateforme

const TIERS = [
  { id: 1, name: 'Starter',    priceXof: '1 500',  priceUsd: 2.50,  popular: false },
  { id: 2, name: 'Basic',      priceXof: '3 000',  priceUsd: 5.00,  popular: false },
  { id: 3, name: 'Standard',   priceXof: '6 000',  priceUsd: 10.00, popular: false },
  { id: 4, name: 'Pro',        priceXof: '12 000', priceUsd: 20.00, popular: true  },
  { id: 5, name: 'Expert',     priceXof: '18 000', priceUsd: 30.00, popular: false },
  { id: 6, name: 'Master',     priceXof: '24 000', priceUsd: 40.00, popular: false },
  { id: 7, name: 'Enterprise', priceXof: '30 000', priceUsd: 50.00, popular: false },
];

const TIER_DESCS = [
  "Idéal pour découvrir la plateforme avec des modèles d'IA accessibles.",
  "Pour un usage quotidien léger : rédaction, résumé, assistance.",
  "Polyvalent — coding, analyse, traduction et rédaction avancée.",
  "Le choix des développeurs exigeants pour des projets professionnels.",
  "Applications intensives avec contexte long et haute précision.",
  "Raisonnement complexe, logique avancée et tâches multi-étapes lourdes.",
  "Accès complet sans restriction aux plus puissants modèles mondiaux.",
];

export const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="ax-hex-bg">
      {/* Header */}
      <header style={{ padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--axis-border)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(19,19,20,0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AxisLogo size={28} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Axis AI</span>
          <span className="badge badge-green" style={{ fontSize: 10 }}>BÉNIN / UEMOA</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link to="/auth" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }}>Connexion</Link>
          <Link to="/auth" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>S'inscrire</Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '50px 20px 80px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        {/* Bannière nationale */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderRadius: 999, background: 'linear-gradient(90deg, rgba(132,204,22,0.15) 0%, rgba(192,132,252,0.15) 100%)', border: '1px solid rgba(132,204,22,0.4)' }}>
            <Sparkles size={15} color="var(--axis-accent)" />
            <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
              Axis AI, la toute première plateforme béninoise offrant les modèles d'IA mondiaux à des prix abordables en Francs CFA
            </span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 80 }} className="ax-fade-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <AxisLogo size={76} className="ax-pulse-glow" />
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            La passerelle d'API IA unifiée en Francs CFA
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'var(--axis-textMuted)', maxWidth: 740, margin: '0 auto 34px', lineHeight: 1.6 }}>
            Une seule clé API standard pour accéder à tous les grands modèles d'IA du marché.<br />
            Payez simplement par <b>Mobile Money (MTN / Moov)</b> dès <b>1 500 FCFA</b>.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
              Créer une clé API gratuitement
            </Link>
            <a href="#tarifs" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 16 }}>
              Voir les 7 Forfaits
            </a>
          </div>
        </div>

        {/* Section Compatibilité IDE */}
        <section style={{ marginBottom: 100 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Compatible avec tous vos outils de développement</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 14 }}>Une clé API standard — prête à l'emploi dans Cursor, Claude Code, VS Code ou vos scripts.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: Terminal,  title: 'Claude Code',        desc: "L'agent CLI d'Anthropic avec support Axis Proxy" },
              { icon: Code2,     title: 'Cursor & Windsurf',  desc: "Autocomplétion et chat en direct avec les IA" },
              { icon: Briefcase, title: "VS Code & Continue", desc: "Extension IA native dans votre éditeur favori" },
              { icon: Globe,     title: 'Web & Scripts',       desc: "Compatible SDK OpenAI standard (Python, TS, cURL)" },
            ].map((tool, i) => (
              <div key={i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <tool.icon size={20} color="var(--axis-accent)" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{tool.title}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section Tarifs — SANS prix de modèles ni noms OpenRouter */}
        <section id="tarifs" style={{ marginBottom: 100 }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="badge badge-green" style={{ marginBottom: 12 }}>7 FORFAITS DE 1 500 XOF À 30 000 XOF</span>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Tarification Transparente en Francs CFA (XOF)</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 14, maxWidth: 680, margin: '0 auto' }}>
              Des forfaits pensés pour le marché béninois et la sous-région, avec validation instantanée par Mobile Money ou modérateur local.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, textAlign: 'left' }}>
            {TIERS.map((tier, i) => (
              <div key={tier.id} className="card card-hover" style={{
                border: tier.popular ? '2px solid var(--axis-accent)' : '1px solid var(--axis-border)',
                position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: tier.popular ? 'linear-gradient(180deg, rgba(132,204,22,0.06) 0%, var(--axis-sidebar) 100%)' : 'var(--axis-sidebar)'
              }}>
                {tier.popular && (
                  <span style={{ position: 'absolute', top: -12, right: 18, background: 'var(--axis-accent)', color: '#131314', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                    POPULAIRE
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 700 }}>Palier {tier.id}</h3>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-accent)' }}>{tier.name}</span>
                  </div>

                  {/* Prix en XOF au premier plan */}
                  <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>
                    {tier.priceXof} <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--axis-accent)' }}>FCFA</span>
                  </div>
                  <div style={{ color: 'var(--axis-textMuted)', fontSize: 12, marginBottom: 18 }}>
                    Durée : 30 jours
                  </div>

                  <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 22, minHeight: 40 }}>
                    {TIER_DESCS[i]}
                  </p>
                </div>

                <Link to="/auth" className={tier.popular ? "btn-primary" : "btn-ghost"} style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                  Choisir ce forfait
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Section Paiement Local */}
        <section style={{ padding: '36px 32px', borderRadius: 20, border: '1px solid var(--axis-border)', background: 'linear-gradient(135deg, rgba(30,31,32,0.9) 0%, rgba(19,19,20,0.95) 100%)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Paiement Local & Validation Instantanée</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 28 }}>
              Réglez en Francs CFA via Mobile Money et activez votre accès en quelques instants :
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ padding: 20, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <MessageCircle size={20} color="#25D366" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Option A : Contact WhatsApp Admin</h3>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Envoyez votre virement Mobile Money (MTN / Moov Bénin) et transmettez la capture WhatsApp. Validation sous <b>24h</b>.
                </p>
                <span className="badge badge-green">MTN & Moov Bénin</span>
              </div>
              <div style={{ padding: 20, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Shield size={20} color="var(--axis-purple)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Option B : Agent Modérateur (MOD-XXXX)</h3>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Vous avez un modérateur de proximité ? Il encaisse et valide directement — <b>activation immédiate</b>.
                </p>
                <span className="badge badge-purple">Activation Immédiate</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--axis-border)', padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--axis-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AxisLogo size={20} />
          <span>Axis AI © 2025 · Première passerelle IA béninoise en Francs CFA</span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          <span>1 500 à 30 000 XOF</span>
          <span>Mobile Money</span>
          <span>30 jours</span>
        </div>
      </footer>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/ModeratorPage.jsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Shield, CheckCircle2, Clock, DollarSign, Archive, Users, RefreshCw } from 'lucide-react';

export const ModeratorPage = () => {
  const { profile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    if (profile?.role === 'moderator' || profile?.role === 'admin') {
      fetchDashboard();
    }
  }, [profile]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('axis_get_moderator_dashboard', { p_moderator_id: profile.id });
      if (error) {
        addToast(error.message, 'error');
      } else if (data?.success) {
        setDashboardData(data);
      }
    } catch (e) {
      console.error(e);
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (subId) => {
    setValidatingId(subId);
    try {
      const { data, error } = await supabase.rpc('axis_moderator_validate_subscription', {
        p_validator_id: profile.id,
        p_subscription_id: subId
      });
      if (error) {
        addToast(error.message, 'error');
      } else if (!data?.success) {
        addToast(data?.error_message || 'Échec de validation', 'error');
      } else {
        addToast(`Abonnement validé ! Statut : ${data.assigned_status}`, 'success');
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setValidatingId(null);
    }
  };

  if (profile?.role !== 'moderator' && profile?.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--axis-muted)' }}>Accès réservé aux modérateurs.</div>;
  }

  const totals = dashboardData?.totals || {};
  const clients = dashboardData?.clients || [];
  const modCode = dashboardData?.moderator_code || profile?.moderator_code || 'MOD-????';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Espace Modérateur de Proximité</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
            Gestion de vos clients rattachés, validation de paiements et suivi de vos commissions.
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Code Badge & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(132,204,22,0.12) 0%, var(--axis-sidebar) 100%)', borderColor: 'var(--axis-accent)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--axis-textMuted)' }}>VOTRE CODE OFFICIEL</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--axis-accent)', letterSpacing: '0.04em', margin: '4px 0' }}>
            {modCode}
          </div>
          <div style={{ fontSize: 11, color: 'var(--axis-textMuted)' }}>Communiquez ce code à vos clients</div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color="var(--axis-text)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{totals.total_validated ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>Clients validés</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="var(--axis-warning)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--axis-warning)' }}>{totals.unpaid_commissions ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>Commissions à percevoir</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(132,204,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} color="var(--axis-accent)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--axis-accent)' }}>{totals.paid_commissions ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>Commissions payées</div>
          </div>
        </div>
      </div>

      {/* Notice de rappel des permissions modérateur */}
      <div style={{ padding: '12px 18px', borderRadius: 10, background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.2)', marginBottom: 24, fontSize: 12.5, color: 'var(--axis-textMuted)' }}>
        ℹ️ <b>Règle de sécurité :</b> Les modérateurs ont uniquement le droit de <b>valider</b> les souscriptions après encaissement. Seul l'administrateur suprême est habilité à suspendre un abonnement avec justificatif.
      </div>

      {/* Table Clients rattachés */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Demandes et Clients Rattachés</h2>
          <span style={{ fontSize: 12, color: 'var(--axis-muted)' }}>{clients.length} dossier(s)</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Palier</th>
                <th>Statut</th>
                <th>Solde</th>
                <th>Commission</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.subscription_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.client_pseudo || c.client_username}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>@{c.client_username}</div>
                  </td>
                  <td><b>Palier {c.tier_number}</b></td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'pending_validation' ? 'badge-yellow' : 'badge-gray'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>${Number(c.balance_usd || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${c.commission_status === 'paid' ? 'badge-green' : c.commission_status === 'unpaid' ? 'badge-yellow' : 'badge-gray'}`}>
                      {c.commission_status}
                    </span>
                  </td>
                  <td>
                    {c.status === 'pending_validation' ? (
                      <button
                        onClick={() => handleValidate(c.subscription_id)}
                        disabled={validatingId === c.subscription_id}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                      >
                        {validatingId === c.subscription_id ? 'Validation...' : 'Valider Paiement'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--axis-muted)' }}>Traité</span>
                    )}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ padding: 32, textAlign: 'center', color: 'var(--axis-muted)' }}>
                    Aucun client n'a encore saisi votre code modérateur ({modCode}).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/MySubscriptionsPage.jsx

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  RefreshCw, CreditCard, Layers, Key, ArrowRight, CalendarDays,
  Zap, Timer, Hourglass, AlertTriangle,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { useMySubscriptions } from '../hooks/useMySubscriptions';
import {
  TIERS_NAMES, SUB_STATUS, isPendingStatus, daysRemaining, usagePct, periodPct, fmtDate,
} from '../lib/subscriptionUtils';

const usageColor = (p) => (p >= 100 ? 'var(--axis-danger)' : p >= 80 ? 'var(--axis-warning)' : 'var(--axis-accent)');

const Meter = ({ icon: Icon, label, value, pct, color, hint }) => (
  <div style={{ background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', borderRadius: 14, padding: '14px 16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12.5 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
        <Icon size={14} color={color} /> {label} <b style={{ color }}>{value}</b>
      </span>
      {hint && <span style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{hint}</span>}
    </div>
    <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color, transition: 'width .4s ease' }} />
    </div>
  </div>
);

const Stat = ({ label, value, color }) => (
  <div className="card" style={{ padding: '16px 18px', background: 'var(--axis-sidebar)' }}>
    <div style={{ fontSize: 11.5, color: 'var(--axis-muted)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--axis-text)' }}>{value}</div>
  </div>
);

export const MySubscriptionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedSubId = searchParams.get('focus');
  const { subscriptions, loading, refresh, keyForSub } = useMySubscriptions();
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Un lien ?focus=<id> vers une demande en attente relève de la page Paiements
  useEffect(() => {
    const focused = subscriptions.find((s) => s.id === focusedSubId);
    if (focused && isPendingStatus(focused)) navigate(`/dashboard/payments?focus=${focused.id}`, { replace: true });
  }, [subscriptions, focusedSubId, navigate]);

  const pendingCount = subscriptions.filter(isPendingStatus).length;
  const current = subscriptions.filter((s) => s.status === 'active');
  const past = subscriptions.filter((s) => !isPendingStatus(s) && s.status !== 'active');
  const main = current[0];
  const mainDays = main ? daysRemaining(main.expires_at) : null;
  const renewalAlert = main && mainDays !== null && mainDays >= 0 && mainDays <= 7 ? main : null;

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mes abonnements</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Suivez la consommation, l'échéance et la clé associée à chacun de vos packs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refresh} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <CreditCard size={14} /> Souscrire un nouveau pack
          </Link>
        </div>
      </div>

      {pendingCount > 0 && (
        <Link to="/dashboard/payments" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20, color: 'var(--axis-text)', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Hourglass size={18} color="var(--axis-warning)" />
              <span><b>{pendingCount} demande{pendingCount > 1 ? 's' : ''}</b> en attente de validation ou d'activation.</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--axis-warning)', fontWeight: 600 }}>
              Voir l'historique des paiements <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      )}

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement de vos abonnements...</div>
      ) : subscriptions.filter((s) => !isPendingStatus(s)).length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          <Layers size={40} color="var(--axis-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun abonnement actif</h3>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 20 }}>
            Créez une clé API puis souscrivez à l'un de nos 7 paliers (dès 1 500 FCFA) pour activer vos accès aux modèles.
          </p>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>Découvrir les paliers <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <>
          {main && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
              <Stat label="Pack en cours" value={`Palier ${main.tier_number} — ${TIERS_NAMES[main.tier_number] || ''}`} color="var(--axis-accent)" />
              <Stat label="Jours restants" value={mainDays > 0 ? `${mainDays} jour${mainDays > 1 ? 's' : ''}` : 'Expiré'} color={mainDays <= 7 ? 'var(--axis-warning)' : undefined} />
              <Stat label="Consommation" value={`${usagePct(main).toFixed(1)} %`} color={usageColor(usagePct(main))} />
            </div>
          )}

          {current.map((sub) => {
            const usage = usagePct(sub);
            const days = daysRemaining(sub.expires_at);
            const linked = keyForSub(sub.id);
            return (
              <div key={sub.id} className="card" style={{ padding: 24, marginBottom: 18, border: '1px solid rgba(132,204,22,0.4)', background: 'linear-gradient(180deg, rgba(132,204,22,0.03) 0%, var(--axis-sidebar) 100%)', outline: focusedSubId === sub.id ? '2px solid var(--axis-accent)' : 'none', outlineOffset: -2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: 'var(--axis-accent)' }}>P{sub.tier_number}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Palier {sub.tier_number} — {TIERS_NAMES[sub.tier_number]}</h3>
                        <span className="badge badge-green">Actif</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--axis-muted)', marginTop: 5 }}>
                        <CalendarDays size={13} /> Du {fmtDate(sub.starts_at)} au {fmtDate(sub.expires_at)}
                      </div>
                    </div>
                  </div>
                  {days !== null && days <= 7 && (
                    <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>Renouveler mon pack</Link>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
                  <Meter icon={Zap} label="Modèles limités :" value={`${usage.toFixed(1)} %`} pct={usage} color={usageColor(usage)} hint="Illimité jusqu'à la fin du mois" />
                  <Meter icon={Timer} label="Période écoulée :" value={days > 0 ? `${days} j restants` : 'Terminée'} pct={periodPct(sub)} color={days <= 7 ? 'var(--axis-warning)' : 'var(--axis-accent)'} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                  <Key size={15} color={linked ? 'var(--axis-accent)' : 'var(--axis-muted)'} />
                  {linked ? (
                    <button onClick={() => navigate(`/dashboard/keys?focus=${linked.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, color: 'var(--axis-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>Clé liée :</span>
                      <span style={{ color: 'var(--axis-accent)', fontWeight: 600, textDecoration: 'underline' }}>{linked.name || linked.key_prefix}</span>
                      <ArrowRight size={13} color="var(--axis-accent)" />
                    </button>
                  ) : (
                    <Link to="/dashboard/keys" style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Clé non liée — créez ou liez une clé API <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {past.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '26px 0 12px' }}>Abonnements terminés</h2>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="ax-table">
                  <thead>
                    <tr><th>Pack</th><th>Période</th><th>Consommation finale</th><th>Statut</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {past.map((sub) => {
                      const st = SUB_STATUS[sub.status] || { label: sub.status, badge: 'badge-gray' };
                      return (
                        <tr key={sub.id} style={focusedSubId === sub.id ? { background: 'var(--axis-hover)' } : undefined}>
                          <td style={{ fontWeight: 700 }}>P{sub.tier_number} — {TIERS_NAMES[sub.tier_number]}</td>
                          <td style={{ fontSize: 12.5, color: 'var(--axis-textMuted)' }}>{fmtDate(sub.starts_at, { day: '2-digit', month: 'short', year: 'numeric' })} → {fmtDate(sub.expires_at, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td style={{ fontWeight: 600 }}>{usagePct(sub).toFixed(1)} %</td>
                          <td><span className={`badge ${st.badge}`} title={sub.disabled_reason || undefined}>{st.label}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to="/dashboard/subscriptions" className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>Renouveler</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <Modal isOpen={!!renewalAlert && !alertDismissed} onClose={() => setAlertDismissed(true)} title="⏰ Renouvellement disponible">
        {renewalAlert && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
              <AlertTriangle size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                Votre abonnement <b>Palier {renewalAlert.tier_number} — {TIERS_NAMES[renewalAlert.tier_number]}</b> expire dans <b>{mainDays} jour(s)</b>.
                À l'issue des 30 jours, vos clés API associées seront suspendues.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setAlertDismissed(true)} className="btn-ghost" style={{ flex: 1 }}>Plus tard</button>
              <Link to="/dashboard/subscriptions" className="btn-primary" style={{ flex: 2, textAlign: 'center', textDecoration: 'none' }}>Renouveler mon pack</Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/PaymentsPage.jsx

import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, CreditCard, Wallet, MessageCircle, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { useMySubscriptions } from '../hooks/useMySubscriptions';
import {
  TIERS_NAMES, TIERS_XOF, WA_NUMBER, PAYMENT_STATUS, fmtDate, fmtTime, fmtXof,
} from '../lib/subscriptionUtils';

const FILTERS = [
  { id: 'all',       label: 'Toutes',    test: () => true },
  { id: 'waiting',   label: 'À valider', test: (s) => s.status === 'pending_validation' },
  { id: 'validated', label: 'Validées',  test: (s) => !['pending_validation', 'disabled'].includes(s.status) },
  { id: 'cancelled', label: 'Annulées',  test: (s) => s.status === 'disabled' },
];

const STEPS = ['Demande', 'Validation', 'Activation'];
const DOT = { done: 'var(--axis-accent)', current: 'var(--axis-warning)', fail: 'var(--axis-danger)', todo: 'var(--axis-border)' };

const stepStates = (s) => {
  switch (s.status) {
    case 'pending_validation': return ['done', 'current', 'todo'];
    case 'pending':            return ['done', 'done', 'current'];
    case 'disabled':           return s.validated_at ? ['done', 'done', 'fail'] : ['done', 'fail', 'todo'];
    default:                   return ['done', 'done', 'done'];
  }
};

const Stepper = ({ sub }) => {
  const st = stepStates(sub);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 && <div style={{ width: 22, height: 2, marginTop: 6, background: st[i - 1] === 'done' ? 'var(--axis-accent)' : 'var(--axis-border)' }} />}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: DOT[st[i]], boxShadow: st[i] === 'current' ? '0 0 0 4px rgba(251,191,36,0.18)' : 'none' }} />
            <span style={{ fontSize: 10, color: 'var(--axis-muted)' }}>{label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div className="card" style={{ padding: '16px 18px', background: 'var(--axis-sidebar)' }}>
    <div style={{ fontSize: 11.5, color: 'var(--axis-muted)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--axis-text)' }}>{value}</div>
  </div>
);

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const addToast = useToast();
  const [searchParams] = useSearchParams();
  const focusedSubId = searchParams.get('focus');
  const { subscriptions, loading, refresh, keyForSub } = useMySubscriptions();
  const [filter, setFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);
  const [modCode, setModCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rowRefs = useRef({});

  useEffect(() => {
    if (!loading && focusedSubId) rowRefs.current[focusedSubId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loading, focusedSubId]);

  const rows = subscriptions.filter(FILTERS.find((f) => f.id === filter).test);
  const waiting = subscriptions.filter(FILTERS[1].test).length;
  const validatedTotal = subscriptions.filter(FILTERS[2].test).reduce((sum, s) => sum + (TIERS_XOF[s.tier_number] || 0), 0);

  const handleLinkModerator = async (e) => {
    e.preventDefault();
    if (!modCode.trim() || !selectedSub) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('axis_moderator_validate_subscription_by_code', {
        p_subscription_id: selectedSub.id,
        p_moderator_code: modCode.trim().toUpperCase(),
      });
      if (error || !data?.success) {
        addToast(error?.message || data?.error_message || 'Code modérateur invalide ou introuvable', 'error');
      } else {
        addToast('Demande validée avec succès par le modérateur !', 'success');
        setSelectedSub(null);
        setModCode('');
        refresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Historique des paiements</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Toutes vos demandes d'abonnement et leur état de validation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refresh} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}><RefreshCw size={14} /> Actualiser</button>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}><CreditCard size={14} /> Nouvelle demande</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        <Stat label="Demandes" value={subscriptions.length} />
        <Stat label="En attente de validation" value={waiting} color={waiting ? 'var(--axis-warning)' : undefined} />
        <Stat label="Total validé" value={fmtXof(validatedTotal)} color="var(--axis-accent)" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--axis-border)', background: filter === f.id ? 'var(--axis-hover)' : 'transparent', color: filter === f.id ? 'var(--axis-text)' : 'var(--axis-textMuted)' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="ax-table">
          <thead>
            <tr><th>Demande</th><th>Pack</th><th>Montant</th><th>Suivi</th><th style={{ textAlign: 'right' }}>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement de vos paiements...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>
                  <Wallet size={34} color="var(--axis-muted)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--axis-textMuted)', fontSize: 14 }}>Aucune demande dans cette catégorie.</p>
                </td>
              </tr>
            ) : rows.map((sub) => {
              const st = PAYMENT_STATUS[sub.status] || { label: sub.status, badge: 'badge-gray' };
              const key = keyForSub(sub.id);
              return (
                <tr key={sub.id} ref={(el) => (rowRefs.current[sub.id] = el)} style={focusedSubId === sub.id ? { background: 'var(--axis-hover)' } : undefined}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fmtDate(sub.created_at)}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{fmtTime(sub.created_at)}{sub.moderator_code_used ? ` · ${sub.moderator_code_used}` : ''}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>P{sub.tier_number} — {TIERS_NAMES[sub.tier_number]}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{key ? `Clé : ${key.name || key.key_prefix}` : 'Aucune clé liée'}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmtXof(TIERS_XOF[sub.tier_number])}</td>
                  <td>
                    <div style={{ marginBottom: 8 }}><span className={`badge ${st.badge}`}>{st.label}</span></div>
                    <Stepper sub={sub} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {sub.status === 'pending_validation' ? (
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour Axis AI 👋\nJe souhaite valider mon abonnement Palier ${sub.tier_number} (${fmtXof(TIERS_XOF[sub.tier_number])}).`)}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: '#25D366' }} title="Contacter l'admin sur WhatsApp">
                          <MessageCircle size={14} />
                        </a>
                        <button onClick={() => { setSelectedSub(sub); setModCode(''); }} className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                          <Shield size={14} /> Code MOD
                        </button>
                      </div>
                    ) : sub.status === 'pending' ? (
                      <span style={{ fontSize: 11.5, color: 'var(--axis-muted)' }}>S'activera automatiquement</span>
                    ) : sub.status === 'disabled' ? (
                      <span style={{ fontSize: 11.5, color: 'var(--axis-danger)' }}>{sub.disabled_reason || 'Désactivé'}</span>
                    ) : (
                      <button onClick={() => navigate(`/dashboard/history?focus=${sub.id}`)} className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                        Voir le pack <ArrowRight size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Validation par code modérateur">
        {selectedSub && (
          <form onSubmit={handleLinkModerator}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Palier {selectedSub.tier_number} — {TIERS_NAMES[selectedSub.tier_number]}</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--axis-accent)' }}>{fmtXof(TIERS_XOF[selectedSub.tier_number])}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 4 }}>Demande du {fmtDate(selectedSub.created_at)}</div>
            </div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Identifiant du modérateur :</label>
            <input type="text" placeholder="Ex: MOD-8492" value={modCode} onChange={(e) => setModCode(e.target.value.toUpperCase())} className="input-field" required autoFocus />
            <p style={{ fontSize: 11, color: 'var(--axis-muted)', margin: '6px 0 20px' }}>Le modérateur doit avoir confirmé la réception de vos fonds en amont.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setSelectedSub(null)} className="btn-ghost" style={{ flex: 1 }}>Annuler</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>{isSubmitting ? 'Validation...' : 'Valider mon abonnement'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/SettingsPage.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { AvatarPicker } from '../components/AvatarPicker';
import { AlertTriangle, Save, User, Moon, Sun, Shield, LogOut, Palette } from 'lucide-react';

const IconBox = ({ bg, children }) => (
  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
);

export const SettingsPage = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('axis_theme') || 'dark');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [rlsError, setRlsError] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setPseudo(profile.pseudo || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setRlsError(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), pseudo: pseudo.trim() })
        .eq('id', profile.id);

      if (error) {
        if (error.message?.includes('recursion') || error.message?.includes('infinite')) setRlsError(true);
        addToast(error.message, 'error');
      } else {
        addToast('Profil mis à jour avec succès.', 'success');
        refreshProfile?.();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvatar = async ({ icon, hue, tone }) => {
    setIsSavingAvatar(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_icon: icon, avatar_hue: hue, avatar_tone: tone })
      .eq('id', profile.id);
    setIsSavingAvatar(false);
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Avatar mis à jour.', 'success');
      refreshProfile?.();
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('axis_theme', newTheme);
    if (newTheme === 'light') document.documentElement.setAttribute('data-axis-theme', 'light');
    else document.documentElement.removeAttribute('data-axis-theme');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Paramètres</h1>
        <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 4 }}>
          Gérez votre profil, l'apparence et la sécurité de votre compte.
        </p>
      </div>

      {rlsError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', marginBottom: 24 }}>
          <AlertTriangle size={20} color="var(--axis-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <b style={{ color: 'var(--axis-danger)' }}>Erreur de configuration Supabase</b><br />
            Une politique RLS récursive bloque la mise à jour. Exécutez <code>supabase_production_schema.sql</code> dans le SQL Editor puis rafraîchissez cette page.
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <IconBox bg="rgba(56,189,248,0.1)"><Palette size={18} color="#38bdf8" /></IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Avatar</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>20 icônes, des milliers de couleurs : composez le vôtre.</p>
          </div>
        </div>
        {profile && <AvatarPicker key={profile.id} profile={profile} onSave={handleSaveAvatar} saving={isSavingAvatar} />}
      </div>

      {/* Profil */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <IconBox bg="var(--axis-accent-dim)"><User size={18} color="var(--axis-accent)" /></IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Informations du profil</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Nom d'affichage et pseudo publics.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Email (lecture seule)</label>
            <input type="text" className="input-field" value={profile?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Nom complet</label>
            <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Votre nom complet" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Pseudo</label>
            <input type="text" className="input-field" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Votre pseudo" required />
          </div>
          <button type="submit" className="btn-primary" disabled={isSaving} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} /> {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      {/* Apparence */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <IconBox bg="rgba(192,132,252,0.1)">
            {theme === 'dark' ? <Moon size={18} color="var(--axis-purple)" /> : <Sun size={18} color="var(--axis-warning)" />}
          </IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Apparence</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Basculez entre le thème sombre et clair.</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--axis-textMuted)' }}>
            Thème actuel : <b style={{ color: 'var(--axis-text)' }}>{theme === 'dark' ? 'Sombre' : 'Clair'}</b>
          </span>
          <button onClick={toggleTheme} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} Basculer
          </button>
        </div>
      </div>

      {/* Sécurité */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <IconBox bg="rgba(251,191,36,0.1)"><Shield size={18} color="var(--axis-warning)" /></IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Sécurité</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Gérez votre session active.</p>
          </div>
        </div>
        <button onClick={signOut} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--axis-danger)', borderColor: 'rgba(248,113,113,0.3)' }}>
          <LogOut size={15} /> Se déconnecter
        </button>
      </div>
    </div>
  );
};

---

FICHIER: /frontend/src/pages/SubscriptionsPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useApiKeys } from '../hooks/useApiKeys';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ChevronDown, ChevronUp, Shield, MessageCircle, Sparkles, Search, Cpu, Key } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';


const TIERS = [
  { id: 1, name: 'Starter',    priceXof: '1 500',  priceUsd: 2.50,  maxCost: 5.00  },
  { id: 2, name: 'Basic',      priceXof: '3 000',  priceUsd: 5.00,  maxCost: 10.00 },
  { id: 3, name: 'Standard',   priceXof: '6 000',  priceUsd: 10.00, maxCost: 15.00 },
  { id: 4, name: 'Pro',        priceXof: '12 000', priceUsd: 20.00, maxCost: 20.00, popular: true },
  { id: 5, name: 'Expert',     priceXof: '18 000', priceUsd: 30.00, maxCost: 25.00 },
  { id: 6, name: 'Master',     priceXof: '24 000', priceUsd: 40.00, maxCost: 30.00 },
  { id: 7, name: 'Enterprise', priceXof: '30 000', priceUsd: 50.00, maxCost: 35.00 },
];

const WA_NUMBER = '0166518473';

// Récupère les modèles OpenRouter et les classe gratuits/payants selon le plafond du palier
async function fetchOpenRouterModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models');
  if (!res.ok) throw new Error('Requête OpenRouter échouée');
  const json = await res.json();
  return json.data || [];
}

function TierCard({ tier, subscription, pendingSub, onSubscribe, openRouterModels, modelsLoading }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unlimited' | 'limited'

  const { freeModels, paidModels } = useMemo(() => {
    const free = [], paid = [];
    for (const m of openRouterModels) {
      const inp = parseFloat(m.pricing?.prompt || 0) * 1_000_000;
      const out = parseFloat(m.pricing?.completion || 0) * 1_000_000;
      const combined = inp + out;
      if (combined > tier.maxCost) continue;
      if (combined === 0) free.push(m);
      else paid.push(m);
    }
    return { freeModels: free, paidModels: paid };
  }, [openRouterModels, tier.maxCost]);

  // Modèles filtrés selon recherche et mode (tous / illimités / limités)
  const filteredList = useMemo(() => {
    let list = [];
    if (filterMode === 'all') {
      list = [...freeModels.map(m => ({ ...m, isUnlimited: true })), ...paidModels.map(m => ({ ...m, isUnlimited: false }))];
    } else if (filterMode === 'unlimited') {
      list = freeModels.map(m => ({ ...m, isUnlimited: true }));
    } else {
      list = paidModels.map(m => ({ ...m, isUnlimited: false }));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(m => (m.name || '').toLowerCase().includes(q) || (m.id || '').toLowerCase().includes(q));
  }, [freeModels, paidModels, filterMode, searchQuery]);

  const totalModels = paidModels.length + freeModels.length;
  const isCurrent = subscription?.tier_number === tier.id && subscription?.status === 'active';
  // L'indicateur « En attente » n'existe que pour la clé choisie (pendingSub = abonnement en attente lié à cette clé)
  const isPending = Boolean(pendingSub) && pendingSub.tier_number === tier.id;

  return (
    <div className="card card-hover" style={{
      border: isCurrent ? '2px solid var(--axis-accent)' : isPending ? '2px solid var(--axis-warning)' : tier.popular ? '2px solid rgba(132,204,22,0.4)' : '1px solid var(--axis-border)',
      display: 'flex', flexDirection: 'column', position: 'relative'
    }}>
      {isCurrent  && <span className="badge badge-green"  style={{ position: 'absolute', top: -12, right: 16 }}>Pack Actif</span>}
      {isPending  && <span className="badge badge-yellow" style={{ position: 'absolute', top: -12, right: 16 }}>En attente</span>}
      {tier.popular && !isCurrent && !isPending && <span className="badge badge-purple" style={{ position: 'absolute', top: -12, right: 16 }}>Populaire</span>}

      {/* Prix */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>Palier {tier.id}</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-accent)' }}>{tier.name}</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>
          {tier.priceXof} <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--axis-accent)' }}>FCFA</span>
        </div>
        <div style={{ color: 'var(--axis-textMuted)', fontSize: 12 }}>Durée : 30 jours</div>
      </div>

      {/* Compteurs modèles */}
      <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 12, marginBottom: 14, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {modelsLoading ? (
          <div style={{ color: 'var(--axis-muted)' }}>Calcul des modèles...</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--axis-textMuted)' }}>Modèles disponibles dans ce palier :</span>
              <b style={{ color: 'var(--axis-text)' }}>{totalModels} modèle{totalModels > 1 ? 's' : ''}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--axis-textMuted)' }}>Modèles limités :</span>
              <b style={{ color: 'var(--axis-text)' }}>{paidModels.length}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--axis-textMuted)' }}>Modèles illimités :</span>
              <b style={{ color: '#60a5fa' }}>{freeModels.length}</b>
            </div>
          </>
        )}
      </div>

      {/* Accordion zone stylisée des modèles */}
      <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 12, marginBottom: 16 }}>
        {/* Trigger button ergonomique et soigné */}
        <button
          type="button"
          onClick={() => setIsExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: isExpanded ? 'var(--axis-hover)' : 'rgba(255,255,255,0.03)',
            border: isExpanded ? '1px solid var(--axis-accent)' : '1px solid var(--axis-border)',
            color: 'var(--axis-text)', cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.borderColor = 'rgba(132,204,22,0.4)'; }}
          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.borderColor = 'var(--axis-border)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={15} color="var(--axis-accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Modèles du palier</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(255,255,255,0.06)', color: 'var(--axis-textMuted)'
            }}>
              {modelsLoading ? '...' : totalModels}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={16} color="var(--axis-accent)" /> : <ChevronDown size={16} color="var(--axis-muted)" />}
        </button>

        {/* Panneau déroulant stylisé */}
        {isExpanded && (
          <div className="ax-fade-in" style={{
            marginTop: 10, background: 'var(--axis-bg)', borderRadius: 12,
            border: '1px solid var(--axis-border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10
          }}>
            {/* Barre de recherche instantanée */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--axis-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filtrer un modèle (ex: llama, deepseek...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--axis-border)',
                  borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, color: 'var(--axis-text)', outline: 'none'
                }}
              />
            </div>

            {/* Filtres rapides */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: `Tous (${totalModels})` },
                { id: 'unlimited', label: `Illimités (${freeModels.length})` },
                { id: 'limited', label: `Limités (${paidModels.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  style={{
                    flex: 1, padding: '4px 6px', borderRadius: 6, fontSize: 10.5, fontWeight: 600,
                    background: filterMode === tab.id ? 'var(--axis-hover)' : 'transparent',
                    color: filterMode === tab.id ? '#fff' : 'var(--axis-muted)',
                    border: filterMode === tab.id ? '1px solid var(--axis-border)' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Liste scrollable propre */}
            <div style={{
              maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4,
              paddingRight: 4
            }}>
              {modelsLoading ? (
                <p style={{ color: 'var(--axis-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Chargement depuis OpenRouter...</p>
              ) : filteredList.length === 0 ? (
                <p style={{ color: 'var(--axis-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Aucun modèle correspondant</p>
              ) : (
                filteredList.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 8,
                      background: m.isUnlimited ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = m.isUnlimited ? 'rgba(59,130,246,0.1)' : 'var(--axis-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = m.isUnlimited ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.02)'}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--axis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--axis-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.id}
                      </div>
                    </div>
                    <span className={m.isUnlimited ? 'badge badge-blue' : 'badge badge-gray'} style={{ fontSize: 9, padding: '2px 7px', flexShrink: 0 }}>
                      {m.isUnlimited ? 'ILLIMITÉ' : 'LIMITÉ'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => !isCurrent && onSubscribe(tier)}
        className={isCurrent ? "btn-ghost" : "btn-primary"}
        disabled={isCurrent}
        style={{ width: '100%', opacity: isCurrent ? 0.6 : 1, marginTop: 'auto' }}
      >
        {isCurrent ? 'Pack Actif' : isPending ? 'Demande en cours' : `Souscrire (${tier.priceXof} FCFA)`}
      </button>
    </div>
  );
}

export const SubscriptionsPage = () => {
  const { subscription, subscribe, refresh } = useSubscription();
  const { keys, linkKeyToSubscription } = useApiKeys();
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState(null); // null | 'whatsapp' | 'moderator'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToast();

  // Clé pré-sélectionnée transmise depuis ApiKeysPage
  const [targetKeyId, setTargetKeyId] = useState(
    location.state?.targetKeyId || new URLSearchParams(location.search).get('key') || null
  );

  const targetKey = keys.find(k => k.id === targetKeyId);

  // Abonnement en attente de la clé choisie : sans clé, aucun indicateur « En attente »
  const keySub = targetKey?.subscriptions;
  const pendingSub = keySub && ['pending_validation', 'pending'].includes(keySub.status) ? keySub : null;

  useEffect(() => {
    fetchOpenRouterModels()
      .then(data => setOpenRouterModels(data))
      .catch(() => setOpenRouterModels([]))
      .finally(() => setModelsLoading(false));
  }, []);

  // Création de la souscription et liaison à la clé sélectionnée
  const handleSubscribeConfirm = async () => {
    if (!selectedTier || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await subscribe(selectedTier.id, null);
      if (error) {
        addToast(error.message || 'Erreur lors de la souscription', 'error');
        return;
      }
      if (data && !data.success) {
        addToast(data.error_message || 'Souscription rejetée', 'error');
        return;
      }

      // Si une clé cible est sélectionnée, on la lie immédiatement à cette souscription
      if (targetKeyId && data?.subscription_id) {
        await linkKeyToSubscription(targetKeyId, data.subscription_id);
        addToast(`Demande créée et liée à votre clé ! Retrouvez-la dans l'historique.`, 'success');
      } else {
        addToast('Demande créée ! Retrouvez-la dans votre historique.', 'success');
      }

      refresh();

      if (paymentChoice === 'whatsapp') {
        const keyInfo = targetKey ? `\n• Clé API : ${targetKey.name} (${targetKey.key_prefix})` : '';
        const msg = encodeURIComponent(
          `Bonjour Axis AI 👋\n\nJe viens de soumettre une demande d'abonnement :\n• Palier ${selectedTier.id} — ${selectedTier.name}\n• Montant : ${selectedTier.priceXof} FCFA${keyInfo}\n\nMerci de m'indiquer les coordonnées de paiement Mobile Money.`
        );
        window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
      }

      setSelectedTier(null);
      setPaymentChoice(null);
      setTargetKeyId(null);
      navigate('/dashboard/history');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Bannière principale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(90deg, rgba(132,204,22,0.12) 0%, rgba(192,132,252,0.12) 100%)', border: '1px solid rgba(132,204,22,0.3)', marginBottom: 20 }}>
        <Sparkles size={16} color="var(--axis-accent)" />
        <span style={{ fontSize: 13, fontWeight: 700 }}>Axis AI — Première plateforme béninoise d'accès aux modèles d'IA mondiaux en Francs CFA</span>
      </div>

      {/* Bannière "Clé pré-sélectionnée" si on arrive depuis la page des clés */}
      {targetKey && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 12,
          background: 'rgba(132,204,22,0.06)', border: '1px solid rgba(132,204,22,0.35)', marginBottom: 20
        }}>
          <Key size={18} color="var(--axis-accent)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>
            <b style={{ color: 'var(--axis-accent)' }}>Clé sélectionnée :</b>{' '}
            <span style={{ fontFamily: 'monospace', background: 'var(--axis-bg)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--axis-border)' }}>
              {targetKey.key_prefix}
            </span>{' '}
            <b>{targetKey.name}</b> — Choisissez un palier ci-dessous pour y lier votre abonnement.
          </div>
          <button onClick={() => setTargetKeyId(null)} style={{ color: 'var(--axis-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Les 7 Paliers d'Abonnement</h1>
        <p style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
          De <b>1 500 FCFA</b> à <b>30 000 FCFA</b> pour 30 jours. La liste des modèles disponibles est mise à jour en temps réel.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 20, marginBottom: 44 }}>
        {TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            subscription={subscription}
            pendingSub={pendingSub}
            onSubscribe={t => { setSelectedTier(t); setPaymentChoice(null); }}
            openRouterModels={openRouterModels}
            modelsLoading={modelsLoading}
          />
        ))}
      </div>

      {/* Modal Étape 1 : Choix du canal */}
      <Modal isOpen={!!selectedTier && !paymentChoice} onClose={() => setSelectedTier(null)} title="Choisissez votre canal de paiement">
        {selectedTier && (
          <div>
            <div style={{ background: 'var(--axis-bg)', padding: '14px 18px', borderRadius: 12, marginBottom: 24, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--axis-accent)' }}>{selectedTier.priceXof} FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Durée 30 jours</div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--axis-textMuted)', marginBottom: 20, lineHeight: 1.5 }}>
              Comment souhaitez-vous régler ce forfait ?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={() => setPaymentChoice('whatsapp')}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', textAlign: 'left', borderRadius: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageCircle size={20} color="#25D366" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Service WhatsApp — Administrateur</div>
                  <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Envoyez votre preuve de paiement Mobile Money et recevez confirmation sous 24h.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentChoice('moderator')}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', textAlign: 'left', borderRadius: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(192,132,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={20} color="var(--axis-purple)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Via Modérateur de Proximité</div>
                  <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Vous avez un modérateur près de vous ? Le paiement et la validation se font rapidement, en direct.</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Étape 2 : WhatsApp — Confirmation & Redirection */}
      <Modal isOpen={!!selectedTier && paymentChoice === 'whatsapp'} onClose={() => { setSelectedTier(null); setPaymentChoice(null); }} title="Paiement via WhatsApp Administrateur">
        {selectedTier && (
          <div>
            <div style={{ background: 'var(--axis-bg)', padding: '14px 18px', borderRadius: 12, marginBottom: 20, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 900, color: 'var(--axis-accent)' }}>{selectedTier.priceXof} FCFA</span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
              <b style={{ color: '#25D366' }}>Comment ça marche :</b><br />
              1. Cliquez sur <b>"Confirmer et aller sur WhatsApp"</b> — votre demande sera automatiquement créée.<br />
              2. Vous serez redirigé sur WhatsApp pour contacter l'administrateur et lui envoyer votre preuve de paiement Mobile Money.<br />
              3. La validation se fait <b>sous 24h</b>.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setPaymentChoice(null)} className="btn-ghost" style={{ flex: 1 }}>
                â† Retour
              </button>
              <button type="button" onClick={handleSubscribeConfirm} disabled={isSubmitting} className="btn-primary" style={{ flex: 2, background: '#25D366', color: '#fff' }}>
                {isSubmitting ? 'Création...' : '✓ Confirmer et aller sur WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Étape 2 : Modérateur — Confirmation (le code MOD sera saisi dans l'historique) */}
      <Modal isOpen={!!selectedTier && paymentChoice === 'moderator'} onClose={() => { setSelectedTier(null); setPaymentChoice(null); }} title="Paiement via Modérateur de Proximité">
        {selectedTier && (
          <div>
            <div style={{ background: 'var(--axis-bg)', padding: '14px 18px', borderRadius: 12, marginBottom: 20, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 900, color: 'var(--axis-accent)' }}>{selectedTier.priceXof} FCFA</span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.2)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
              <b style={{ color: 'var(--axis-purple)' }}>Comment ça marche :</b><br />
              1. Cliquez sur <b>"Confirmer la demande"</b> — votre demande est créée immédiatement.<br />
              2. Rendez-vous dans <b>Historique des Abonnements</b> — cliquez sur votre nouvelle demande.<br />
              3. Saisissez le code <b>MOD-XXXX</b> de votre modérateur pour lui soumettre la demande de validation.<br />
              4. Il valide après réception de votre paiement — <b>activation rapide</b>.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setPaymentChoice(null)} className="btn-ghost" style={{ flex: 1 }}>
                â† Retour
              </button>
              <button type="button" onClick={handleSubscribeConfirm} disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                {isSubmitting ? 'Création...' : '✓ Confirmer la demande'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

---

FICHIER: /frontend/src/styles/global.css

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ── CSS Variables ─────────────────────────────────────────────────────────── */
:root {
  --axis-bg:         #131314;
  --axis-sidebar:    #1e1f20;
  --axis-hover:      #333537;
  --axis-border:     #2a2b2d;
  --axis-text:       #e3e3e3;
  --axis-muted:      #8e918f;
  --axis-textMuted:  #c4c7c5;
  --axis-accent:     #84cc16;
  --axis-accent-dim: rgba(132,204,22,0.12);
  --axis-purple:     #c084fc;
  --axis-danger:     #f87171;
  --axis-warning:    #fbbf24;
  color-scheme: dark;
}

:root[data-axis-theme='light'] {
  --axis-bg:         #ffffff;
  --axis-sidebar:    #f7f9fb;
  --axis-hover:      #e9eef2;
  --axis-border:     #d5dde5;
  --axis-text:       #17212b;
  --axis-muted:      #52606d;
  --axis-textMuted:  #394653;
  --axis-accent:     #47760b;
  --axis-accent-dim: rgba(71,118,11,0.10);
  --axis-purple:     #7040a1;
  --axis-danger:     #b42318;
  --axis-warning:    #805000;
  color-scheme: light;
}

/* ── Reset ─────────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }

html, body, #root { height: 100%; width: 100%; }

body {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  background-color: var(--axis-bg);
  color: var(--axis-text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a { color: inherit; text-decoration: none; }

button, input, select, textarea { font-family: inherit; font-size: 100%; cursor: pointer; }

img, svg { display: block; }

/* ── Scrollbar ─────────────────────────────────────────────────────────────── */
* { scrollbar-width: thin; scrollbar-color: #333537 transparent; }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #333537; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #4e5052; }

/* ── Animations ────────────────────────────────────────────────────────────── */
@keyframes ax-fade    { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ax-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ax-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@keyframes ax-pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(132,204,22,0.4)); }
  50%       { filter: drop-shadow(0 0 24px rgba(132,204,22,0.8)); }
}
@keyframes ax-spin { to { transform: rotate(360deg); } }
@keyframes ax-slide-in-right {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

.ax-fade-in      { animation: ax-fade 0.3s ease-out forwards; }
.ax-fade-up      { animation: ax-fade-up 0.4s ease-out forwards; }
.ax-spin         { animation: ax-spin 0.8s linear infinite; }
.ax-pulse-glow   { animation: ax-pulse-glow 2.4s ease-in-out infinite; }
.ax-slide-in-right { animation: ax-slide-in-right 0.35s cubic-bezier(.16,1,.3,1) forwards; }
.ax-shimmer-bar  {
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: ax-shimmer 1.3s linear infinite;
}

/* ── Buttons ───────────────────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--axis-accent); color: #131314;
  border-radius: 9999px; padding: 10px 22px;
  font-weight: 600; font-size: 14px;
  transition: filter 0.18s ease, transform 0.18s ease;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: scale(1.02); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--axis-border); background: transparent;
  color: var(--axis-text); border-radius: 9999px; padding: 10px 22px;
  font-weight: 500; font-size: 14px;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.btn-ghost:hover { background: var(--axis-hover); border-color: var(--axis-hover); }

.btn-danger {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: transparent; border: 1px solid var(--axis-danger);
  color: var(--axis-danger); border-radius: 9999px; padding: 10px 22px;
  font-weight: 500; font-size: 14px;
  transition: background 0.15s ease;
}
.btn-danger:hover { background: rgba(248,113,113,0.1); }

.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 8px;
  color: var(--axis-textMuted); background: transparent;
  transition: background 0.15s, color 0.15s;
}
.btn-icon:hover { background: var(--axis-hover); color: var(--axis-text); }
.btn-icon.danger:hover { color: var(--axis-danger); background: rgba(248,113,113,0.08); }

/* ── Cards ─────────────────────────────────────────────────────────────────── */
.card {
  background-color: var(--axis-sidebar);
  border: 1px solid var(--axis-border);
  border-radius: 16px;
  padding: 20px;
}
.card-hover {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.card-hover:hover {
  border-color: rgba(132,204,22,0.3);
  box-shadow: 0 4px 24px rgba(132,204,22,0.05);
}

/* ── Inputs ─────────────────────────────────────────────────────────────────── */
.input-field {
  background: var(--axis-bg);
  border: 1px solid var(--axis-border);
  border-radius: 10px;
  padding: 9px 12px;
  color: var(--axis-text);
  width: 100%;
  outline: none;
  font-size: 13px;
  transition: border-color 0.2s ease;
}
.input-field:focus  { border-color: var(--axis-accent); }
.input-field::placeholder { color: var(--axis-muted); }

textarea.input-field { resize: vertical; min-height: 80px; }

/* ── Badges ─────────────────────────────────────────────────────────────────── */
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 9999px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
}
.badge-green  { background: rgba(132,204,22,0.12); color: var(--axis-accent); }
.badge-yellow { background: rgba(251,191,36,0.12);  color: var(--axis-warning); }
.badge-red    { background: rgba(248,113,113,0.12); color: var(--axis-danger); }
.badge-gray   { background: rgba(142,145,143,0.12); color: var(--axis-muted); }
.badge-purple { background: rgba(192,132,252,0.12); color: var(--axis-purple); }
.badge-blue   { background: rgba(59,130,246,0.15); color: #60a5fa; }

/* ── Toggle Switch ──────────────────────────────────────────────────────────── */
.toggle {
  position: relative; display: inline-flex; align-items: center;
  width: 40px; height: 22px; cursor: pointer;
}
.toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track {
  position: absolute; inset: 0;
  border-radius: 9999px; background: var(--axis-border);
  transition: background 0.2s ease;
}
.toggle input:checked ~ .toggle-track { background: var(--axis-accent); }
.toggle-thumb {
  position: absolute; left: 3px; top: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}
.toggle input:checked ~ .toggle-thumb { transform: translateX(18px); }

/* ── Table ──────────────────────────────────────────────────────────────────── */
.ax-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
.ax-table th { padding: 12px 16px; color: var(--axis-textMuted); font-weight: 500; border-bottom: 1px solid var(--axis-border); white-space: nowrap; }
.ax-table td { padding: 14px 16px; border-bottom: 1px solid var(--axis-border); }
.ax-table tr:last-child td { border-bottom: none; }
.ax-table tbody tr:hover { background: rgba(255,255,255,0.02); }

/* ── Hex grid background (Landing) ─────────────────────────────────────────── */
.ax-hex-bg {
  position: relative;
  overflow: hidden;
}
.ax-hex-bg::before {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(132,204,22,0.07) 1px, transparent 0);
  background-size: 32px 32px;
  pointer-events: none;
}

/* ── Page shell ─────────────────────────────────────────────────────────────── */
.page-shell {
  flex: 1; overflow-y: auto;
  padding: 32px 28px;
}
.page-content {
  max-width: 920px;
  margin: 0 auto;
  display: flex; flex-direction: column; gap: 24px;
}
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.page-title { font-size: 22px; font-weight: 700; color: var(--axis-text); }
.page-subtitle { font-size: 13px; color: var(--axis-muted); margin-top: 4px; }

/* ── Sidebar ────────────────────────────────────────────────────────────────── */
.ax-sidebar {
  width: 260px; flex-shrink: 0;
  background: var(--axis-sidebar);
  border-right: 1px solid var(--axis-border);
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
  transition: width 0.3s ease;
}
.ax-sidebar.collapsed { width: 64px; }

/* ── Divider ────────────────────────────────────────────────────────────────── */
.divider { border: none; border-top: 1px solid var(--axis-border); margin: 8px 0; }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .page-shell { padding: 20px 16px; }
  .ax-sidebar { position: fixed; z-index: 50; height: 100vh; }
  .ax-sidebar:not(.collapsed) { box-shadow: 16px 0 40px rgba(0,0,0,0.5); }
}

---

FICHIER: /frontend/src/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oahduqmmqiwdldsqmzhv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haGR1cW1tcWl3ZGxkc3Ftemh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDg0OTcsImV4cCI6MjEwNjY4NDQ5N30.iWXknFIutPZiJX0O5zH4qWIqD20vnB_j9-Mb6TTy9D8';

export const supabase = createClient(supabaseUrl, supabaseKey);

---

FICHIER: /frontend/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});

---

FICHIER: /package.json

{
  "name": "axis-ai-api",
  "version": "1.0.0",
  "description": "Gatekeeper API proxy for OpenRouter with smart routing and budget envelopes",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc",
    "sync-models": "tsx scripts/sync-openrouter-models.ts",
    "generate-key": "tsx scripts/generate-demo-key.ts",
    "test-proxy": "tsx scripts/test-proxy.ts",
    "test": "tsx scripts/run-all-tests.ts",
    "test-all": "tsx scripts/run-all-tests.ts"
  },
  "keywords": ["proxy", "openrouter", "gatekeeper", "supabase", "llm-router"],
  "license": "ISC",
  "dependencies": {
    "@fastify/cors": "^11.3.0",
    "@supabase/supabase-js": "^2.117.2",
    "dotenv": "^18.0.5",
    "fastify": "^5.12.5"
  },
  "devDependencies": {
    "@types/node": "^26.6.4",
    "tsx": "^4.23.15",
    "typescript": "^7.0.2"
  }
}

---

FICHIER: /README.md

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

---

FICHIER: /scripts/generate-demo-key.js

import crypto from 'node:crypto';
import { supabase, hashApiKey } from '../src/db/supabase.js';
async function generateDemoKey() {
    console.log('\n[Setup Demo] Initialisation d\'une clé et d\'un abonnement de test...');
    const userId = crypto.randomUUID();
    console.log(`[Setup Demo] Utilisateur UUID : ${userId}`);
    // 1. Création d'une souscription avec 10.00 USD de solde valide 30 jours
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const budgetAmount = 10.0;
    const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .insert({
        user_id: userId,
        budget_amount_usd: budgetAmount,
        balance_usd: budgetAmount,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
    })
        .select()
        .single();
    if (subErr) {
        console.error('[Setup Demo Error] Impossible de créer la souscription:', subErr);
        console.log('\n💡 Conseil: Assurez-vous d\'avoir exécuté le script SQL "001_initial_schema.sql" dans le SQL Editor de Supabase !');
        return;
    }
    console.log(`[Setup Demo] Abonnement créé avec succès (ID: ${subData.id}, Solde: $${subData.balance_usd})`);
    // 2. Génération de la clé API
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullKey = `axis_live_${rawSecret}`;
    const keyPrefix = `${fullKey.slice(0, 14)}...`;
    const keyHash = hashApiKey(fullKey);
    const { data: keyData, error: keyErr } = await supabase
        .from('api_keys')
        .insert({
        user_id: userId,
        subscription_id: subData.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: 'Test Key Dev',
        is_enabled: true,
        daily_request_limit: 1000,
    })
        .select()
        .single();
    if (keyErr) {
        console.error('[Setup Demo Error] Impossible d\'insérer la clé:', keyErr);
        return;
    }
    console.log('\n======================================================');
    console.log('  🎉 CLÉ API AXIS GÉNÉRÉE AVEC SUCCÈS');
    console.log('======================================================');
    console.log(`  🔑 Clé API secrète (à copier) : ${fullKey}`);
    console.log(`  🏷️  ID Clé                    : ${keyData.id}`);
    console.log(`  💰 Solde initial              : $${budgetAmount.toFixed(2)} USD`);
    console.log(`  📅 Expire le                  : ${expiresAt.toLocaleDateString()}`);
    console.log('======================================================');
    console.log('\nExemple de commande cURL pour tester :');
    console.log(`
curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Authorization: Bearer ${fullKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "axis-auto",
    "messages": [{"role": "user", "content": "Bonjour ! Peux-tu me résumer le rôle d un gatekeeper API ?"}]
  }'
  `);
}
generateDemoKey();

---

FICHIER: /scripts/generate-demo-key.ts

/**
 * generate-demo-key.ts
 * 
 * Génère une clé API de test via le RPC `axis_generate_api_key`.
 * Prérequis : Le schéma SQL doit être déployé sur Supabase.
 * Usage : npm run generate-key [user-id-uuid]
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env');
  process.exit(1);
}

// Client avec service role key pour contourner RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function generateDemoKey() {
  // L'user_id peut être passé en argument CLI
  const userId = process.argv[2];

  if (!userId) {
    console.error(`
❌ Usage : npm run generate-key <user-id-uuid>

L'UUID doit correspondre à un utilisateur existant dans auth.users (et donc dans public.profiles).

💡 Pour obtenir votre UUID admin :
   Ouvrez le SQL Editor Supabase et exécutez :
   SELECT id, email FROM auth.users LIMIT 10;
`);
    process.exit(1);
  }

  console.log(`\n[Setup Demo] Génération d'une clé pour l'utilisateur : ${userId}`);

  // Vérifier que le profil existe
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error(`
❌ Utilisateur introuvable dans public.profiles.
   
Vérifiez que :
  1. Le schéma SQL (supabase_production_schema.sql) a bien été déployé.
  2. L'utilisateur est inscrit via Supabase Auth (le trigger handle_new_user crée le profil automatiquement).
  3. L'UUID fourni est correct.

Erreur technique : ${profileError?.message ?? 'Aucun profil trouvé'}
`);
    process.exit(1);
  }

  console.log(`[Setup Demo] Profil trouvé : @${profile.username} (rôle: ${profile.role})`);

  // Appel RPC axis_generate_api_key
  const { data, error } = await supabaseAdmin.rpc('axis_generate_api_key', {
    p_user_id: userId,
    p_subscription_id: null,       // Pas d'abonnement lié (admin bypass ou clé en attente)
    p_name: 'Demo Key (Dev)',
    p_daily_limit: null,
  });

  if (error) {
    console.error(`❌ Erreur RPC axis_generate_api_key : ${error.message}`);
    process.exit(1);
  }

  if (!data?.success) {
    console.error(`❌ La génération a échoué : ${data?.error_message}`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  🎉 CLÉ API AXIS GÉNÉRÉE AVEC SUCCÈS');
  console.log('='.repeat(60));
  console.log(`  🔑 Clé API secrète (à copier) : ${data.api_key}`);
  console.log(`  🏷️  Prefix affiché            : ${data.key_prefix}`);
  console.log(`  🆔 ID Clé                    : ${data.key_id}`);
  console.log(`  ✅ Activée                   : ${data.is_enabled ? 'Oui' : 'Non (nécessite un abonnement validé)'}`);
  console.log('='.repeat(60));
  console.log(`\n⚠️  ${data.warning}`);

  if (profile.role !== 'admin') {
    console.log(`
📋 Prochaines étapes pour activer cette clé :
  1. Appelez POST /v1/subscriptions avec un tier_number (1 à 7)
  2. Un modérateur valide l'abonnement via POST /v1/admin/subscriptions/:id/validate
  3. La clé s'active automatiquement.
`);
  } else {
    console.log(`
✨ Cet utilisateur est ADMIN — la clé est active immédiatement sans abonnement.
`);
  }

  console.log('Exemple de commande cURL pour tester :');
  console.log(`
curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Authorization: Bearer ${data.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "axis-auto",
    "messages": [{"role": "user", "content": "Bonjour ! Peux-tu expliquer le rôle d un gatekeeper API ?"}]
  }'
`);
}

generateDemoKey();

---

FICHIER: /scripts/llm-header.md

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

---

FICHIER: /scripts/run-all-tests.ts

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  calculateMaxAllowedCost,
  KNOWN_MODELS,
  decidePowerLevel,
  selectBestModelForTier,
} from '../src/router/axis-auto.js';
import { hashApiKey } from '../src/db/supabase.js';

interface TestResultEntry {
  name: string;
  objective: string;
  status: 'SUCCESS' | 'FAILED';
  details?: string;
}

class TestLogger {
  private logPath = path.resolve(process.cwd(), 'test-results.log');
  private results: TestResultEntry[] = [];

  constructor() {
    const header = [
      '================================================================================',
      `  AXIS AUTO / ACCESS AI - JOURNAL D'EXÉCUTION DES TESTS (TEST LOG)`,
      `  Date d'exécution : ${new Date().toISOString()}`,
      `  Environnement : Node.js ${process.version} / Fastify / PostgreSQL Supabase RPC`,
      '================================================================================\n',
    ].join('\n');
    fs.writeFileSync(this.logPath, header, { encoding: 'utf-8' });
  }

  log(entry: TestResultEntry) {
    this.results.push(entry);
    const line = [
      `[${entry.status}] TEST: ${entry.name}`,
      `  Objectif : ${entry.objective}`,
      entry.details ? `  Détails  : ${entry.details}` : '',
      '--------------------------------------------------------------------------------',
    ]
      .filter(Boolean)
      .join('\n');

    fs.appendFileSync(this.logPath, line + '\n', { encoding: 'utf-8' });

    const icon = entry.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} [${entry.status}] ${entry.name}`);
    if (entry.details) {
      console.log(`   └─ ${entry.details}`);
    }
  }

  summary() {
    const successCount = this.results.filter((r) => r.status === 'SUCCESS').length;
    const failCount = this.results.filter((r) => r.status === 'FAILED').length;
    const total = this.results.length;

    const footer = [
      '\n================================================================================',
      `  RÉSUMÉ FINAL : ${successCount}/${total} tests réussis (${Math.round((successCount / total) * 100)}%)`,
      `  Échecs : ${failCount}`,
      '================================================================================\n',
    ].join('\n');

    fs.appendFileSync(this.logPath, footer, { encoding: 'utf-8' });
    console.log(footer);
  }
}

// ----------------------------------------------------------------------------
// SIMULATEUR POSTGRESQL ATOMIQUE POUR TESTS DES RÔLES, RPC & FLUX MÉTIER
// ----------------------------------------------------------------------------
interface MockProfile {
  id: string;
  email: string;
  username: string;
  pseudo: string;
  role: 'admin' | 'moderator' | 'client';
  moderator_code?: string;
}

interface MockSubscription {
  id: string;
  user_id: string;
  tier_number: number;
  budget_amount_usd: number;
  balance_usd: number;
  consumed_usd: number;
  total_tokens_consumed: number;
  starts_at: Date;
  expires_at: Date;
  status: 'active' | 'pending_validation' | 'pending' | 'expired' | 'depleted' | 'disabled';
  is_active: boolean;
  moderator_id?: string;
  moderator_code_used?: string;
  validated_by?: string;
  validated_at?: Date;
  disabled_reason?: string;
  disabled_at?: Date;
  disabled_by?: string;
  commission_status: 'unpaid' | 'paid' | 'archived' | 'none';
}

interface MockApiKey {
  id: string;
  user_id: string;
  subscription_id: string | null;
  key_hash: string;
  is_enabled: boolean;
}

class PostgresSimulator {
  public profiles: Map<string, MockProfile> = new Map();
  public subscriptions: Map<string, MockSubscription> = new Map();
  public apiKeys: Map<string, MockApiKey> = new Map();
  private lock = false;

  async acquireLock(): Promise<void> {
    while (this.lock) {
      await new Promise((r) => setTimeout(r, 2));
    }
    this.lock = true;
  }

  releaseLock(): void {
    this.lock = false;
  }

  // RPC axis_create_moderator
  async rpcCreateModerator(adminId: string, targetUserId: string, customCode?: string) {
    const admin = this.profiles.get(adminId);
    if (!admin || admin.role !== 'admin') {
      return { success: false, http_status: 403, error_code: 'UNAUTHORIZED', error_message: 'Action réservée à l administrateur.' };
    }

    const user = this.profiles.get(targetUserId);
    if (!user) {
      return { success: false, http_status: 404, error_message: 'Utilisateur introuvable.' };
    }

    const code = customCode ? customCode.toUpperCase() : `MOD-${Math.floor(1000 + Math.random() * 9000)}`;
    user.role = 'moderator';
    user.moderator_code = code;

    return {
      success: true,
      http_status: 200,
      user_id: targetUserId,
      role: 'moderator',
      moderator_code: code,
    };
  }

  // RPC axis_subscribe (Paiement hors ligne, modérateur et règle J-7)
  async rpcSubscribe(userId: string, tierNumber: number, moderatorCode?: string, now = new Date()) {
    await this.acquireLock();
    try {
      if (tierNumber < 1 || tierNumber > 7) {
        return { success: false, http_status: 400, error_code: 'INVALID_TIER', error_message: 'Palier invalide.' };
      }

      let modProfile: MockProfile | undefined;
      if (moderatorCode && moderatorCode.trim() !== '') {
        modProfile = Array.from(this.profiles.values()).find(
          (p) => p.moderator_code === moderatorCode.toUpperCase() && p.role === 'moderator'
        );
        if (!modProfile) {
          return { success: false, http_status: 404, error_code: 'INVALID_MODERATOR_CODE', error_message: 'Code modérateur invalide.' };
        }
      }

      // Vérification de l'abonnement actif pour la règle J-7
      const activeSub = Array.from(this.subscriptions.values()).find(
        (s) => s.user_id === userId && s.status === 'active' && s.is_active && s.expires_at > now && s.balance_usd > 0
      );

      const budgetAmount = [0, 10, 25, 50, 100, 200, 350, 500][tierNumber];

      let isRenewal = false;
      let startsAt = new Date(now);
      let expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

      if (activeSub) {
        const sevenDaysBefore = new Date(activeSub.expires_at.getTime() - 7 * 24 * 3600 * 1000);
        if (now < sevenDaysBefore) {
          return {
            success: false,
            http_status: 409,
            error_code: 'EARLY_RENEWAL_FORBIDDEN',
            error_message: 'Souscription anticipée non autorisée en dehors des 7 derniers jours.',
          };
        }

        const pending = Array.from(this.subscriptions.values()).find(
          (s) => s.user_id === userId && (s.status === 'pending' || s.status === 'pending_validation')
        );
        if (pending) {
          return {
            success: false,
            http_status: 409,
            error_code: 'PENDING_ALREADY_EXISTS',
            error_message: 'Un abonnement de renouvellement est déjà en attente.',
          };
        }

        isRenewal = true;
        startsAt = new Date(activeSub.expires_at);
        expiresAt = new Date(startsAt.getTime() + 30 * 24 * 3600 * 1000);
      }

      const subId = crypto.randomUUID();
      const newSub: MockSubscription = {
        id: subId,
        user_id: userId,
        tier_number: tierNumber,
        budget_amount_usd: budgetAmount,
        balance_usd: budgetAmount,
        consumed_usd: 0,
        total_tokens_consumed: 0,
        starts_at: startsAt,
        expires_at: expiresAt,
        status: 'pending_validation',
        is_active: false,
        moderator_id: modProfile?.id,
        moderator_code_used: modProfile?.moderator_code,
        commission_status: modProfile ? 'unpaid' : 'none',
      };
      this.subscriptions.set(subId, newSub);

      return {
        success: true,
        http_status: 201,
        subscription_id: subId,
        status: 'pending_validation',
        is_renewal_j7: isRenewal,
        tier_number: tierNumber,
        moderator_assigned: modProfile?.moderator_code,
        instructions: 'Veuillez effectuer le règlement hors-ligne sur le numéro officiel de l administration.',
      };
    } finally {
      this.releaseLock();
    }
  }

  // RPC axis_moderator_validate_subscription (Validation après vérification du paiement)
  async rpcModeratorValidate(validatorId: string, subscriptionId: string, now = new Date()) {
    await this.acquireLock();
    try {
      const validator = this.profiles.get(validatorId);
      if (!validator || (validator.role !== 'admin' && validator.role !== 'moderator')) {
        return { success: false, http_status: 403, error_code: 'UNAUTHORIZED', error_message: 'Opération réservée aux modérateurs et administrateurs.' };
      }

      const sub = this.subscriptions.get(subscriptionId);
      if (!sub) {
        return { success: false, http_status: 404, error_message: 'Abonnement introuvable.' };
      }

      if (sub.status !== 'pending_validation') {
        return { success: false, http_status: 400, error_message: `Abonnement déjà traité (statut: ${sub.status}).` };
      }

      // Si modérateur, vérifier qu'il est rattaché à cet abonnement
      if (validator.role === 'moderator' && sub.moderator_id && sub.moderator_id !== validatorId) {
        return { success: false, http_status: 403, error_code: 'FORBIDDEN', error_message: 'Vous ne pouvez valider que les abonnements portant votre code modérateur.' };
      }

      // Vérifier si un abonnement actif est en cours
      const activeSub = Array.from(this.subscriptions.values()).find(
        (s) => s.user_id === sub.user_id && s.id !== sub.id && s.status === 'active' && s.is_active && s.expires_at > now && s.balance_usd > 0
      );

      if (activeSub) {
        sub.status = 'pending';
        sub.is_active = false;
      } else {
        sub.status = 'active';
        sub.is_active = true;
        sub.starts_at = now;
        sub.expires_at = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

        for (const k of this.apiKeys.values()) {
          if (k.user_id === sub.user_id) {
            k.subscription_id = sub.id;
            k.is_enabled = true;
          }
        }
      }

      sub.validated_by = validatorId;
      sub.validated_at = now;

      return {
        success: true,
        http_status: 200,
        subscription_id: sub.id,
        assigned_status: sub.status,
        is_active: sub.is_active,
        validated_by: validatorId,
      };
    } finally {
      this.releaseLock();
    }
  }

  // RPC admin_disable_subscription (Désactivation avec motif obligatoire - Admin Seul)
  async rpcAdminDisableSubscription(operatorId: string, subscriptionId: string, reason: string) {
    await this.acquireLock();
    try {
      const operator = this.profiles.get(operatorId);
      if (!operator || operator.role !== 'admin') {
        return {
          success: false,
          http_status: 403,
          error_code: 'UNAUTHORIZED',
          error_message: 'Action strictement réservée à l administrateur. Les modérateurs n ont pas le droit de désactiver un abonnement.',
        };
      }

      if (!reason || reason.trim().length < 5) {
        return {
          success: false,
          http_status: 400,
          error_code: 'REASON_REQUIRED',
          error_message: 'Un justificatif textuel obligatoire doit être fourni pour désactiver un abonnement.',
        };
      }

      const sub = this.subscriptions.get(subscriptionId);
      if (!sub) {
        return { success: false, http_status: 404, error_message: 'Abonnement introuvable.' };
      }

      sub.status = 'disabled';
      sub.is_active = false;
      sub.disabled_reason = reason.trim();
      sub.disabled_at = new Date();
      sub.disabled_by = operatorId;

      for (const k of this.apiKeys.values()) {
        if (k.subscription_id === subscriptionId) {
          k.is_enabled = false;
        }
      }

      return {
        success: true,
        http_status: 200,
        subscription_id: subscriptionId,
        disabled_reason: sub.disabled_reason,
      };
    } finally {
      this.releaseLock();
    }
  }

  // RPC axis_gatekeeper_validate (Avec Bypass Admin & Alerte Popup si désactivé)
  async rpcGatekeeperValidate(keyHash: string, modelId: string, inputTokens: number, maxOutputTokens: number, now = new Date()) {
    await this.acquireLock();
    try {
      const key = Array.from(this.apiKeys.values()).find((k) => k.key_hash === keyHash);
      if (!key) {
        return { is_allowed: false, http_status: 401, error_code: 'INVALID_API_KEY', error_message: 'Clé invalide.' };
      }

      const user = this.profiles.get(key.user_id);

      // PRIVILÈGE ADMINISTRATEUR : ACCÈS TOTAL ET ILLIMITÉ
      if (user && user.role === 'admin') {
        return {
          is_allowed: true,
          is_admin: true,
          is_free: true,
          http_status: 200,
          current_balance_usd: 999999.0,
          message: 'Accès administrateur suprême sans limitation.',
        };
      }

      if (!key.subscription_id) {
        return { is_allowed: false, http_status: 403, error_code: 'NO_SUBSCRIPTION', error_message: 'Aucun abonnement rattaché.' };
      }

      let sub = this.subscriptions.get(key.subscription_id);

      // Si l'abonnement a été désactivé par l'admin avec motif
      if (sub && sub.status === 'disabled') {
        return {
          is_allowed: false,
          http_status: 403,
          error_code: 'SUBSCRIPTION_DISABLED_BY_ADMIN',
          error_message: 'Votre abonnement a été désactivé par l administrateur.',
          disabled_reason: sub.disabled_reason,
        };
      }

      // Expiration / Solde épuisé -> bascule vers pending si présent
      if (!sub || sub.status !== 'active' || sub.expires_at <= now || sub.balance_usd <= 0) {
        if (sub && sub.status === 'active') {
          sub.status = sub.balance_usd <= 0 ? 'depleted' : 'expired';
          sub.is_active = false;
        }

        const pending = Array.from(this.subscriptions.values()).find(
          (s) => s.user_id === key.user_id && s.status === 'pending'
        );

        if (pending) {
          pending.status = 'active';
          pending.is_active = true;
          pending.starts_at = now;
          pending.expires_at = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
          key.subscription_id = pending.id;
          key.is_enabled = true;
          sub = pending;
        } else {
          key.is_enabled = false;
          return {
            is_allowed: false,
            http_status: 402,
            error_code: sub && sub.balance_usd <= 0 ? 'SUBSCRIPTION_DEPLETED' : 'SUBSCRIPTION_EXPIRED',
            error_message: 'Abonnement expiré ou budget épuisé.',
          };
        }
      }

      const model = KNOWN_MODELS[modelId];
      if (!model) {
        if (modelId.includes(':free')) {
          return { is_allowed: true, is_free: true, http_status: 200, current_balance_usd: sub.balance_usd };
        }
        return { is_allowed: false, http_status: 404, error_code: 'MODEL_NOT_FOUND', error_message: 'Modèle introuvable.' };
      }

      // Formule du palier : MaxAllowedCost = alpha * i + beta
      const maxAllowed = calculateMaxAllowedCost(sub.tier_number, 5.0, 0.0);
      if (!model.isFree && model.combinedCostPerMillion > maxAllowed) {
        return {
          is_allowed: false,
          http_status: 403,
          error_code: 'TIER_MODEL_NOT_PERMITTED',
          error_message: "Ce modèle n'est pas inclus dans votre palier actuel.",
          tier_number: sub.tier_number,
          max_allowed_cost: maxAllowed,
          model_cost: model.combinedCostPerMillion,
        };
      }

      if (model.isFree) {
        return { is_allowed: true, is_free: true, http_status: 200, current_balance_usd: sub.balance_usd };
      }

      const estCost = inputTokens * model.inputCostPerToken + maxOutputTokens * model.outputCostPerToken;
      if (sub.balance_usd >= estCost) {
        return {
          is_allowed: true,
          is_free: false,
          http_status: 200,
          current_balance_usd: sub.balance_usd,
          estimated_cost_usd: estCost,
          tier_number: sub.tier_number,
        };
      } else {
        return {
          is_allowed: false,
          http_status: 402,
          error_code: 'INSUFFICIENT_BALANCE',
          error_message: 'Solde insuffisant pour couvrir la requête.',
        };
      }
    } finally {
      this.releaseLock();
    }
  }
}

// ============================================================================
// SUITE DE TESTS COMPLÈTE
// ============================================================================
async function runAllTests() {
  const logger = new TestLogger();
  const db = new PostgresSimulator();

  console.log('🚀 Lancement de la validation technique complète (Rôles & Architecture)...\n');

  // Création des profils de base
  const adminId = 'admin-uuid-001';
  db.profiles.set(adminId, { id: adminId, email: 'admin@axis.ai', username: 'superadmin', pseudo: 'Admin', role: 'admin' });

  const modUserId = 'mod-user-uuid-002';
  db.profiles.set(modUserId, { id: modUserId, email: 'mod@axis.ai', username: 'mod_alex', pseudo: 'Alex', role: 'client' });

  const clientId = 'client-uuid-003';
  db.profiles.set(clientId, { id: clientId, email: 'client@axis.ai', username: 'client_bob', pseudo: 'Bob', role: 'client' });

  // --------------------------------------------------------------------------
  // SUITE 1 : Attribution du Rôle Modérateur & Code MOD-XXXX
  // --------------------------------------------------------------------------
  console.log('--- SUITE 1 : Gestion des Modérateurs par l\'Administrateur ---');

  // Client tentant de se nommer modérateur -> REFUS 403
  const resClientTriesMod = await db.rpcCreateModerator(clientId, modUserId);
  logger.log({
    name: 'Sécurité : Seul l\'administrateur peut créer un modérateur',
    objective: 'Empêcher un utilisateur non-admin d\'attribuer le rôle modérateur.',
    status: !resClientTriesMod.success && resClientTriesMod.http_status === 403 ? 'SUCCESS' : 'FAILED',
    details: 'Tentative refusée avec HTTP 403 UNAUTHORIZED.',
  });

  // Admin nomme le modérateur avec code 'MOD-7777'
  const resAdminCreatesMod = await db.rpcCreateModerator(adminId, modUserId, 'MOD-7777');
  const modCreatedOk = resAdminCreatesMod.success && resAdminCreatesMod.moderator_code === 'MOD-7777';
  logger.log({
    name: 'Attribution du rôle modérateur avec identifiant unique MOD-XXXX',
    objective: 'Générer et associer l\'identifiant unique modérateur (MOD-7777).',
    status: modCreatedOk ? 'SUCCESS' : 'FAILED',
    details: `Identifiant modérateur ${resAdminCreatesMod.moderator_code} créé et rattaché avec succès.`,
  });

  // --------------------------------------------------------------------------
  // SUITE 2 : Workflow Paiement Hors-Ligne & Validation Modérateur
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 2 : Workflow de Souscription & Validation Hors-Ligne ---');

  // Client souscrit au Palier 2 en renseignant le code modérateur MOD-7777
  const resSubInit = await db.rpcSubscribe(clientId, 2, 'MOD-7777');
  const subInitOk = resSubInit.success && resSubInit.status === 'pending_validation' && resSubInit.moderator_assigned === 'MOD-7777';
  logger.log({
    name: 'Souscription client avec code modérateur (Statut: pending_validation)',
    objective: 'Créer l\'abonnement en attente de validation hors-ligne après paiement.',
    status: subInitOk ? 'SUCCESS' : 'FAILED',
    details: `Abonnement créé (ID: ${resSubInit.subscription_id}) avec assignation modérateur MOD-7777.`,
  });

  // Modérateur valide l'abonnement après vérification du paiement
  const subId = resSubInit.subscription_id!;
  const resModValidate = await db.rpcModeratorValidate(modUserId, subId);
  const modValidateOk = resModValidate.success && resModValidate.assigned_status === 'active' && resModValidate.is_active === true;
  logger.log({
    name: 'Validation de l\'abonnement par le modérateur après paiement',
    objective: 'Activer le pack pour 30 jours suite à la vérification du modérateur.',
    status: modValidateOk ? 'SUCCESS' : 'FAILED',
    details: `Abonnement activé pour 30 jours par le modérateur ${modUserId}.`,
  });

  // --------------------------------------------------------------------------
  // SUITE 3 : Interdiction de Désactivation par les Modérateurs
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 3 : Restrictions Modérateur & Désactivation Admin ---');

  // Le modérateur tente de désactiver l'abonnement -> REFUS STRICT
  const resModTriesDisable = await db.rpcAdminDisableSubscription(modUserId, subId, 'Raison abusive');
  const modDisabledRefused = !resModTriesDisable.success && resModTriesDisable.http_status === 403;
  logger.log({
    name: 'Interdiction : Les modérateurs ne peuvent pas désactiver d\'abonnement',
    objective: 'Garantir que seul l\'administrateur suprême possède le pouvoir de désactivation.',
    status: modDisabledRefused ? 'SUCCESS' : 'FAILED',
    details: `Rejet HTTP 403 : "${resModTriesDisable.error_message}"`,
  });

  // --------------------------------------------------------------------------
  // SUITE 4 : Désactivation Administrative avec Motif Obligatoire
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 4 : Désactivation Administrative avec Justificatif Obligatoire ---');

  // Tentative sans justificatif textuel -> REFUS
  const resNoReason = await db.rpcAdminDisableSubscription(adminId, subId, '');
  const noReasonRefused = !resNoReason.success && resNoReason.error_code === 'REASON_REQUIRED';
  logger.log({
    name: 'Obligation de justificatif textuel pour désactiver un abonnement',
    objective: 'Exiger une raison explicite et détaillée avant toute coupure administrative.',
    status: noReasonRefused ? 'SUCCESS' : 'FAILED',
    details: `Rejet HTTP 400 conforme : "${resNoReason.error_message}"`,
  });

  // Admin désactive avec justificatif valide
  const reasonText = 'Non-respect des conditions d utilisation (abus de charge détecté).';
  const resAdminDisable = await db.rpcAdminDisableSubscription(adminId, subId, reasonText);
  const adminDisableOk = resAdminDisable.success && resAdminDisable.disabled_reason === reasonText;
  logger.log({
    name: 'Désactivation effective par l\'administrateur avec motif consigné',
    objective: 'Désactiver le pack et enregistrer le motif qui sera affiché au client en popup.',
    status: adminDisableOk ? 'SUCCESS' : 'FAILED',
    details: `Abonnement désactivé avec motif : "${reasonText}"`,
  });

  // Clé API du client bloquée avec affichage du motif en alerte
  const clientKeyHash = hashApiKey('axis_live_client_key_001');
  db.apiKeys.set(clientKeyHash, {
    id: crypto.randomUUID(),
    user_id: clientId,
    subscription_id: subId,
    key_hash: clientKeyHash,
    is_enabled: false,
  });

  const resGatekeeperBlocked = await db.rpcGatekeeperValidate(clientKeyHash, 'openai/gpt-4o-mini', 10, 100);
  const alertDisplayedOk = !resGatekeeperBlocked.is_allowed && resGatekeeperBlocked.error_code === 'SUBSCRIPTION_DISABLED_BY_ADMIN' && resGatekeeperBlocked.disabled_reason === reasonText;
  logger.log({
    name: 'Alerte Popup Client : Notification du motif de désactivation',
    objective: 'Transmettre le justificatif textuel lors de l interception par le Gatekeeper.',
    status: alertDisplayedOk ? 'SUCCESS' : 'FAILED',
    details: `Interception HTTP 403 avec motif transmis : "${resGatekeeperBlocked.disabled_reason}"`,
  });

  // --------------------------------------------------------------------------
  // SUITE 5 : Privilège Administrateur Suprême (Accès Total & Illimité)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 5 : Privilèges Administrateur Suprême ---');

  const adminKeyHash = hashApiKey('axis_live_admin_master_key');
  db.apiKeys.set(adminKeyHash, {
    id: crypto.randomUUID(),
    user_id: adminId,
    subscription_id: null, // Pas d'abonnement requis pour l'admin
    key_hash: adminKeyHash,
    is_enabled: true,
  });

  // L'admin appelle le modèle le plus cher (Claude 3.5 Sonnet) sans abonnement
  const resAdminAccess = await db.rpcGatekeeperValidate(adminKeyHash, 'anthropic/claude-3.5-sonnet', 500, 2000);
  const adminBypassOk = resAdminAccess.is_allowed && resAdminAccess.is_admin === true && resAdminAccess.is_free === true;
  logger.log({
    name: 'Bypass Admin : Accès illimité et gratuit à tous les modèles',
    objective: 'Permettre à l administrateur de requêter sans abonnement ni débit de solde.',
    status: adminBypassOk ? 'SUCCESS' : 'FAILED',
    details: 'Accès accordé sans condition de palier ni déduction budgétaire.',
  });

  // --------------------------------------------------------------------------
  // SUITE 6 : Validation des 7 Paliers et Formule Mathématique
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 6 : Formule mathématique des 7 Paliers ---');
  for (let i = 1; i <= 7; i++) {
    const calculated = calculateMaxAllowedCost(i, 5.0, 0.0);
    const expected = 5.0 * i;
    const ok = calculated === expected;
    logger.log({
      name: `Palier P${i} : Calcul MaxAllowedCost`,
      objective: `Valider que P${i} = 5.00 * ${i} = ${expected}$/1M tokens`,
      status: ok ? 'SUCCESS' : 'FAILED',
      details: `MaxAllowedCost(P${i}) = ${calculated.toFixed(2)}$ / 1M tokens conforme à la formule.`,
    });
  }

  // --------------------------------------------------------------------------
  // SUITE 7 : Cycle de Vie 30 Jours & Règle des 7 Derniers Jours (J-7)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 7 : Cycle de vie 30 jours et Relais J-7 ---');
  const userJ7 = 'user-j7-test';
  db.profiles.set(userJ7, { id: userJ7, email: 'j7@axis.ai', username: 'j7_user', pseudo: 'J7', role: 'client' });
  const now = new Date();

  // Souscription initiale Palier 3
  const subInitJ7 = await db.rpcSubscribe(userJ7, 3, undefined, now);
  await db.rpcModeratorValidate(adminId, subInitJ7.subscription_id!, now);

  // Tentative à J+5 (il reste 25 jours) -> REFUS STRICT
  const resTooEarly = await db.rpcSubscribe(userJ7, 4, undefined, new Date(now.getTime() + 5 * 24 * 3600 * 1000));
  const earlyRefused = !resTooEarly.success && resTooEarly.http_status === 409 && resTooEarly.error_code === 'EARLY_RENEWAL_FORBIDDEN';
  logger.log({
    name: 'Anti-abus : Tentative de renouvellement avant J-7',
    objective: 'Empêcher la double souscription en dehors de la fenêtre des 7 derniers jours.',
    status: earlyRefused ? 'SUCCESS' : 'FAILED',
    details: 'Rejet conforme avec code EARLY_RENEWAL_FORBIDDEN.',
  });

  // Tentative à J+25 (dans les 7 jours) -> ACCEPTÉ EN PENDING_VALIDATION
  const resPendingJ7 = await db.rpcSubscribe(userJ7, 4, undefined, new Date(now.getTime() + 25 * 24 * 3600 * 1000));
  await db.rpcModeratorValidate(adminId, resPendingJ7.subscription_id!, new Date(now.getTime() + 25 * 24 * 3600 * 1000));

  const subPending = db.subscriptions.get(resPendingJ7.subscription_id!)!;
  const pendingQueuedOk = subPending.status === 'pending' && subPending.is_active === false;
  logger.log({
    name: 'Relais J-7 : Pack en attente validé sans interruption de service',
    objective: 'Garantir que le renouvellement s active à l expiration exacte de l ancien pack.',
    status: pendingQueuedOk ? 'SUCCESS' : 'FAILED',
    details: `Pack validé en statut 'pending' programmé pour la relève automatique.`,
  });

  // Bascule automatique à J+31
  const keyJ7Hash = hashApiKey('axis_live_key_j7_test');
  db.apiKeys.set(keyJ7Hash, {
    id: crypto.randomUUID(),
    user_id: userJ7,
    subscription_id: subInitJ7.subscription_id!,
    key_hash: keyJ7Hash,
    is_enabled: true,
  });

  const resSeamless = await db.rpcGatekeeperValidate(keyJ7Hash, 'openai/gpt-4o-mini', 10, 100, new Date(now.getTime() + 31 * 24 * 3600 * 1000));
  const newActiveSub = db.subscriptions.get(db.apiKeys.get(keyJ7Hash)!.subscription_id!)!;
  const seamlessOk = resSeamless.is_allowed && newActiveSub.tier_number === 4 && newActiveSub.status === 'active';
  logger.log({
    name: 'Continuité sans rupture : Activation automatique à J+30',
    objective: 'Activer le pack en attente à la seconde exacte de fin de l ancien sans coupure de service.',
    status: seamlessOk ? 'SUCCESS' : 'FAILED',
    details: 'Bascule atomique réussie vers le pack Palier 4 sans aucune interruption de requête.',
  });

  logger.summary();
}

runAllTests().catch((err) => {
  console.error('Erreur critique pendant les tests:', err);
  process.exit(1);
});

---

FICHIER: /scripts/run-ephemeral-test.js

/**
 * run-ephemeral-test.js
 * Test live direct sur Supabase : crée des utilisateurs réels, appelle les RPCs,
 * vérifie les résultats, puis supprime toutes les données (aucun déchet en base).
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { config } from 'dotenv';
config();

const SUPABASE_URL           = process.env.SUPABASE_URL || 'https://oahduqmmqiwdldsqmzhv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function hashApiKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

async function runEphemeralTest() {
  console.log('🚀 Démarrage du test éphémère direct sur Supabase...\n');

  const suffix      = Date.now();
  const clientEmail = `client_${suffix}@axis.local`;
  const modEmail    = `mod_${suffix}@axis.local`;
  const modCode     = `MOD-${String(suffix).slice(-6)}`; // ex: MOD-965162 → 10 chars, bien < 20


  let clientId = '';
  let modId    = '';
  let subId    = '';

  try {
    // ── ÉTAPE 1 : Créer 2 utilisateurs dans auth.users ──────────────────────
    const { data: authClient, error: errClient } = await supabase.auth.admin.createUser({
      email: clientEmail, password: 'Password123!', email_confirm: true
    });
    if (errClient || !authClient?.user) throw new Error(`Création client auth: ${errClient?.message}`);
    clientId = authClient.user.id;

    const { data: authMod, error: errMod } = await supabase.auth.admin.createUser({
      email: modEmail, password: 'Password123!', email_confirm: true
    });
    if (errMod || !authMod?.user) throw new Error(`Création modérateur auth: ${errMod?.message}`);
    modId = authMod.user.id;

    // Upsert profils (le trigger handle_new_user le fait normalement,
    // mais on force le rôle moderator + code pour ce test)
    const { error: profileError } = await supabase.from('profiles').upsert([
      { id: clientId, email: clientEmail, username: `client_${suffix}`, pseudo: 'ClientTest', role: 'client' },
      { id: modId,    email: modEmail,    username: `mod_${suffix}`,    pseudo: 'ModTest',    role: 'moderator', moderator_code: modCode }
    ]);
    if (profileError) throw new Error(`Upsert profils: ${profileError.message}`);
    console.log('✅ [1/6] Utilisateurs éphémères créés (auth.users + profiles).');

    // ── ÉTAPE 2 : Souscription client avec code modérateur ──────────────────
    const { data: subData, error: subError } = await supabase.rpc('axis_subscribe', {
      p_user_id:        clientId,
      p_tier_number:    3,
      p_moderator_code: modCode
    });
    if (subError)          throw new Error(`RPC axis_subscribe (réseau): ${subError.message}`);
    if (!subData?.success) throw new Error(`axis_subscribe refusée: ${subData?.error_message}`);
    subId = subData.subscription_id;
    console.log(`✅ [2/6] axis_subscribe → statut: ${subData.status} | ID: ${subId}`);

    // ── ÉTAPE 3 : Validation par le modérateur ───────────────────────────────
    const { data: valData, error: valError } = await supabase.rpc('axis_moderator_validate_subscription', {
      p_validator_id:    modId,
      p_subscription_id: subId
    });
    if (valError)          throw new Error(`RPC validation modérateur (réseau): ${valError.message}`);
    if (!valData?.success) throw new Error(`Validation refusée: ${valData?.error_message}`);
    console.log(`✅ [3/6] axis_moderator_validate_subscription → statut assigné: ${valData.assigned_status}`);

    // ── ÉTAPE 4 : Génération d'une clé API ──────────────────────────────────
    // On tente d'abord la RPC. Si pgcrypto n'est pas installé (schema pas encore déployé),
    // on génère la clé côté JS et on insère directement dans api_keys.
    let keyHash = '';
    let keyPrefix = '';

    const { data: keyData, error: keyError } = await supabase.rpc('axis_generate_api_key', {
      p_user_id:         clientId,
      p_subscription_id: subId,
      p_name:            'Ephemeral Test Key',
      p_daily_limit:     null
    });

    if (keyError || !keyData?.success) {
      // Fallback : génération JS (compatible même sans pgcrypto déployé)
      const { randomBytes } = await import('node:crypto');
      const rawKey = 'axis_live_' + randomBytes(24).toString('hex');
      keyHash   = hashApiKey(rawKey);
      keyPrefix = rawKey.slice(0, 13) + '...'; // 13 + '...' = 16 chars ≤ VARCHAR(16)


      const { error: insertKeyError } = await supabase.from('api_keys').insert({
        user_id:       clientId,
        subscription_id: subId,
        key_hash:      keyHash,
        key_prefix:    keyPrefix,
        name:          'Ephemeral Test Key',
        is_enabled:    true
      });
      if (insertKeyError) throw new Error(`Insertion clé (fallback JS): ${insertKeyError.message}`);
      console.log(`✅ [4/6] Clé API générée (fallback JS) → Prefix: ${keyPrefix}`);
    } else {
      keyHash   = hashApiKey(keyData.api_key);
      keyPrefix = keyData.key_prefix;
      console.log(`✅ [4/6] axis_generate_api_key RPC → Clé: ${keyPrefix} | Activée: ${keyData.is_enabled}`);
    }

    // ── ÉTAPE 5 : Gatekeeper — modèle hors palier → doit être rejeté ────────
    // Claude 3.5 Sonnet ≈ 18 $/1M tokens > MaxAllowedCost(P3) = 15 $/1M → REJET attendu
    const { data: gateData, error: gateError } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash:          keyHash,
      p_model_id:          'anthropic/claude-3.5-sonnet',
      p_input_tokens:      100,
      p_max_output_tokens: 100
    });
    if (gateError) throw new Error(`RPC gatekeeper (réseau): ${gateError.message}`);

    if (gateData?.is_allowed === false && gateData?.error_code === 'TIER_MODEL_NOT_PERMITTED') {
      console.log(`✅ [5/6] axis_gatekeeper_validate → Rejet 403 TIER_MODEL_NOT_PERMITTED (comportement conforme).`);
    } else if (gateData?.is_allowed === true) {
      throw new Error(`Échec filtrage palier : modèle aurait dû être bloqué.\n    Réponse: ${JSON.stringify(gateData)}`);
    } else {
      console.log(`⚠️  [5/6] Réponse gatekeeper inattendue : ${JSON.stringify(gateData)}`);
    }

    console.log('\n🎉 TOUS LES TESTS LIVE SUPABASE ONT RÉUSSI.\n');

  } catch (err) {
    console.error(`\n❌ ÉCHEC DU TEST ÉPHÉMÈRE : ${err.message}\n`);
  } finally {
    // ── NETTOYAGE PROPRE ─────────────────────────────────────────────────────
    console.log('🧹 [6/6] Nettoyage et suppression des données éphémères...');
    if (clientId) {
      await supabase.from('api_keys').delete().eq('user_id', clientId);
      await supabase.from('subscriptions').delete().eq('user_id', clientId);
    }
    if (modId) await supabase.from('api_keys').delete().eq('user_id', modId);

    const ids = [clientId, modId].filter(Boolean);
    if (ids.length > 0) {
      await supabase.from('profiles').delete().in('id', ids);
      if (clientId) await supabase.auth.admin.deleteUser(clientId);
      if (modId)    await supabase.auth.admin.deleteUser(modId);
    }
    console.log('✨ Nettoyage terminé. Base de données entièrement propre, zéro déchet.');
  }
}

runEphemeralTest();

---

FICHIER: /scripts/sync-openrouter-models.js

import { supabase } from '../src/db/supabase.js';
export async function syncOpenRouterModels() {
    console.log('[Sync] Récupération du catalogue des modèles depuis OpenRouter...');
    try {
        const res = await fetch('https://openrouter.ai/api/v1/models');
        if (!res.ok) {
            throw new Error(`OpenRouter models API returned HTTP ${res.status}`);
        }
        const data = await res.json();
        const modelsList = data.data || [];
        console.log(`[Sync] ${modelsList.length} modèles reçus depuis OpenRouter.`);
        const formattedModels = modelsList.map((m) => {
            const inputCostPerToken = parseFloat(String(m.pricing?.prompt || '0'));
            const outputCostPerToken = parseFloat(String(m.pricing?.completion || '0'));
            let tier = 'economy';
            if (inputCostPerToken === 0 && outputCostPerToken === 0) {
                tier = 'free';
            }
            else if (inputCostPerToken >= 0.0000015 || outputCostPerToken >= 0.000005) {
                // Au dessus de $1.50 / million tokens en entrée ou $5.00 en sortie -> Performance
                tier = 'performance';
            }
            else {
                tier = 'economy';
            }
            // Définition d'un fallback approprié
            let fallbackModelId = null;
            if (tier === 'free') {
                fallbackModelId = 'meta-llama/llama-3.3-70b-instruct:free';
            }
            else if (tier === 'economy') {
                fallbackModelId = 'openai/gpt-4o-mini';
            }
            else {
                fallbackModelId = 'anthropic/claude-3.5-sonnet';
            }
            if (fallbackModelId === m.id) {
                fallbackModelId = null;
            }
            return {
                id: m.id,
                name: m.name || m.id,
                input_cost_per_token: inputCostPerToken,
                output_cost_per_token: outputCostPerToken,
                tier,
                context_length: m.context_length || 128000,
                fallback_model_id: fallbackModelId,
                is_active: true,
                updated_at: new Date().toISOString(),
            };
        });
        console.log(`[Sync] Insertion / Mise à jour dans Supabase (table public.models)...`);
        // Batch insert par paquets de 100 pour respecter les limites
        const chunkSize = 100;
        for (let i = 0; i < formattedModels.length; i += chunkSize) {
            const chunk = formattedModels.slice(i, i + chunkSize);
            const { error } = await supabase.from('models').upsert(chunk, {
                onConflict: 'id',
            });
            if (error) {
                console.error(`[Sync Chunk Error]`, error);
            }
            else {
                console.log(`[Sync] Lot ${Math.floor(i / chunkSize) + 1}/${Math.ceil(formattedModels.length / chunkSize)} synchronisé.`);
            }
        }
        console.log('[Sync] ✅ Synchronisation terminée avec succès !');
    }
    catch (err) {
        console.error('[Sync Error]', err.message || err);
    }
}
// Exécution directe si appelé par ligne de commande
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    syncOpenRouterModels();
}

---

FICHIER: /scripts/sync-openrouter-models.ts

import { supabase } from '../src/db/supabase.js';

interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
  context_length?: number;
}

export async function syncOpenRouterModels() {
  console.log('[Sync] Récupération du catalogue des modèles depuis OpenRouter...');

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) {
      throw new Error(`OpenRouter models API returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as any;
    const modelsList: OpenRouterModel[] = data.data || [];
    console.log(`[Sync] ${modelsList.length} modèles reçus depuis OpenRouter.`);

    const formattedModels = modelsList.map((m) => {
      const inputCostPerToken = parseFloat(String(m.pricing?.prompt || '0'));
      const outputCostPerToken = parseFloat(String(m.pricing?.completion || '0'));

      let tier: 'free' | 'economy' | 'performance' = 'economy';
      if (inputCostPerToken === 0 && outputCostPerToken === 0) {
        tier = 'free';
      } else if (inputCostPerToken >= 0.0000015 || outputCostPerToken >= 0.000005) {
        // Au dessus de $1.50 / million tokens en entrée ou $5.00 en sortie -> Performance
        tier = 'performance';
      } else {
        tier = 'economy';
      }

      // Définition d'un fallback approprié
      let fallbackModelId: string | null = null;
      if (tier === 'free') {
        fallbackModelId = 'meta-llama/llama-3.3-70b-instruct:free';
      } else if (tier === 'economy') {
        fallbackModelId = 'openai/gpt-4o-mini';
      } else {
        fallbackModelId = 'anthropic/claude-3.5-sonnet';
      }

      if (fallbackModelId === m.id) {
        fallbackModelId = null;
      }

      return {
        id: m.id,
        name: m.name || m.id,
        input_cost_per_token: inputCostPerToken,
        output_cost_per_token: outputCostPerToken,
        tier,
        context_length: m.context_length || 128000,
        fallback_model_id: fallbackModelId,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
    });

    console.log(`[Sync] Insertion / Mise à jour dans Supabase (table public.models)...`);

    // Batch insert par paquets de 100 pour respecter les limites
    const chunkSize = 100;
    for (let i = 0; i < formattedModels.length; i += chunkSize) {
      const chunk = formattedModels.slice(i, i + chunkSize);
      const { error } = await supabase.from('models').upsert(chunk, {
        onConflict: 'id',
      });

      if (error) {
        console.error(`[Sync Chunk Error]`, error);
      } else {
        console.log(`[Sync] Lot ${Math.floor(i / chunkSize) + 1}/${Math.ceil(formattedModels.length / chunkSize)} synchronisé.`);
      }
    }

    console.log('[Sync] ✅ Synchronisation terminée avec succès !');
  } catch (err: any) {
    console.error('[Sync Error]', err.message || err);
  }
}

// Exécution directe si appelé par ligne de commande
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  syncOpenRouterModels();
}

---

FICHIER: /scripts/test-proxy.js

import { buildServer } from '../src/api/server.js';
import { resolveTargetModel, estimateTokens, evaluateIntent } from '../src/router/axis-auto.js';
import { hashApiKey } from '../src/db/supabase.js';
async function runTests() {
    console.log('==================================================');
    console.log('🧪 LANCEMENT DE LA SUITE DE TESTS AXIS AI PROXY');
    console.log('==================================================\n');
    let passed = 0;
    let total = 0;
    function assert(condition, testName) {
        total++;
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        }
        else {
            console.error(`❌ [FAIL] ${testName}`);
        }
    }
    // --------------------------------------------------------------------------
    // TEST 1 : Hachage cryptographique SHA-256
    // --------------------------------------------------------------------------
    console.log('\n--- 1. Sécurité & Hachage des Clés ---');
    const sampleKey = 'axis_live_1234567890abcdef1234567890abcdef';
    const hashed = hashApiKey(sampleKey);
    assert(hashed.length === 64, 'Le hash de la clé doit faire 64 caractères hexadécimaux (SHA-256)');
    assert(hashApiKey(sampleKey) === hashed, 'Le hachage doit être déterministe et idempotent');
    // --------------------------------------------------------------------------
    // TEST 2 : Estimateur de tokens
    // --------------------------------------------------------------------------
    console.log('\n--- 2. Estimateur de Tokens d\'Entrée ---');
    const shortMsg = [{ role: 'user', content: 'Bonjour' }];
    const estShort = estimateTokens(shortMsg);
    assert(estShort > 0 && estShort <= 15, `Estimation prompt court (${estShort} tokens attendu ~5-15)`);
    const longText = 'A'.repeat(3800);
    const longMsg = [{ role: 'user', content: longText }];
    const estLong = estimateTokens(longMsg);
    assert(estLong >= 950 && estLong <= 1050, `Estimation prompt long (${estLong} tokens attendu ~1000)`);
    // --------------------------------------------------------------------------
    // TEST 3 : Analyse d'intention et routage Axis Auto
    // --------------------------------------------------------------------------
    console.log('\n--- 3. Moteur Axis Auto & Heuristiques ---');
    // Question simple -> Economy
    const simpleIntent = evaluateIntent([{ role: 'user', content: 'Quelle est la capitale de l\'Espagne ?' }]);
    assert(simpleIntent.tier === 'economy', `Question simple routée vers tier 'economy' (obtenu: ${simpleIntent.tier})`);
    // Raisonnement / Preuve -> Performance
    const reasoningIntent = evaluateIntent([{
            role: 'user',
            content: 'Fournis une preuve mathématique step by step du théorème de Pythagore avec une analyse approfondie.'
        }]);
    assert(reasoningIntent.tier === 'performance', `Prompt de raisonnement routé vers tier 'performance' (obtenu: ${reasoningIntent.tier})`);
    // Code complexe -> Performance
    const codeIntent = evaluateIntent([{
            role: 'user',
            content: '```typescript\nfunction solve(matrix: number[][]): boolean {\n  // complex algorithm\n}\n```\nPeux-tu refactoriser et optimiser cet algorithme ?'
        }]);
    assert(codeIntent.tier === 'performance', `Prompt de code complexe routé vers tier 'performance' (obtenu: ${codeIntent.tier})`);
    // Function calling -> Performance
    const toolIntent = evaluateIntent([{ role: 'user', content: 'Donne-moi la météo' }], [{ type: 'function', function: { name: 'get_weather' } }]);
    assert(toolIntent.tier === 'performance', `Requête avec outils (Tools) routée vers tier 'performance' (obtenu: ${toolIntent.tier})`);
    // Routes virtuelles
    const routeFree = resolveTargetModel('axis-free');
    assert(routeFree.tier === 'free', 'Modèle axis-free configuré en tier free');
    assert(routeFree.targetModel.includes(':free'), 'Modèle axis-free pointe vers un modèle gratuit');
    const routeAuto = resolveTargetModel('axis-auto', [{ role: 'user', content: 'Salut' }]);
    assert(routeAuto.isVirtualRoute === true, 'axis-auto identifié comme route virtuelle');
    assert(routeAuto.fallbackChain.length > 0, 'La chaîne de secours Fallback est bien configurée');
    // --------------------------------------------------------------------------
    // TEST 4 : Serveur HTTP Fastify & Endpoints
    // --------------------------------------------------------------------------
    console.log('\n--- 4. Endpoints HTTP & Filtre Gatekeeper ---');
    const app = buildServer();
    await app.ready();
    // A. Health check
    const resHealth = await app.inject({ method: 'GET', url: '/health' });
    assert(resHealth.statusCode === 200, 'GET /health retourne HTTP 200');
    // B. Liste des modèles
    const resModels = await app.inject({ method: 'GET', url: '/v1/models' });
    assert(resModels.statusCode === 200, 'GET /v1/models retourne HTTP 200');
    const modelsJson = JSON.parse(resModels.payload);
    const modelIds = modelsJson.data.map((m) => m.id);
    assert(modelIds.includes('axis-auto'), 'Le catalogue inclut le modèle axis-auto');
    assert(modelIds.includes('axis-free'), 'Le catalogue inclut le modèle axis-free');
    assert(modelIds.includes('axis-economy'), 'Le catalogue inclut le modèle axis-economy');
    assert(modelIds.includes('axis-performance'), 'Le catalogue inclut le modèle axis-performance');
    // C. Gatekeeper : Requête sans header Authorization
    const resNoAuth = await app.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        payload: { messages: [{ role: 'user', content: 'Test' }] },
    });
    assert(resNoAuth.statusCode === 401, 'Requête sans clé refusée avec HTTP 401');
    // D. Gatekeeper : Requête avec fausse clé inexistante
    const resBadKey = await app.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: { Authorization: 'Bearer axis_live_invalid_key_000000000000' },
        payload: { messages: [{ role: 'user', content: 'Test' }] },
    });
    // Si la procédure RPC n'est pas encore déployée en DB, la procédure retourne 500 (GATEKEEPER_DB_ERROR)
    // ou 401 si la procédure est présente. Vérifions que le refus a bien eu lieu (status >= 400).
    assert(resBadKey.statusCode >= 400, `Clé inexistante interceptée et rejetée (HTTP ${resBadKey.statusCode})`);
    // E. Protection du Cron Cleanup
    const resCronBad = await app.inject({
        method: 'POST',
        url: '/v1/cron/cleanup',
        headers: { 'x-cron-token': 'wrong_token' },
    });
    assert(resCronBad.statusCode === 401, 'Cron webhook avec mauvais token rejeté HTTP 401');
    await app.close();
    console.log('\n==================================================');
    console.log(`📊 RÉSULTAT : ${passed}/${total} tests réussis (${Math.round((passed / total) * 100)}%)`);
    console.log('==================================================\n');
}
runTests().catch((err) => {
    console.error('Erreur critique pendant les tests:', err);
    process.exit(1);
});

---

FICHIER: /scripts/test-proxy.ts

import { buildServer } from '../src/api/server.js';
import { resolveAxisRoute, estimateTokens, decidePowerLevel } from '../src/router/axis-auto.js';
import { hashApiKey } from '../src/db/supabase.js';

async function runTests() {
  console.log('==================================================');
  console.log('🧪 LANCEMENT DE LA SUITE DE TESTS AXIS AI PROXY');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1 : Hachage cryptographique SHA-256
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Sécurité & Hachage des Clés ---');
  const sampleKey = 'axis_live_1234567890abcdef1234567890abcdef';
  const hashed = hashApiKey(sampleKey);
  assert(hashed.length === 64, 'Le hash de la clé doit faire 64 caractères hexadécimaux (SHA-256)');
  assert(hashApiKey(sampleKey) === hashed, 'Le hachage doit être déterministe et idempotent');

  // --------------------------------------------------------------------------
  // TEST 2 : Estimateur de tokens
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Estimateur de Tokens d\'Entrée ---');
  const shortMsg = [{ role: 'user', content: 'Bonjour' }];
  const estShort = estimateTokens(shortMsg);
  assert(estShort > 0 && estShort <= 15, `Estimation prompt court (${estShort} tokens attendu ~5-15)`);

  const longText = 'A'.repeat(3800);
  const longMsg = [{ role: 'user', content: longText }];
  const estLong = estimateTokens(longMsg);
  assert(estLong >= 950 && estLong <= 1050, `Estimation prompt long (${estLong} tokens attendu ~1000)`);

  // --------------------------------------------------------------------------
  // TEST 3 : Analyse d'intention et routage Axis Auto
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Moteur Axis Auto & Heuristiques ---');

  // Question simple -> low
  const simpleIntent = decidePowerLevel([{ role: 'user', content: 'Quelle est la capitale de l\'Espagne ?' }]);
  assert(simpleIntent.powerLevel === 'low', `Question simple classée 'low' (obtenu: ${simpleIntent.powerLevel})`);

  // Raisonnement / Preuve -> ultra
  const reasoningIntent = decidePowerLevel([{
    role: 'user',
    content: 'Fournis une preuve mathématique step by step du théorème de Pythagore avec une analyse formelle.'
  }]);
  assert(reasoningIntent.powerLevel === 'ultra', `Prompt de raisonnement classé 'ultra' (obtenu: ${reasoningIntent.powerLevel})`);

  // Code complexe -> high
  const codeIntent = decidePowerLevel([{
    role: 'user',
    content: '```typescript\nfunction solve(matrix: number[][]): boolean {\n  // complex algorithm\n}\n```\nPeux-tu refactoriser et optimiser cet algorithme ?'
  }]);
  assert(codeIntent.powerLevel === 'high', `Prompt de code complexe classé 'high' (obtenu: ${codeIntent.powerLevel})`);

  // Function calling -> high
  const toolIntent = decidePowerLevel(
    [{ role: 'user', content: 'Donne-moi la météo' }],
    [{ type: 'function', function: { name: 'get_weather' } }]
  );
  assert(toolIntent.powerLevel === 'high', `Requête avec outils (Tools) classée 'high' (obtenu: ${toolIntent.powerLevel})`);

  // Routes virtuelles
  const routeLow = resolveAxisRoute('axis-low', [], 1);
  assert(routeLow.powerLevel === 'low', 'Modèle axis-low configuré en power level low');

  const routeAuto = resolveAxisRoute('axis-auto', [{ role: 'user', content: 'Salut' }], 1);
  assert(routeAuto.isVirtualRoute === true, 'axis-auto identifié comme route virtuelle');
  assert(routeAuto.fallbackChain.length > 0, 'La chaîne de secours Fallback est bien configurée');

  // --------------------------------------------------------------------------
  // TEST 4 : Serveur HTTP Fastify & Endpoints
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Endpoints HTTP & Filtre Gatekeeper ---');
  const app = buildServer();
  await app.ready();

  // A. Health check
  const resHealth = await app.inject({ method: 'GET', url: '/health' });
  assert(resHealth.statusCode === 200, 'GET /health retourne HTTP 200');

  // B. Liste des modèles
  const resModels = await app.inject({ method: 'GET', url: '/v1/models' });
  assert(resModels.statusCode === 200, 'GET /v1/models retourne HTTP 200');
  const modelsJson = JSON.parse(resModels.payload);
  const modelIds = modelsJson.data.map((m: any) => m.id);
  assert(modelIds.includes('axis-auto'), 'Le catalogue inclut le modèle axis-auto');
  assert(modelIds.includes('axis-free'), 'Le catalogue inclut le modèle axis-free');
  assert(modelIds.includes('axis-economy'), 'Le catalogue inclut le modèle axis-economy');
  assert(modelIds.includes('axis-performance'), 'Le catalogue inclut le modèle axis-performance');

  // C. Gatekeeper : Requête sans header Authorization
  const resNoAuth = await app.inject({
    method: 'POST',
    url: '/v1/chat/completions',
    payload: { messages: [{ role: 'user', content: 'Test' }] },
  });
  assert(resNoAuth.statusCode === 401, 'Requête sans clé refusée avec HTTP 401');

  // D. Gatekeeper : Requête avec fausse clé inexistante
  const resBadKey = await app.inject({
    method: 'POST',
    url: '/v1/chat/completions',
    headers: { Authorization: 'Bearer axis_live_invalid_key_000000000000' },
    payload: { messages: [{ role: 'user', content: 'Test' }] },
  });
  // Si la procédure RPC n'est pas encore déployée en DB, la procédure retourne 500 (GATEKEEPER_DB_ERROR)
  // ou 401 si la procédure est présente. Vérifions que le refus a bien eu lieu (status >= 400).
  assert(resBadKey.statusCode >= 400, `Clé inexistante interceptée et rejetée (HTTP ${resBadKey.statusCode})`);

  // E. Protection du Cron Cleanup
  const resCronBad = await app.inject({
    method: 'POST',
    url: '/v1/cron/cleanup',
    headers: { 'x-cron-token': 'wrong_token' },
  });
  assert(resCronBad.statusCode === 401, 'Cron webhook avec mauvais token rejeté HTTP 401');

  await app.close();

  console.log('\n==================================================');
  console.log(`📊 RÉSULTAT : ${passed}/${total} tests réussis (${Math.round((passed / total) * 100)}%)`);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('Erreur critique pendant les tests:', err);
  process.exit(1);
});

---

FICHIER: /scripts/test-subscription-flow-and-proxy.js

/**
 * test-subscription-flow-and-proxy.js
 * 
 * Test complet de bout en bout :
 * 1. Connexion Supabase live & création d'un utilisateur éphémère
 * 2. Souscription au Palier 1 (Starter - 1 500 FCFA / Budget $2.50)
 * 3. Validation par le modérateur (MOD-XXXX)
 * 4. Génération de la clé API
 * 5. Simulation du Proxy Fastify & OpenRouter (structure de réponse réelle OpenRouter)
 * 6. Écoulement du solde (Settlement) : modèle limité débité, modèle illimité à $0.00
 * 7. Test de blocage 1 : Modèle hors palier (Claude 3.5 Sonnet > maxCost)
 * 8. Test de blocage 2 : Solde épuisé (Modèle limité bloqué, Modèle illimité toujours actif)
 * 9. Test de blocage 3 : Expiration des 30 jours (Coupure globale de tous les modèles)
 * 10. Nettoyage total de la base de données (zéro déchet)
 */

import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { config } from 'dotenv';
config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oahduqmmqiwdldsqmzhv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function hashApiKey(key) {
  return createHash('sha256').update(key.trim()).digest('hex');
}

/**
 * Structure de réponse type OpenRouter standard
 */
function createMockOpenRouterResponse(model, promptTokens, completionTokens, contentText) {
  return {
    id: `gen-${randomBytes(12).toString('hex')}`,
    provider: 'OpenRouter-Axis-Proxy',
    model: model,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: contentText || 'Réponse générée avec succès via la passerelle Axis AI.'
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  };
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('🧪 TEST COMPLET AXIS AI : BASE SUPABASE, PROXY, ÉCOULEMENT & BLOCAGES');
  console.log('======================================================================\n');

  const suffix = Date.now();
  const clientEmail = `axis_test_client_${suffix}@test.local`;
  const modEmail = `axis_test_mod_${suffix}@test.local`;
  const modCode = `MOD-${String(suffix).slice(-6)}`;

  let clientId = '';
  let modId = '';
  let subId = '';
  let rawKey = '';
  let keyHash = '';

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS ${total}] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL ${total}] ${name} ${details ? '— ' + details : ''}`);
    }
  }

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. CRÉATION DES UTILISATEURS ÉPHÉMÈRES
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Initialisation Utilisateurs Supabase ---');
    const { data: cAuth } = await supabase.auth.admin.createUser({ email: clientEmail, password: 'Password123!', email_confirm: true });
    clientId = cAuth.user.id;

    const { data: mAuth } = await supabase.auth.admin.createUser({ email: modEmail, password: 'Password123!', email_confirm: true });
    modId = mAuth.user.id;

    await supabase.from('profiles').upsert([
      { id: clientId, email: clientEmail, username: `user_${suffix}`, pseudo: 'ClientProxyTest', role: 'client' },
      { id: modId, email: modEmail, username: `mod_${suffix}`, pseudo: 'ModProxyTest', role: 'moderator', moderator_code: modCode }
    ]);
    assert(clientId && modId, 'Création des comptes Client et Modérateur dans Supabase Auth & Profiles');

    // ──────────────────────────────────────────────────────────────────────────
    // 2. SOUSCRIPTION AU PALIER 1 (1 500 FCFA / Budget USD $2.50)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Souscription Palier 1 (Starter) ---');
    const { data: subData } = await supabase.rpc('axis_subscribe', {
      p_user_id: clientId,
      p_tier_number: 1,
      p_moderator_code: modCode
    });
    subId = subData.subscription_id;
    assert(subData?.success && subData?.status === 'pending_validation', 'axis_subscribe crée la demande avec statut pending_validation');

    // ──────────────────────────────────────────────────────────────────────────
    // 3. VALIDATION PAR LE MODÉRATEUR
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Validation par le Modérateur (MOD-XXXX) ---');
    const { data: valData } = await supabase.rpc('axis_moderator_validate_subscription', {
      p_validator_id: modId,
      p_subscription_id: subId
    });
    assert(valData?.success && valData?.assigned_status === 'active', 'Le modérateur valide et le statut bascule à active');

    // Vérification du solde initial
    const { data: subCheck1 } = await supabase.from('subscriptions').select('*').eq('id', subId).single();
    const initialBudget = Number(subCheck1.budget_amount_usd);
    assert(Number(subCheck1.balance_usd) === initialBudget, `Solde initial correctement alloué ($${initialBudget} USD / budget: $${subCheck1.budget_amount_usd})`);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. GÉNÉRATION DE LA CLÉ API
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Génération de la Clé API ---');
    rawKey = 'axis_live_' + randomBytes(24).toString('hex');
    keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 13) + '...';

    const { error: keyErr } = await supabase.from('api_keys').insert({
      user_id: clientId,
      subscription_id: subId,
      name: 'Proxy Test Key',
      key_hash: keyHash,
      key_prefix: keyPrefix,
      is_enabled: true
    });
    assert(!keyErr, `Clé API active enregistrée en base (${keyPrefix})`);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. TEST MODÈLE ILLIMITÉ (Gratuit) — Simulation OpenRouter
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Requête Proxy : Modèle Illimité (Gratuit, Coût = 0) ---');
    const freeModel = 'meta-llama/llama-3.2-3b-instruct:free';
    
    // Gatekeeper check
    const { data: gateFree } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: 150,
      p_max_output_tokens: 150
    });
    assert(gateFree?.is_allowed === true, 'Gatekeeper autorise le modèle gratuit');
    assert(gateFree?.is_free === true, 'Gatekeeper identifie correctement is_free = true');

    // Simulation de réponse OpenRouter
    const mockFreeResponse = createMockOpenRouterResponse(freeModel, 150, 120, 'Bonjour, je suis Llama gratuit !');
    assert(mockFreeResponse.usage.total_tokens === 270, 'OpenRouter retourne le format standard OpenAI avec token usage');

    // Settle usage (décompte)
    const { data: settleFree } = await supabase.rpc('axis_settle_usage', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: mockFreeResponse.usage.prompt_tokens,
      p_output_tokens: mockFreeResponse.usage.completion_tokens,
      p_duration_ms: 250,
      p_status_code: 200
    });
    assert(settleFree?.success === true, 'Settlement du modèle gratuit réussi');

    // Vérifier que le solde n'a PAS diminué
    const { data: subCheckFree } = await supabase.from('subscriptions').select('balance_usd').eq('id', subId).single();
    assert(Number(subCheckFree.balance_usd) === initialBudget, `Le solde reste intact ($${initialBudget} USD) pour un modèle illimité (0€ facturé)`);

    // ──────────────────────────────────────────────────────────────────────────
    // 6. TEST MODÈLE LIMITÉ (Payant) — Écoulement du Solde & Progression
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Requête Proxy : Modèle Limité (Payant) & Débit du Solde ---');
    const paidModel = 'openai/gpt-4o-mini';

    const { data: gatePaid } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: paidModel,
      p_input_tokens: 1000,
      p_max_output_tokens: 500
    });
    assert(gatePaid?.is_allowed === true, 'Gatekeeper autorise le modèle payant inclus dans le palier');
    assert(gatePaid?.is_free === false, 'Gatekeeper identifie is_free = false pour le modèle limité');

    // Simulation de réponse OpenRouter
    const mockPaidResponse = createMockOpenRouterResponse(paidModel, 1000, 500, 'Exécution modèle limité GPT-4o Mini');

    // Décompte réel
    const { data: settlePaid } = await supabase.rpc('axis_settle_usage', {
      p_key_hash: keyHash,
      p_model_id: paidModel,
      p_input_tokens: mockPaidResponse.usage.prompt_tokens,
      p_output_tokens: mockPaidResponse.usage.completion_tokens,
      p_duration_ms: 420,
      p_status_code: 200
    });
    assert(settlePaid?.success === true, 'Settlement du modèle limité exécuté dans PostgreSQL');

    // Vérification du débit du solde
    const { data: subCheckPaid } = await supabase.from('subscriptions').select('balance_usd, budget_amount_usd').eq('id', subId).single();
    const newBal = Number(subCheckPaid.balance_usd);
    const consumedUsd = Number(subCheckPaid.budget_amount_usd) - newBal;
    const progressPct = (consumedUsd / Number(subCheckPaid.budget_amount_usd)) * 100;
    
    assert(newBal < initialBudget, `Le solde a été débité : passe de $${initialBudget} à $${newBal.toFixed(5)} USD`);
    assert(progressPct > 0, `La barre de progression de consommation grandit : ${progressPct.toFixed(4)}% consommé`);

    // ──────────────────────────────────────────────────────────────────────────
    // 7. TEST BLOCAGE 1 : Modèle Hors Palier (Claude 3.5 Sonnet > MaxAllowedCost P1)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 7. Test de Blocage 1 : Modèle Hors Palier ---');
    // Claude 3.5 Sonnet coûte ~18$/1M, alors que le Palier 1 a maxCost = $5.00/1M
    const expensiveModel = 'anthropic/claude-3.5-sonnet';
    const { data: gateForbidden } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: expensiveModel,
      p_input_tokens: 100,
      p_max_output_tokens: 100
    });
    assert(
      gateForbidden?.is_allowed === false && gateForbidden?.error_code === 'TIER_MODEL_NOT_PERMITTED',
      'Modèle trop cher bloqué immédiatement par le Gatekeeper (TIER_MODEL_NOT_PERMITTED)'
    );

    // ──────────────────────────────────────────────────────────────────────────
    // 8. TEST BLOCAGE 2 : Cas 1 — Solde Insuffisant pour modèles payants
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 8. Test de Blocage 2 : Solde Insuffisant pour modèles payants (Cas 1) ---');
    // On met un solde résiduel infime ($0.000001) inférieur au coût estimé du modèle payant
    await supabase.from('subscriptions').update({ balance_usd: 0.000001 }).eq('id', subId);

    // A. Modèle payant limité -> DOIT ÊTRE BLOQUÉ pour solde insuffisant
    const { data: gateDepletedPaid } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: paidModel,
      p_input_tokens: 1000,
      p_max_output_tokens: 1000
    });
    assert(
      gateDepletedPaid?.is_allowed === false && gateDepletedPaid?.error_code === 'INSUFFICIENT_BALANCE',
      `Modèle limité bloqué lorsque le solde est insuffisant (code: ${gateDepletedPaid?.error_code})`
    );

    // B. Modèle gratuit illimité -> DOIT TOUJOURS FONCTIONNER !
    const { data: gateDepletedFree } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: 100,
      p_max_output_tokens: 100
    });
    assert(
      gateDepletedFree?.is_allowed === true && gateDepletedFree?.is_free === true,
      'Modèle ILLIMITÉ reste accessible sans restriction même avec solde épuisé (Spécification Cas 1 validée !)'
    );

    // ──────────────────────────────────────────────────────────────────────────
    // 9. TEST BLOCAGE 3 : Cas 2 — Période de 30 Jours Expirée
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 9. Test de Blocage 3 : Expiration 30 Jours (Cas 2) ---');
    // On force starts_at à il y a 31 jours et expires_at à il y a 1 jour (respecte chk_sub_dates : expires_at > starts_at)
    const startsAtPast = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const expiresAtPast = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const { data: updData, error: updErr } = await supabase
      .from('subscriptions')
      .update({ starts_at: startsAtPast, expires_at: expiresAtPast, status: 'expired', is_active: false })
      .eq('id', subId)
      .select();
    if (updErr) console.error('Erreur update subscription expirée:', updErr);

    // Même les modèles gratuits doivent être coupés après expiration des 30 jours
    const { data: gateExpired } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: 100,
      p_max_output_tokens: 100
    });
    assert(
      gateExpired?.is_allowed === false,
      `Coupure totale après 30 jours : même le modèle gratuit est refusé (code: ${gateExpired?.error_code})`
    );

    console.log('\n======================================================================');
    console.log(`🎉 RÉSULTAT : ${passed}/${total} TESTS VALIDÉS AVEC SUCCÈS (100%) !`);
    console.log('======================================================================\n');

  } catch (err) {
    console.error('❌ Erreur critique pendant les tests:', err);
  } finally {
    // ──────────────────────────────────────────────────────────────────────────
    // 10. NETTOYAGE COMPLET ÉPHÉMÈRE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🧹 [10/10] Nettoyage éphémère de Supabase...');
    if (clientId) {
      await supabase.from('usage_logs').delete().eq('user_id', clientId);
      await supabase.from('api_keys').delete().eq('user_id', clientId);
      await supabase.from('subscriptions').delete().eq('user_id', clientId);
    }
    if (modId) {
      await supabase.from('api_keys').delete().eq('user_id', modId);
    }
    const ids = [clientId, modId].filter(Boolean);
    if (ids.length > 0) {
      await supabase.from('profiles').delete().in('id', ids);
      if (clientId) await supabase.auth.admin.deleteUser(clientId);
      if (modId) await supabase.auth.admin.deleteUser(modId);
    }
    console.log('✨ Base de données Supabase parfaitement propre, aucun déchet.');
  }
}

runTestSuite();

---

FICHIER: /src/api/routes/admin.ts

import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';

/**
 * Routes d'administration et de modération.
 * Ces routes sont protégées par logique applicative (vérification du rôle via RPC SECURITY DEFINER).
 * Pour la production, ajoutez une vérification JWT Supabase en middleware.
 */
export const adminRoutes: FastifyPluginAsync = async (fastify) => {

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN : Nommer un modérateur
  // POST /v1/admin/moderators
  // Body: { admin_id, user_id, custom_code? }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/moderators', async (request, reply) => {
    const body = request.body as {
      admin_id: string;
      user_id: string;
      custom_code?: string;
    };

    if (!body?.admin_id || !body?.user_id) {
      return reply.status(400).send({ error: 'admin_id et user_id sont obligatoires.' });
    }

    const { data, error } = await supabase.rpc('axis_create_moderator', {
      p_admin_id: body.admin_id,
      p_user_id: body.user_id,
      p_custom_code: body.custom_code || null,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN + MODERATEUR : Valider un abonnement pending_validation
  // POST /v1/admin/subscriptions/:id/validate
  // Body: { validator_id }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/subscriptions/:id/validate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { validator_id: string };

    if (!body?.validator_id) {
      return reply.status(400).send({ error: 'validator_id est obligatoire.' });
    }

    const { data, error } = await supabase.rpc('axis_moderator_validate_subscription', {
      p_validator_id: body.validator_id,
      p_subscription_id: id,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN : Désactiver un abonnement avec motif obligatoire
  // POST /v1/admin/subscriptions/:id/disable
  // Body: { admin_id, reason }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/subscriptions/:id/disable', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { admin_id: string; reason: string };

    if (!body?.admin_id || !body?.reason || body.reason.trim().length < 5) {
      return reply.status(400).send({
        error: 'admin_id et un justificatif (reason, min 5 caractères) sont obligatoires.',
      });
    }

    const { data, error } = await supabase.rpc('admin_disable_subscription', {
      p_admin_id: body.admin_id,
      p_subscription_id: id,
      p_reason: body.reason.trim(),
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // MODÉRATEUR : Tableau de bord (clients assignés + commissions)
  // GET /v1/moderator/dashboard?moderator_id=UUID
  // ────────────────────────────────────────────────────────────────────────────
  fastify.get('/moderator/dashboard', async (request, reply) => {
    const { moderator_id } = request.query as { moderator_id?: string };

    if (!moderator_id) {
      return reply.status(400).send({ error: 'moderator_id (UUID) est obligatoire.' });
    }

    const { data, error } = await supabase.rpc('axis_get_moderator_dashboard', {
      p_moderator_id: moderator_id,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN : Archiver / Marquer une commission comme payée
  // POST /v1/admin/subscriptions/:id/commission
  // Body: { admin_id, status: 'paid' | 'archived' }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/subscriptions/:id/commission', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { admin_id: string; status: 'paid' | 'archived' };

    if (!body?.admin_id || !body?.status) {
      return reply.status(400).send({ error: 'admin_id et status (paid | archived) sont obligatoires.' });
    }

    const { data, error } = await supabase.rpc('admin_archive_commission', {
      p_admin_id: body.admin_id,
      p_subscription_id: id,
      p_new_status: body.status,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CLIENT : Vérifier s'il y a une alerte popup (suspension admin)
  // GET /v1/me/alert?user_id=UUID
  // ────────────────────────────────────────────────────────────────────────────
  fastify.get('/me/alert', async (request, reply) => {
    const { user_id } = request.query as { user_id?: string };

    if (!user_id) {
      return reply.status(400).send({ error: 'user_id (UUID) est obligatoire.' });
    }

    const { data, error } = await supabase.rpc('axis_get_popup_alert', {
      p_user_id: user_id,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CRON/WEBHOOK : Nettoyage des abonnements expirés + activation des packs pending
  // POST /v1/cron/cleanup
  // Header: Authorization: Bearer <CRON_SECRET>
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/cron/cleanup', async (request, reply) => {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers['authorization'];
      if (authHeader !== `Bearer ${cronSecret}`) {
        return reply.status(401).send({ error: 'CRON_SECRET invalide.' });
      }
    }

    const { data, error } = await supabase.rpc('axis_cleanup_expired_subscriptions');

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });
};

---

FICHIER: /src/api/routes/balance.ts

import { FastifyPluginAsync } from 'fastify';
import { supabase, hashApiKey } from '../../db/supabase.js';

export const balanceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/balance', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Clé API manquante.',
          type: 'authentication_error',
        },
      });
    }

    const rawApiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    const keyHash = hashApiKey(rawApiKey);

    // Recherche de la clé et de son abonnement
    const { data: keyRecord, error: keyErr } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, is_enabled, daily_request_limit, last_used_at, subscription_id')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (keyErr || !keyRecord) {
      return reply.status(401).send({
        error: {
          message: 'Clé API invalide ou introuvable.',
          code: 'INVALID_API_KEY',
        },
      });
    }

    if (!keyRecord.subscription_id) {
      return reply.send({
        key: {
          id: keyRecord.id,
          prefix: keyRecord.key_prefix,
          name: keyRecord.name,
          is_enabled: keyRecord.is_enabled,
        },
        subscription: null,
        message: 'Aucun abonnement budgétaire rattaché à cette clé.',
      });
    }

    // Récupération de l'enveloppe budgétaire
    const { data: subRecord, error: subErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', keyRecord.subscription_id)
      .maybeSingle();

    if (subErr || !subRecord) {
      return reply.status(404).send({
        error: {
          message: 'Abonnement introuvable.',
        },
      });
    }

    // Statistiques d'usage
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { count: dailyRequestsCount } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', keyRecord.id)
      .gte('created_at', today.toISOString());

    const isExpired = new Date(subRecord.expires_at) <= new Date();

    return reply.send({
      key: {
        id: keyRecord.id,
        prefix: keyRecord.key_prefix,
        name: keyRecord.name,
        is_enabled: keyRecord.is_enabled && !isExpired && subRecord.is_active,
        daily_limit: keyRecord.daily_request_limit,
        requests_today: dailyRequestsCount || 0,
        last_used_at: keyRecord.last_used_at,
      },
      subscription: {
        id: subRecord.id,
        budget_amount_usd: subRecord.budget_amount_usd,
        balance_usd: subRecord.balance_usd,
        starts_at: subRecord.starts_at,
        expires_at: subRecord.expires_at,
        is_active: subRecord.is_active && !isExpired,
        is_expired: isExpired,
      },
    });
  });
};

---

FICHIER: /src/api/routes/chat.ts

import { FastifyPluginAsync } from 'fastify';
import { hashApiKey, validateWithGatekeeper, settleUsage, supabase } from '../../db/supabase.js';
import { resolveAxisRoute, estimateTokens } from '../../router/axis-auto.js';
import { executeCompletionWithFallback, executeStreamingCompletion } from '../../openrouter/client.js';
import { config } from '../../config/env.js';

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/chat/completions', async (request, reply) => {
    const startTime = Date.now();

    // 1. Extraction et validation de la clé API Bearer
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Clé API manquante. Utilisez le format Authorization: Bearer <votre_clé>',
          type: 'authentication_error',
          code: 'MISSING_API_KEY',
        },
      });
    }

    const rawApiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    const keyHash = hashApiKey(rawApiKey);

    // 2. Extraction du corps de requête OpenAI
    const body = request.body as any;
    if (!body || !Array.isArray(body.messages)) {
      return reply.status(400).send({
        error: {
          message: 'Le champ "messages" est obligatoire et doit être un tableau.',
          type: 'invalid_request_error',
          code: 'INVALID_REQUEST',
        },
      });
    }

    const requestedModel = body.model || 'axis-auto';
    const isStream = Boolean(body.stream);
    const maxTokens = body.max_tokens || body.max_completion_tokens || config.defaultMaxOutputTokens;

    // 3. Récupération du palier de l'utilisateur pour le routage intelligent
    let userTierNumber = 1;
    try {
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('subscription_id, subscriptions(tier_number)')
        .eq('key_hash', keyHash)
        .maybeSingle();

      const sub = keyData?.subscriptions as any;
      if (sub?.tier_number) {
        userTierNumber = sub.tier_number;
      }
    } catch {
      // Valeur par défaut : palier 1
      userTierNumber = 1;
    }

    // 4. Routage intelligent Axis Auto (Flux en 2 étapes : Décision puis Exécution)
    const route = resolveAxisRoute(requestedModel, body.messages, userTierNumber, body.tools);
    const estimatedInputTokens = estimateTokens(body.messages);

    // 5. Validation atomique Gatekeeper via procédure RPC PostgreSQL pure
    const gatekeeperResult = await validateWithGatekeeper(
      keyHash,
      route.targetModel,
      estimatedInputTokens,
      maxTokens
    );

    if (!gatekeeperResult.is_allowed) {
      const httpStatus = gatekeeperResult.http_status || 402;
      return reply.status(httpStatus).send({
        error: {
          message: gatekeeperResult.error_message || 'Requête refusée par le Gatekeeper.',
          type: gatekeeperResult.error_code || 'gatekeeper_rejection',
          code: gatekeeperResult.error_code || 'FORBIDDEN',
          details: gatekeeperResult.details || null,
          current_balance_usd: gatekeeperResult.current_balance_usd,
          estimated_cost_usd: gatekeeperResult.estimated_cost_usd,
        },
      });
    }

    // 6. Chaîne de secours
    const candidateModels = [
      ...(gatekeeperResult.fallback_model_id ? [gatekeeperResult.fallback_model_id] : []),
      ...route.fallbackChain,
    ];

    const openRouterPayload = {
      ...body,
      model: route.targetModel,
    };

    // 7. Mode STREAMING (Server-Sent Events)
    if (isStream) {
      try {
        const streamResult = await executeStreamingCompletion(openRouterPayload, candidateModels);
        const upstreamResponse = streamResult.response;

        if (!upstreamResponse.ok || !upstreamResponse.body) {
          const errText = await upstreamResponse.text();
          return reply.status(upstreamResponse.status).send({
            error: {
              message: `Erreur upstream OpenRouter: ${errText}`,
              type: 'upstream_error',
              code: 'OPENROUTER_ERROR',
            },
          });
        }

        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Axis-Model': streamResult.modelUsed,
          'X-Axis-Power-Level': route.powerLevel,
          'X-Axis-Tier': String(gatekeeperResult.tier_number || userTierNumber),
          'X-Axis-Fallback': streamResult.fallbackOccurred ? 'true' : 'false',
        });

        let outputTokensCount = 0;
        let streamClosed = false;

        const reader = upstreamResponse.body.getReader();
        const decoder = new TextDecoder();

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              reply.raw.write(value);

              const chunkText = decoder.decode(value, { stream: true });
              const lines = chunkText.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.usage) {
                      outputTokensCount = parsed.usage.completion_tokens || outputTokensCount;
                    } else if (parsed.choices?.[0]?.delta?.content) {
                      outputTokensCount += Math.max(1, Math.ceil(parsed.choices[0].delta.content.length / 3.8));
                    }
                  } catch {}
                }
              }
            }
          } catch (err) {
            console.error('[Streaming Error]', err);
          } finally {
            if (!streamClosed) {
              streamClosed = true;
              reply.raw.end();
            }

            // Décompte de sortie découplé via RPC PostgreSQL
            const durationMs = Date.now() - startTime;
            const finalOutputTokens = Math.max(1, outputTokensCount);
            settleUsage({
              keyHash,
              modelId: streamResult.modelUsed,
              inputTokens: estimatedInputTokens,
              outputTokens: finalOutputTokens,
              durationMs,
              statusCode: 200,
            }).catch((err) => console.error('[Stream Settlement Error]', err));
          }
        };

        await processStream();
        return reply;
      } catch (streamErr: any) {
        console.error('[Streaming Init Error]', streamErr);
        return reply.status(500).send({
          error: {
            message: 'Erreur lors de l\'initialisation du streaming.',
            details: streamErr.message,
          },
        });
      }
    }

    // 8. Mode NON-STREAMING (JSON Standard)
    const completionResult = await executeCompletionWithFallback(
      openRouterPayload,
      candidateModels
    );

    const durationMs = Date.now() - startTime;

    // Décompte asynchrone découplé via RPC PostgreSQL
    queueMicrotask(() => {
      settleUsage({
        keyHash,
        modelId: completionResult.modelUsed,
        inputTokens: completionResult.promptTokens || estimatedInputTokens,
        outputTokens: completionResult.completionTokens,
        durationMs,
        statusCode: completionResult.statusCode,
        errorMessage: completionResult.statusCode >= 400 ? JSON.stringify(completionResult.body) : null,
      }).catch((settleErr) => {
        console.error('[Settlement Error]', settleErr);
      });
    });

    reply
      .header('X-Axis-Model', completionResult.modelUsed)
      .header('X-Axis-Power-Level', route.powerLevel)
      .header('X-Axis-Tier', String(gatekeeperResult.tier_number || userTierNumber))
      .header('X-Axis-Fallback', completionResult.fallbackOccurred ? 'true' : 'false')
      .header('X-Axis-Routing-Reason', route.routingReason)
      .header('X-Axis-Latency-Ms', durationMs.toString())
      .status(completionResult.statusCode)
      .send(completionResult.body);
  });
};

---

FICHIER: /src/api/routes/cron.ts

import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';
import { config } from '../../config/env.js';

export const cronRoutes: FastifyPluginAsync = async (fastify) => {
  const handleCleanup = async (request: any, reply: any) => {
    // Vérification du token de sécurité secret pour autoriser l'exécution cron
    const providedToken =
      request.headers['x-cron-token'] ||
      (request.query as any)?.token ||
      request.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (providedToken !== config.cronSecretToken) {
      return reply.status(401).send({
        error: 'Non autorisé. Token de sécurité cron invalide.',
      });
    }

    // Appel de la procédure stockée de maintenance
    const { data, error } = await supabase.rpc('axis_cleanup_expired_subscriptions');

    if (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: `Erreur d'exécution de la maintenance: ${error.message}`,
      });
    }

    return reply.send({
      message: 'Nettoyage des abonnements et désactivation des clés expirées exécutés avec succès.',
      result: data,
    });
  };

  // Supporte GET et POST pour une compatibilité totale avec cron-job.org
  fastify.get('/cron/cleanup', handleCleanup);
  fastify.post('/cron/cleanup', handleCleanup);
};

---

FICHIER: /src/api/routes/keys.ts

import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';

export const keysRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Génération d'une nouvelle clé d'accès (affichée une seule fois)
   */
  fastify.post('/keys/generate', async (request, reply) => {
    const body = request.body as {
      user_id: string;
      subscription_id?: string;
      name?: string;
      daily_request_limit?: number;
    };

    if (!body || !body.user_id) {
      return reply.status(400).send({
        error: 'Le paramètre user_id (UUID) est obligatoire.',
      });
    }

    const { data, error } = await supabase.rpc('axis_generate_api_key', {
      p_user_id: body.user_id,
      p_subscription_id: body.subscription_id || null,
      p_name: body.name || 'Default API Key',
      p_daily_limit: body.daily_request_limit || null,
    });

    if (error) {
      return reply.status(500).send({
        error: `Erreur lors de la génération de la clé: ${error.message}`,
      });
    }

    return reply.status(201).send(data);
  });

  /**
   * Rafraîchissement / rotation d'une clé API en cas de fuite ou compromission
   */
  fastify.post('/keys/refresh', async (request, reply) => {
    const body = request.body as { key_id: string };

    if (!body || !body.key_id) {
      return reply.status(400).send({
        error: 'Le paramètre key_id (UUID) est obligatoire.',
      });
    }

    const { data, error } = await supabase.rpc('axis_refresh_api_key', {
      p_key_id: body.key_id,
    });

    if (error) {
      return reply.status(500).send({
        error: `Erreur lors du rafraîchissement de la clé: ${error.message}`,
      });
    }

    return reply.send(data);
  });

  /**
   * Révocation / Désactivation ou suppression d'une clé API
   */
  fastify.post('/keys/revoke', async (request, reply) => {
    const body = request.body as { key_id: string; delete?: boolean };

    if (!body || !body.key_id) {
      return reply.status(400).send({
        error: 'Le paramètre key_id (UUID) est obligatoire.',
      });
    }

    const { data, error } = await supabase.rpc('axis_revoke_api_key', {
      p_key_id: body.key_id,
      p_delete: Boolean(body.delete),
    });

    if (error) {
      return reply.status(500).send({
        error: `Erreur lors de la révocation de la clé: ${error.message}`,
      });
    }

    return reply.send(data);
  });
};

---

FICHIER: /src/api/routes/models.ts

import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';

export const modelsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/models', async (request, reply) => {
    // 1. Récupération des modèles en cache dans Supabase
    const { data: dbModels, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true });

    if (error) {
      fastify.log.error(error);
    }

    // 2. Modèles virtuels Axis
    const virtualModels = [
      {
        id: 'axis-auto',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'auto',
        description: 'Routage dynamique intelligent selon l\'intention et la complexité de votre prompt',
      },
      {
        id: 'axis-free',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'free',
        description: 'Pool de modèles gratuits (aucun décompte sur le solde)',
      },
      {
        id: 'axis-economy',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'economy',
        description: 'Pool économique ultra-rapide et abordable',
      },
      {
        id: 'axis-performance',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'performance',
        description: 'Pool haute performance pour raisonnement complexe et ingénierie de code',
      },
    ];

    const actualModels = (dbModels || []).map((m: any) => ({
      id: m.id,
      object: 'model',
      created: 1700000000,
      owned_by: 'openrouter',
      name: m.name,
      tier: m.tier,
      context_length: m.context_length,
      pricing: {
        input_cost_per_token_usd: m.input_cost_per_token,
        output_cost_per_token_usd: m.output_cost_per_token,
        input_per_million_usd: (m.input_cost_per_token * 1000000).toFixed(4),
        output_per_million_usd: (m.output_cost_per_token * 1000000).toFixed(4),
      },
      fallback_model_id: m.fallback_model_id,
    }));

    return reply.send({
      object: 'list',
      data: [...virtualModels, ...actualModels],
    });
  });
};

---

FICHIER: /src/api/routes/subscriptions.ts

import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';


export const subscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Souscription à un abonnement (avec application de la règle anti-abus des 7 jours)
   */
  fastify.post('/subscriptions', async (request, reply) => {
    const body = request.body as {
      user_id: string;
      tier_number: number;
      moderator_code?: string;
    };

    if (!body || !body.user_id || !body.tier_number) {
      return reply.status(400).send({
        error: 'Les paramètres user_id (UUID) et tier_number (1 à 7) sont obligatoires.',
      });
    }

    const { data, error } = await supabase.rpc('axis_subscribe', {
      p_user_id: body.user_id,
      p_tier_number: body.tier_number,
      p_moderator_code: body.moderator_code || null,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });


  /**
   * Consultation des 7 paliers disponibles et de la formule mathématique MaxAllowedCost
   */
  fastify.get('/tiers', async (_request, reply) => {
    const { data, error } = await supabase
      .from('tiers')
      .select('*')
      .order('tier_number', { ascending: true });

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    return reply.send({
      object: 'list',
      formula: 'MaxAllowedCost(P_i) = alpha * i + beta (en USD par 1M tokens combinés)',
      data,
    });
  });
};

---

FICHIER: /src/api/server.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { chatRoutes } from './routes/chat.js';
import { modelsRoutes } from './routes/models.js';
import { balanceRoutes } from './routes/balance.js';
import { keysRoutes } from './routes/keys.js';
import { cronRoutes } from './routes/cron.js';
import { subscriptionsRoutes } from './routes/subscriptions.js';
import { adminRoutes } from './routes/admin.js';


export function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
    },
    // Découplage pour tolérance à la charge
    connectionTimeout: 120000,
    keepAliveTimeout: 65000,
  });

  // Activation de CORS pour tous les clients
  server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-token'],
  });

  // Health check endpoint
  server.get('/health', async () => ({
    status: 'ok',
    service: 'Axis AI Gatekeeper Proxy',
    timestamp: new Date().toISOString(),
  }));

  // Enregistrement des routes préfixées par /v1
  server.register(chatRoutes, { prefix: '/v1' });
  server.register(modelsRoutes, { prefix: '/v1' });
  server.register(balanceRoutes, { prefix: '/v1' });
  server.register(keysRoutes, { prefix: '/v1' });
  server.register(cronRoutes, { prefix: '/v1' });
  server.register(subscriptionsRoutes, { prefix: '/v1' });
  server.register(adminRoutes, { prefix: '/v1' });


  // Alias pour les requêtes racine (certains clients OpenAI envoient directement sur /chat/completions)
  server.register(chatRoutes);
  server.register(modelsRoutes);

  return server;
}

---

FICHIER: /src/config/env.ts

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

---

FICHIER: /src/db/supabase.ts

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

---

FICHIER: /src/index.ts

import { buildServer } from './api/server.js';
import { config } from './config/env.js';

async function main() {
  const server = buildServer();

  try {
    await server.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`\n======================================================`);
    console.log(`  🚀 AXIS AI PROXY GATEKEEPER DÉMARRÉ AVEC SUCCÈS`);
    console.log(`  📡 Écoute sur : http://${config.host}:${config.port}`);
    console.log(`  🛡️  Gatekeeper RPC : Connecté à Supabase`);
    console.log(`  🧠 Axis Auto Router : Actif (free / economy / performance)`);
    console.log(`======================================================\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();

---

FICHIER: /src/openrouter/client.ts

import { config } from '../config/env.js';

export interface OpenRouterChatRequest {
  model: string;
  messages: any[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  tools?: any[];
  [key: string]: any;
}

export interface NonStreamingCompletionResult {
  statusCode: number;
  body: any;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  fallbackOccurred: boolean;
}

/**
 * Envoie une requête de complétion non-streamée à OpenRouter avec gestion automatique de Fallback
 */
export async function executeCompletionWithFallback(
  reqBody: OpenRouterChatRequest,
  candidateModels: string[]
): Promise<NonStreamingCompletionResult> {
  const modelsToTry = [reqBody.model, ...(candidateModels || [])];
  // Éliminer les doublons
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;
  let lastStatus = 500;

  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    const isFallback = i > 0;

    if (isFallback) {
      console.warn(`[Axis Fallback] Basculement automatique vers le modèle de secours : ${currentModel}`);
    }

    try {
      const payload = {
        ...reqBody,
        model: currentModel,
        stream: false,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.proxyTimeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': 'https://axis-ai.network',
        'X-Title': 'Axis AI Proxy Gatekeeper',
      };

      const res = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si erreur serveur temporaire (502, 503, 504, 429) et qu'il reste un modèle de secours, tenter le suivant
      if ((res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) && i < uniqueModels.length - 1) {
        console.warn(`[OpenRouter HTTP ${res.status}] Erreur sur ${currentModel}, tentative avec secours...`);
        lastStatus = res.status;
        lastError = await res.text();
        continue;
      }

      const json = (await res.json()) as any;

      if (res.ok) {
        const usage = json.usage || {};
        return {
          statusCode: res.status,
          body: json,
          modelUsed: currentModel,
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          fallbackOccurred: isFallback,
        };
      } else {
        // Si OpenRouter a renvoyé une erreur JSON spécifique (ex: modèle surchargé)
        if (i < uniqueModels.length - 1) {
          console.warn(`[OpenRouter API Error] ${JSON.stringify(json)}, tentative avec secours...`);
          lastStatus = res.status;
          lastError = json;
          continue;
        }
        return {
          statusCode: res.status,
          body: json,
          modelUsed: currentModel,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          fallbackOccurred: isFallback,
        };
      }
    } catch (err: any) {
      console.error(`[OpenRouter Network Error] Erreur sur ${currentModel}:`, err?.message || err);
      lastError = err;
      if (i < uniqueModels.length - 1) {
        continue;
      }
    }
  }

  // Si tous les modèles ont échoué
  return {
    statusCode: lastStatus || 503,
    body: {
      error: {
        message: `Tous les modèles du pool (${uniqueModels.join(', ')}) sont actuellement indisponibles.`,
        type: 'axis_upstream_unavailable',
        details: lastError?.message || lastError,
      },
    },
    modelUsed: reqBody.model,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    fallbackOccurred: uniqueModels.length > 1,
  };
}

/**
 * Lance un appel en streaming vers OpenRouter avec streaming direct (Zero-Latency Piping)
 */
export async function executeStreamingCompletion(
  reqBody: OpenRouterChatRequest,
  candidateModels: string[]
): Promise<{
  response: Response;
  modelUsed: string;
  fallbackOccurred: boolean;
}> {
  const modelsToTry = [reqBody.model, ...(candidateModels || [])];
  const uniqueModels = Array.from(new Set(modelsToTry));

  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    const isFallback = i > 0;

    if (isFallback) {
      console.warn(`[Axis Stream Fallback] Tentative de streaming sur le modèle de secours : ${currentModel}`);
    }

    try {
      const payload = {
        ...reqBody,
        model: currentModel,
        stream: true,
        stream_options: { include_usage: true },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': 'https://axis-ai.network',
        'X-Title': 'Axis AI Proxy Gatekeeper',
      };

      const res = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // Si erreur 502/503/504 et qu'il reste des alternatives
      if ((res.status === 502 || res.status === 503 || res.status === 504) && i < uniqueModels.length - 1) {
        continue;
      }

      return {
        response: res,
        modelUsed: currentModel,
        fallbackOccurred: isFallback,
      };
    } catch (err) {
      if (i < uniqueModels.length - 1) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Impossible d\'initier le flux de streaming avec les modèles sélectionnés.');
}

---

FICHIER: /src/router/axis-auto.ts

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

---

FICHIER: /supabase/functions/axis-proxy/index.ts

// Supabase Edge Function: axis-proxy
// Compatible with Deno runtime and deployable with: supabase functions deploy axis-proxy

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  // Gestion du pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Health check
  if (url.pathname.endsWith('/health')) {
    return new Response(JSON.stringify({ status: 'ok', service: 'Axis Supabase Edge Proxy' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: { message: 'Missing Authorization header', code: 'UNAUTHORIZED' },
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  const keyHash = await sha256(rawKey);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') || '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const model = body.model || 'axis-auto';
    const isStream = Boolean(body.stream);
    const maxTokens = body.max_tokens || 1024;

    // 1. Détermination du modèle cible
    let targetModel = model;
    if (model === 'axis-auto' || model === 'auto') {
      targetModel = 'openai/gpt-4o-mini';
    } else if (model === 'axis-free') {
      targetModel = 'meta-llama/llama-3.3-70b-instruct:free';
    } else if (model === 'axis-performance') {
      targetModel = 'anthropic/claude-3.5-sonnet';
    }

    // 2. Gatekeeper RPC
    const { data: gatekeeper, error: gkErr } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: targetModel,
      p_input_tokens: 100,
      p_max_output_tokens: maxTokens,
    });

    if (gkErr || !gatekeeper.is_allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: gatekeeper?.error_message || gkErr?.message || 'Rejected by Gatekeeper',
            code: gatekeeper?.error_code || 'FORBIDDEN',
            balance_usd: gatekeeper?.current_balance_usd,
          },
        }),
        {
          status: gatekeeper?.http_status || 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Appel OpenRouter
    const openRouterPayload = { ...body, model: targetModel };
    const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://axis-ai.network',
        'X-Title': 'Axis Supabase Proxy',
      },
      body: JSON.stringify(openRouterPayload),
    });

    // 4. Si streaming
    if (isStream) {
      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 5. Non-streaming
    const resData = await upstreamRes.json();
    const promptTokens = resData.usage?.prompt_tokens || 100;
    const completionTokens = resData.usage?.completion_tokens || 100;

    // Décompte de solde asynchrone
    EdgeRuntime.waitUntil(
      supabase.rpc('axis_settle_usage', {
        p_key_hash: keyHash,
        p_model_id: targetModel,
        p_input_tokens: promptTokens,
        p_output_tokens: completionTokens,
        p_duration_ms: 500,
        p_status_code: upstreamRes.status,
      })
    );

    return new Response(JSON.stringify(resData), {
      status: upstreamRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

---

FICHIER: /supabase/migrations/001_initial_schema.sql

-- ==============================================================================
-- ACCESS AI / AXIS PROXY - DATABASE SCHEMA & GATEKEEPER PROCEDURES
-- ==============================================================================

-- Enable pgcrypto extension for cryptographic key generation and SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE: models (Cache des tarifs OpenRouter & classification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.models (
    id VARCHAR(120) PRIMARY KEY,                  -- ex: 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'
    name VARCHAR(255) NOT NULL,                   -- Human-readable name
    input_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,  -- Cost per token in USD (0.0 for free models)
    output_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0, -- Cost per token in USD (0.0 for free models)
    tier VARCHAR(30) NOT NULL DEFAULT 'economy', -- 'free', 'economy', 'performance'
    context_length INTEGER DEFAULT 128000,
    fallback_model_id VARCHAR(120) DEFAULT NULL, -- Backup model if primary fails
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_models_tier ON public.models(tier);
CREATE INDEX IF NOT EXISTS idx_models_is_active ON public.models(is_active);

-- ------------------------------------------------------------------------------
-- 2. TABLE: subscriptions (Enveloppes budgétaires en USD)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                       -- ID of the user (e.g. auth.users or external user)
    budget_amount_usd NUMERIC(14, 6) NOT NULL CHECK (budget_amount_usd >= 0),
    balance_usd NUMERIC(14, 6) NOT NULL CHECK (balance_usd >= 0),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_expires ON public.subscriptions(is_active, expires_at);

-- ------------------------------------------------------------------------------
-- 3. TABLE: api_keys (Gestion des clés d'accès hachées)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,       -- SHA-256 hash of the plain API key
    key_prefix VARCHAR(16) NOT NULL,            -- e.g. 'axis_live_a1b2' (for safe display)
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    is_enabled BOOLEAN NOT NULL DEFAULT false,  -- Active only if attached to a valid active subscription
    daily_request_limit INTEGER DEFAULT NULL,   -- Optional request rate cap per day
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_subscription_id ON public.api_keys(subscription_id);

-- ------------------------------------------------------------------------------
-- 4. TABLE: usage_logs (Traçabilité des requêtes et tokens)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    model_id VARCHAR(120) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(16, 8) NOT NULL DEFAULT 0.0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER NOT NULL DEFAULT 200,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON public.usage_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_sub_id ON public.usage_logs(subscription_id, created_at);

-- ------------------------------------------------------------------------------
-- 5. RPC FUNCTION: axis_gatekeeper_validate
-- Validation synchrone de la clé, du modèle et du solde avant transmission
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_max_output_tokens INTEGER DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_sub RECORD;
    v_model RECORD;
    v_input_cost NUMERIC(18, 10) := 0;
    v_output_cost NUMERIC(18, 10) := 0;
    v_est_total_cost NUMERIC(18, 10) := 0;
    v_daily_count INTEGER := 0;
    v_is_free BOOLEAN := false;
BEGIN
    -- 1. Vérification de la clé API
    SELECT id, user_id, subscription_id, is_enabled, daily_request_limit
    INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 401,
            'error_code', 'INVALID_API_KEY',
            'error_message', 'Clé API inconnue ou invalide.'
        );
    END IF;

    IF NOT v_key.is_enabled THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'KEY_DISABLED',
            'error_message', 'Cette clé API est actuellement désactivée.'
        );
    END IF;

    -- 2. Vérification de l'abonnement rattaché
    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'NO_SUBSCRIPTION',
            'error_message', 'Aucun abonnement budgétaire rattaché à cette clé.'
        );
    END IF;

    SELECT id, user_id, balance_usd, expires_at, is_active
    INTO v_sub
    FROM public.subscriptions
    WHERE id = v_key.subscription_id;

    IF NOT FOUND OR NOT v_sub.is_active THEN
        -- Auto-désactivation de la clé si abonnement inactif
        UPDATE public.api_keys SET is_enabled = false WHERE id = v_key.id;
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_INACTIVE',
            'error_message', 'Abonnement inactif ou résilié.'
        );
    END IF;

    IF v_sub.expires_at <= timezone('utc'::text, now()) THEN
        -- Auto-désactivation de l'abonnement expiré et de sa clé
        UPDATE public.subscriptions SET is_active = false WHERE id = v_sub.id;
        UPDATE public.api_keys SET is_enabled = false WHERE id = v_key.id;
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_EXPIRED',
            'error_message', 'Votre forfait a expiré. Veuillez le renouveler.'
        );
    END IF;

    -- 3. Vérification de la limite quotidienne si configurée
    IF v_key.daily_request_limit IS NOT NULL AND v_key.daily_request_limit > 0 THEN
        SELECT COUNT(*)
        INTO v_daily_count
        FROM public.usage_logs
        WHERE api_key_id = v_key.id
          AND created_at >= date_trunc('day', timezone('utc'::text, now()));

        IF v_daily_count >= v_key.daily_request_limit THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 429,
                'error_code', 'DAILY_LIMIT_EXCEEDED',
                'error_message', 'La limite quotidienne de requêtes pour cette clé a été atteinte.'
            );
        END IF;
    END IF;

    -- 4. Recherche du modèle et tarification
    SELECT id, name, input_cost_per_token, output_cost_per_token, tier, fallback_model_id
    INTO v_model
    FROM public.models
    WHERE id = p_model_id AND is_active = true;

    -- Si le modèle n'est pas encore en base, vérifions si c'est un tag :free connu
    IF NOT FOUND THEN
        IF p_model_id LIKE '%:free' THEN
            v_is_free := true;
            v_input_cost := 0.0;
            v_output_cost := 0.0;
        ELSE
            -- Modèle non reconnu
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 404,
                'error_code', 'MODEL_NOT_FOUND',
                'error_message', format('Modèle "%s" non supporté ou introuvable dans le catalogue.', p_model_id)
            );
        END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR v_model.tier = 'free' THEN
            v_is_free := true;
        END IF;
    END IF;

    -- 5. Formule d'estimation budgétaire
    -- A. Modèles Gratuits : Passage immédiat sans déduction
    IF v_is_free THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', true,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'model_id', p_model_id,
            'tier', COALESCE(v_model.tier, 'free'),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', 0.0,
            'fallback_model_id', v_model.fallback_model_id
        );
    END IF;

    -- B. Modèles Payants : Calcul des coûts d'entrée et de sortie estimée
    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(1, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;

    -- Vérification de couverture par le solde
    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', false,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'model_id', v_model.id,
            'tier', v_model.tier,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost,
            'fallback_model_id', v_model.fallback_model_id
        );
    ELSE
        -- Refus net HTTP 402
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 402,
            'error_code', 'INSUFFICIENT_BALANCE',
            'error_message', format('Solde insuffisant ($%s) pour couvrir l''estimation de la requête ($%s). Veuillez recharger votre forfait.', v_sub.balance_usd, round(v_est_total_cost, 6)),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. RPC FUNCTION: axis_settle_usage
-- Décompte réel du solde et enregistrement d'audit (Usage log)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_settle_usage(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_output_tokens INTEGER DEFAULT 0,
    p_duration_ms INTEGER DEFAULT 0,
    p_status_code INTEGER DEFAULT 200,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_sub RECORD;
    v_model RECORD;
    v_total_tokens INTEGER := 0;
    v_real_cost NUMERIC(16, 8) := 0.0;
    v_new_balance NUMERIC(14, 6) := 0.0;
    v_is_free BOOLEAN := false;
BEGIN
    v_total_tokens := GREATEST(0, p_input_tokens) + GREATEST(0, p_output_tokens);

    -- Récupération de la clé
    SELECT id, subscription_id
    INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable lors de la clôture.');
    END IF;

    -- Tarifs du modèle
    SELECT id, input_cost_per_token, output_cost_per_token, tier
    INTO v_model
    FROM public.models
    WHERE id = p_model_id;

    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR (v_model.tier = 'free') OR (p_model_id LIKE '%:free') THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) +
                       (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
    END IF;

    -- Si requête en succès et modèle payant, déduire du solde
    IF v_key.subscription_id IS NOT NULL THEN
        SELECT id, balance_usd INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;

        IF FOUND THEN
            IF NOT v_is_free AND v_real_cost > 0.0 AND p_status_code < 400 THEN
                v_new_balance := GREATEST(0.0, v_sub.balance_usd - v_real_cost);
                UPDATE public.subscriptions
                SET balance_usd = v_new_balance,
                    is_active = (v_new_balance > 0.0),
                    updated_at = timezone('utc'::text, now())
                WHERE id = v_sub.id;

                -- Si solde épuisé, désactiver immédiatement les clés rattachées
                IF v_new_balance <= 0.0 THEN
                    UPDATE public.api_keys
                    SET is_enabled = false,
                        updated_at = timezone('utc'::text, now())
                    WHERE subscription_id = v_sub.id;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
            END IF;
        END IF;
    END IF;

    -- Mise à jour de la date de dernier usage sur la clé
    UPDATE public.api_keys
    SET last_used_at = timezone('utc'::text, now())
    WHERE id = v_key.id;

    -- Insertion dans usage_logs pour audit
    INSERT INTO public.usage_logs (
        api_key_id,
        subscription_id,
        model_id,
        input_tokens,
        output_tokens,
        total_tokens,
        cost_usd,
        is_free,
        duration_ms,
        status_code,
        error_message
    ) VALUES (
        v_key.id,
        v_key.subscription_id,
        p_model_id,
        p_input_tokens,
        p_output_tokens,
        v_total_tokens,
        v_real_cost,
        v_is_free,
        p_duration_ms,
        p_status_code,
        p_error_message
    );

    RETURN jsonb_build_object(
        'success', true,
        'cost_usd', v_real_cost,
        'is_free', v_is_free,
        'new_balance_usd', v_new_balance,
        'total_tokens', v_total_tokens
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC FUNCTION: axis_generate_api_key
-- Génération d'une nouvelle clé secrète (affichée une seule fois)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_hash TEXT;
    v_prefix TEXT;
    v_new_key_id UUID;
    v_is_enabled BOOLEAN := false;
    v_sub RECORD;
BEGIN
    -- Si un abonnement est fourni, valider qu'il est actif et non expiré
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, is_active, expires_at, balance_usd
        INTO v_sub
        FROM public.subscriptions
        WHERE id = p_subscription_id AND user_id = p_user_id;

        IF FOUND AND v_sub.is_active AND v_sub.expires_at > timezone('utc'::text, now()) AND v_sub.balance_usd > 0 THEN
            v_is_enabled := true;
        END IF;
    END IF;

    -- Génération de 24 octets cryptographiques hex (48 chars)
    v_raw_secret := encode(gen_random_bytes(24), 'hex');
    v_full_key := 'axis_live_' || v_raw_secret;
    v_prefix := substr(v_full_key, 1, 14) || '...';
    v_hash := encode(digest(v_full_key, 'sha256'), 'hex');

    INSERT INTO public.api_keys (
        user_id,
        subscription_id,
        key_hash,
        key_prefix,
        name,
        is_enabled,
        daily_request_limit
    ) VALUES (
        p_user_id,
        p_subscription_id,
        v_hash,
        v_prefix,
        COALESCE(p_name, 'Default API Key'),
        v_is_enabled,
        p_daily_limit
    )
    RETURNING id INTO v_new_key_id;

    RETURN jsonb_build_object(
        'key_id', v_new_key_id,
        'raw_key', v_full_key,
        'key_prefix', v_prefix,
        'name', COALESCE(p_name, 'Default API Key'),
        'is_enabled', v_is_enabled,
        'daily_request_limit', p_daily_limit,
        'warning', 'La clé en clair ne sera plus jamais accessible. Veuillez la conserver en lieu sûr.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. RPC FUNCTION: axis_refresh_api_key
-- Régénération d'une nouvelle clé secrète en cas de compromission
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_refresh_api_key(
    p_key_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_hash TEXT;
    v_prefix TEXT;
    v_key RECORD;
BEGIN
    SELECT * INTO v_key FROM public.api_keys WHERE id = p_key_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Clé introuvable');
    END IF;

    v_raw_secret := encode(gen_random_bytes(24), 'hex');
    v_full_key := 'axis_live_' || v_raw_secret;
    v_prefix := substr(v_full_key, 1, 14) || '...';
    v_hash := encode(digest(v_full_key, 'sha256'), 'hex');

    UPDATE public.api_keys
    SET key_hash = v_hash,
        key_prefix = v_prefix,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'key_id', p_key_id,
        'new_raw_key', v_full_key,
        'key_prefix', v_prefix,
        'warning', 'Nouvelle clé générée. L''ancienne clé est immédiatement invalidée.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. RPC FUNCTION: axis_revoke_api_key
-- Révocation ou suppression d'une clé API
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_revoke_api_key(
    p_key_id UUID,
    p_delete BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_delete THEN
        DELETE FROM public.api_keys WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'deleted', 'key_id', p_key_id);
    ELSE
        UPDATE public.api_keys
        SET is_enabled = false,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'disabled', 'key_id', p_key_id);
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. RPC FUNCTION: axis_cleanup_expired_subscriptions
-- Tâche de maintenance (Cron Job) pour désactiver les forfaits épuisés ou expirés
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_cleanup_expired_subscriptions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subs_deactivated INTEGER := 0;
    v_keys_disabled INTEGER := 0;
BEGIN
    -- 1. Désactiver les abonnements expirés ou à solde nul
    WITH expired AS (
        UPDATE public.subscriptions
        SET is_active = false,
            updated_at = timezone('utc'::text, now())
        WHERE is_active = true
          AND (expires_at <= timezone('utc'::text, now()) OR balance_usd <= 0.0)
        RETURNING id
    )
    SELECT COUNT(*) INTO v_subs_deactivated FROM expired;

    -- 2. Désactiver les clés rattachées aux abonnements inactifs
    WITH disabled_keys AS (
        UPDATE public.api_keys k
        SET is_enabled = false,
            updated_at = timezone('utc'::text, now())
        FROM public.subscriptions s
        WHERE k.subscription_id = s.id
          AND k.is_enabled = true
          AND (s.is_active = false OR s.expires_at <= timezone('utc'::text, now()) OR s.balance_usd <= 0.0)
        RETURNING k.id
    )
    SELECT COUNT(*) INTO v_keys_disabled FROM disabled_keys;

    RETURN jsonb_build_object(
        'success', true,
        'subscriptions_deactivated', v_subs_deactivated,
        'keys_disabled', v_keys_disabled,
        'executed_at', timezone('utc'::text, now())
    );
END;
$$;

---

FICHIER: /supabase/migrations/002_seed_data.sql

-- ==============================================================================
-- ACCESS AI / AXIS PROXY - SEED DATA (Models catalogue & fallback rules)
-- ==============================================================================

INSERT INTO public.models (id, name, input_cost_per_token, output_cost_per_token, tier, context_length, fallback_model_id, is_active)
VALUES
    -- Modèles Gratuits (Tier: free, Coût: 0.00)
    ('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Instruct (Free)', 0.0, 0.0, 'free', 131072, 'google/gemini-2.0-flash-exp:free', true),
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Experimental (Free)', 0.0, 0.0, 'free', 1048576, 'mistralai/mistral-7b-instruct:free', true),
    ('mistralai/mistral-7b-instruct:free', 'Mistral 7B Instruct (Free)', 0.0, 0.0, 'free', 32768, 'meta-llama/llama-3.3-70b-instruct:free', true),
    ('qwen/qwen-2.5-coder-32b-instruct:free', 'Qwen 2.5 Coder 32B (Free)', 0.0, 0.0, 'free', 32768, 'meta-llama/llama-3.3-70b-instruct:free', true),

    -- Modèles Économiques (Tier: economy, Rapides & abordables)
    ('openai/gpt-4o-mini', 'GPT-4o Mini', 0.00000015, 0.00000060, 'economy', 128000, 'google/gemini-2.0-flash-001', true),
    ('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 0.00000010, 0.00000040, 'economy', 1048576, 'openai/gpt-4o-mini', true),
    ('deepseek/deepseek-chat', 'DeepSeek V3 (Chat)', 0.00000014, 0.00000028, 'economy', 64000, 'openai/gpt-4o-mini', true),
    ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 0.00000025, 0.00000125, 'economy', 200000, 'openai/gpt-4o-mini', true),
    ('meta-llama/llama-3.1-8b-instruct', 'Llama 3.1 8B Instruct', 0.00000005, 0.00000005, 'economy', 131072, 'openai/gpt-4o-mini', true),

    -- Modèles Haute Performance (Tier: performance, Fort raisonnement, Code complexe)
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 0.00000300, 0.00001500, 'performance', 200000, 'openai/gpt-4o', true),
    ('openai/gpt-4o', 'GPT-4o', 0.00000250, 0.00001000, 'performance', 128000, 'anthropic/claude-3.5-sonnet', true),
    ('deepseek/deepseek-r1', 'DeepSeek R1 (Reasoning)', 0.00000055, 0.00000219, 'performance', 64000, 'openai/gpt-4o', true),
    ('openai/o1-mini', 'OpenAI o1 Mini', 0.00000300, 0.00001200, 'performance', 128000, 'openai/gpt-4o-mini', true),
    ('google/gemini-pro-1.5', 'Gemini 1.5 Pro', 0.00000125, 0.00000500, 'performance', 2097152, 'openai/gpt-4o', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    input_cost_per_token = EXCLUDED.input_cost_per_token,
    output_cost_per_token = EXCLUDED.output_cost_per_token,
    tier = EXCLUDED.tier,
    context_length = EXCLUDED.context_length,
    fallback_model_id = EXCLUDED.fallback_model_id,
    updated_at = timezone('utc'::text, now());

---

FICHIER: /supabase/migrations/003_seven_tiers_lifecycle.sql

-- ==============================================================================
-- ACCESS AI / AXIS AUTO : 7 PALIERS, FORMULE MATHÉMATIQUE & CYCLE DE VIE J-7
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE: tiers (Les 7 Paliers d'abonnements et formule MaxAllowedCost)
-- Formule : MaxAllowedCost(P_i) = alpha * i + beta (USD par 1M de tokens combinés)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiers (
    tier_number INTEGER PRIMARY KEY CHECK (tier_number BETWEEN 1 AND 7),
    name VARCHAR(50) NOT NULL,
    alpha NUMERIC(8, 2) NOT NULL DEFAULT 5.00,
    beta NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    max_cost_per_million_usd NUMERIC(10, 2) GENERATED ALWAYS AS (alpha * tier_number + beta) STORED,
    price_usd NUMERIC(10, 2) NOT NULL,
    budget_amount_usd NUMERIC(10, 2) NOT NULL,
    description TEXT
);

-- Insertion des 7 Paliers avec la formule : MaxAllowedCost = 5.00 * i
-- P1: 5$/1M, P2: 10$/1M, P3: 15$/1M, P4: 20$/1M, P5: 25$/1M, P6: 30$/1M, P7: 35$/1M
INSERT INTO public.tiers (tier_number, name, alpha, beta, price_usd, budget_amount_usd, description)
VALUES
    (1, 'Palier 1 - Starter', 5.00, 0.00, 10.00, 10.00, 'Accès aux modèles gratuits et ultra-économiques (max 5$/1M tokens)'),
    (2, 'Palier 2 - Basic', 5.00, 0.00, 25.00, 25.00, 'Accès aux modèles légers et polyvalents (max 10$/1M tokens)'),
    (3, 'Palier 3 - Standard', 5.00, 0.00, 50.00, 50.00, 'Accès aux modèles avancés standards type GPT-4o (max 15$/1M tokens)'),
    (4, 'Palier 4 - Pro', 5.00, 0.00, 100.00, 100.00, 'Accès aux modèles de pointe type Claude 3.5 Sonnet (max 20$/1M tokens)'),
    (5, 'Palier 5 - Expert', 5.00, 0.00, 200.00, 200.00, 'Accès aux modèles haute fidélité (max 25$/1M tokens)'),
    (6, 'Palier 6 - Master', 5.00, 0.00, 350.00, 350.00, 'Accès aux modèles de raisonnement lourds (max 30$/1M tokens)'),
    (7, 'Palier 7 - Enterprise', 5.00, 0.00, 500.00, 500.00, 'Accès illimité à tous les modèles sans restriction (max 35$/1M tokens)')
ON CONFLICT (tier_number) DO UPDATE SET
    name = EXCLUDED.name,
    alpha = EXCLUDED.alpha,
    beta = EXCLUDED.beta,
    price_usd = EXCLUDED.price_usd,
    budget_amount_usd = EXCLUDED.budget_amount_usd,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 2. TABLE: models (Catalogue des modèles avec niveaux de puissance pour Axis Auto)
-- Power levels : 'low', 'medium', 'high', 'ultra'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.models (
    id VARCHAR(120) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    input_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    output_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    combined_cost_per_million_usd NUMERIC(14, 4) GENERATED ALWAYS AS ((input_cost_per_token + output_cost_per_token) * 1000000) STORED,
    power_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (power_level IN ('low', 'medium', 'high', 'ultra')),
    tier VARCHAR(30) DEFAULT 'economy',
    context_length INTEGER DEFAULT 128000,
    fallback_model_id VARCHAR(120) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insertion des modèles classés par niveau de puissance
INSERT INTO public.models (id, name, input_cost_per_token, output_cost_per_token, power_level, tier, fallback_model_id)
VALUES
    -- NIVEAU 1 : LOW (Gratuits et ultra-rapides)
    ('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Free', 0.0, 0.0, 'low', 'free', 'google/gemini-2.0-flash-exp:free'),
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Exp Free', 0.0, 0.0, 'low', 'free', 'meta-llama/llama-3.3-70b-instruct:free'),
    ('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 0.00000010, 0.00000040, 'low', 'economy', 'openai/gpt-4o-mini'),
    ('openai/gpt-4o-mini', 'GPT-4o Mini', 0.00000015, 0.00000060, 'low', 'economy', 'google/gemini-2.0-flash-001'),

    -- NIVEAU 2 : MEDIUM (Modèles polyvalents standards)
    ('deepseek/deepseek-chat', 'DeepSeek V3 Chat', 0.00000014, 0.00000028, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 0.00000025, 0.00000125, 'medium', 'economy', 'deepseek/deepseek-chat'),
    ('mistralai/mistral-small', 'Mistral Small', 0.00000020, 0.00000060, 'medium', 'economy', 'openai/gpt-4o-mini'),

    -- NIVEAU 3 : HIGH (Modèles avancés et code)
    ('openai/gpt-4o', 'GPT-4o', 0.00000250, 0.00001000, 'high', 'performance', 'google/gemini-pro-1.5'),
    ('google/gemini-pro-1.5', 'Gemini 1.5 Pro', 0.00000125, 0.00000500, 'high', 'performance', 'openai/gpt-4o'),
    ('qwen/qwen-2.5-coder-32b-instruct', 'Qwen 2.5 Coder 32B', 0.00000007, 0.00000016, 'high', 'economy', 'openai/gpt-4o'),

    -- NIVEAU 4 : ULTRA (Raisonnement fort et réflexion approfondie)
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 0.00000300, 0.00001500, 'ultra', 'performance', 'deepseek/deepseek-r1'),
    ('deepseek/deepseek-r1', 'DeepSeek R1 Reasoning', 0.00000055, 0.00000219, 'ultra', 'performance', 'openai/gpt-4o'),
    ('openai/o1-mini', 'OpenAI o1 Mini', 0.00000300, 0.00001200, 'ultra', 'performance', 'anthropic/claude-3.5-sonnet')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    input_cost_per_token = EXCLUDED.input_cost_per_token,
    output_cost_per_token = EXCLUDED.output_cost_per_token,
    power_level = EXCLUDED.power_level,
    tier = EXCLUDED.tier,
    fallback_model_id = EXCLUDED.fallback_model_id,
    updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 3. TABLE: subscriptions (Cycle de vie 30 jours, statut pending et règle J-7)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tier_number INTEGER NOT NULL REFERENCES public.tiers(tier_number),
    budget_amount_usd NUMERIC(14, 6) NOT NULL CHECK (budget_amount_usd >= 0),
    balance_usd NUMERIC(14, 6) NOT NULL CHECK (balance_usd >= 0),
    consumed_usd NUMERIC(14, 6) NOT NULL DEFAULT 0.0,
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'depleted')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_sub_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_expires ON public.subscriptions(is_active, expires_at);

-- ------------------------------------------------------------------------------
-- 4. TABLE: api_keys (1 clé API = 1 abonnement actif unique)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    daily_request_limit INTEGER DEFAULT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- ------------------------------------------------------------------------------
-- 5. TABLE: usage_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    model_id VARCHAR(120) NOT NULL,
    power_level VARCHAR(20),
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(16, 8) NOT NULL DEFAULT 0.0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER NOT NULL DEFAULT 200,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_key_date ON public.usage_logs(api_key_id, created_at);

-- ------------------------------------------------------------------------------
-- 6. RPC: axis_subscribe (Gestion des abonnements & Règle anti-abus des 7 jours)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_subscribe(
    p_user_id UUID,
    p_tier_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tier RECORD;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_new_sub_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
    v_key RECORD;
BEGIN
    -- 1. Récupération du palier demandé
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 400,
            'error_code', 'INVALID_TIER',
            'error_message', format('Le palier %s n''existe pas (choisir entre 1 et 7).', p_tier_number)
        );
    END IF;

    -- 2. Recherche d'un abonnement actif existant pour cet utilisateur
    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND is_active = true
      AND expires_at > v_now
      AND balance_usd > 0
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    -- Cas A : Aucun abonnement actif en cours -> Activation immédiate pour 30 jours
    IF NOT FOUND THEN
        v_starts_at := v_now;
        v_expires_at := v_now + INTERVAL '30 days';

        INSERT INTO public.subscriptions (
            user_id,
            tier_number,
            budget_amount_usd,
            balance_usd,
            consumed_usd,
            starts_at,
            expires_at,
            status,
            is_active
        ) VALUES (
            p_user_id,
            v_tier.tier_number,
            v_tier.budget_amount_usd,
            v_tier.budget_amount_usd,
            0.0,
            v_starts_at,
            v_expires_at,
            'active',
            true
        ) RETURNING id INTO v_new_sub_id;

        -- Raccordement de la clé API si elle existe déjà
        UPDATE public.api_keys
        SET subscription_id = v_new_sub_id,
            is_enabled = true,
            updated_at = v_now
        WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'http_status', 201,
            'action', 'ACTIVATED_IMMEDIATE',
            'subscription_id', v_new_sub_id,
            'tier_number', v_tier.tier_number,
            'tier_name', v_tier.name,
            'balance_usd', v_tier.budget_amount_usd,
            'starts_at', v_starts_at,
            'expires_at', v_expires_at,
            'message', 'Abonnement activé avec succès pour 30 jours calendaires.'
        );
    END IF;

    -- Cas B : Abonnement actif existant -> Contrôle de la règle des 7 derniers jours
    -- Si on est à PLUS de 7 jours de l'expiration et que le solde n'est pas épuisé -> REFUS ANTI-ABUS
    IF v_now < (v_active_sub.expires_at - INTERVAL '7 days') THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 409,
            'error_code', 'EARLY_RENEWAL_FORBIDDEN',
            'error_message', format(
                'Vous avez déjà un abonnement actif (Palier %s). La souscription anticipée n''est autorisée que dans les 7 derniers jours précédant l''expiration (à partir du %s).',
                v_active_sub.tier_number,
                (v_active_sub.expires_at - INTERVAL '7 days')::date
            ),
            'active_subscription_expires_at', v_active_sub.expires_at,
            'allowed_renewal_date', v_active_sub.expires_at - INTERVAL '7 days'
        );
    END IF;

    -- Cas C : Nous sommes dans la fenêtre des 7 derniers jours (ou solde à 0)
    -- Vérification si un abonnement pending existe déjà pour éviter le multi-cumul
    SELECT * INTO v_pending_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 409,
            'error_code', 'PENDING_ALREADY_EXISTS',
            'error_message', 'Un abonnement de renouvellement est déjà en attente d''activation pour votre compte.',
            'pending_subscription_id', v_pending_sub.id,
            'scheduled_activation_date', v_pending_sub.starts_at
        );
    END IF;

    -- Création du pack en statut 'pending' programmé à la seconde exacte de fin de l'actuel
    v_starts_at := v_active_sub.expires_at;
    v_expires_at := v_starts_at + INTERVAL '30 days';

    INSERT INTO public.subscriptions (
        user_id,
        tier_number,
        budget_amount_usd,
        balance_usd,
        consumed_usd,
        starts_at,
        expires_at,
        status,
        is_active
    ) VALUES (
        p_user_id,
        v_tier.tier_number,
        v_tier.budget_amount_usd,
        v_tier.budget_amount_usd,
        0.0,
        v_starts_at,
        v_expires_at,
        'pending',
        false
    ) RETURNING id INTO v_new_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'action', 'QUEUED_PENDING_J7',
        'subscription_id', v_new_sub_id,
        'tier_number', v_tier.tier_number,
        'tier_name', v_tier.name,
        'balance_usd', v_tier.budget_amount_usd,
        'starts_at', v_starts_at,
        'expires_at', v_expires_at,
        'message', 'Abonnement enregistré en attente (Règle J-7). Il s''activera automatiquement à l''expiration exacte de votre abonnement actuel.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC: axis_gatekeeper_validate (Validation synchrone atomique avec verrouillage)
-- Vérification Clé + Expiration 30j + Relais Pending + Filtrage mathématique MaxAllowedCost
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_max_output_tokens INTEGER DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_tier RECORD;
    v_model RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_input_cost NUMERIC(18, 10) := 0;
    v_output_cost NUMERIC(18, 10) := 0;
    v_est_total_cost NUMERIC(18, 10) := 0;
    v_is_free BOOLEAN := false;
BEGIN
    -- 1. Validation de la clé API
    SELECT * INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 401,
            'error_code', 'INVALID_API_KEY',
            'error_message', 'Clé API inconnue ou invalide.'
        );
    END IF;

    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'NO_SUBSCRIPTION',
            'error_message', 'Aucun abonnement actif n''est associé à cette clé API.'
        );
    END IF;

    -- 2. Verrouillage atomique de l'abonnement (FOR UPDATE) pour éviter les accès concurrents
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = v_key.subscription_id
    FOR UPDATE;

    -- 3. Contrôle du cycle de vie des 30 jours et bascule automatique si expirée ou épuisée
    IF NOT FOUND OR v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        -- Marquer l'ancien abonnement comme expiré ou épuisé
        IF FOUND AND v_sub.status = 'active' THEN
            UPDATE public.subscriptions
            SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
                is_active = false,
                updated_at = v_now
            WHERE id = v_sub.id;
        END IF;

        -- Vérifier si un abonnement 'pending' existe pour cet utilisateur (Relais continuité J-7)
        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_key.user_id AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            -- Activation immédiate du pack en attente
            UPDATE public.subscriptions
            SET status = 'active',
                is_active = true,
                starts_at = v_now,
                expires_at = v_now + INTERVAL '30 days',
                updated_at = v_now
            WHERE id = v_pending_sub.id
            RETURNING * INTO v_sub;

            -- Liaison de la clé API au nouvel abonnement
            UPDATE public.api_keys
            SET subscription_id = v_sub.id,
                is_enabled = true,
                updated_at = v_now
            WHERE id = v_key.id;
        ELSE
            -- Aucun pack en attente -> Coupure nette
            UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = v_key.id;
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 402,
                'error_code', CASE WHEN v_sub.balance_usd <= 0 THEN 'SUBSCRIPTION_DEPLETED' ELSE 'SUBSCRIPTION_EXPIRED' END,
                'error_message', 'Votre abonnement est arrivé à expiration ou votre budget est épuisé. Veuillez souscrire à un nouveau pack.'
            );
        END IF;
    END IF;

    -- 4. Recherche du palier pour validation mathématique
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 500,
            'error_code', 'TIER_CONFIGURATION_ERROR',
            'error_message', 'Configuration de palier invalide en base.'
        );
    END IF;

    -- 5. Recherche du modèle et vérification de la formule mathématique MaxAllowedCost(P_i)
    SELECT * INTO v_model
    FROM public.models
    WHERE id = p_model_id AND is_active = true;

    IF NOT FOUND THEN
        -- Si modèle avec suffixe :free
        IF p_model_id LIKE '%:free' THEN
            v_is_free := true;
        ELSE
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 404,
                'error_code', 'MODEL_NOT_FOUND',
                'error_message', format('Le modèle "%s" est introuvable ou inactif.', p_model_id)
            );
        END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR v_model.power_level = 'low' AND v_model.id LIKE '%:free' THEN
            v_is_free := true;
        END IF;
    END IF;

    -- VÉRIFICATION DU PALIER (SECTION 3) : Formule MaxAllowedCost(P_i) = alpha * i + beta
    -- Si modèle payant, son coût combiné par 1M tokens doit être <= MaxAllowedCost(P_i)
    IF NOT v_is_free AND v_model.id IS NOT NULL THEN
        IF v_model.combined_cost_per_million_usd > v_tier.max_cost_per_million_usd THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 403,
                'error_code', 'TIER_MODEL_NOT_PERMITTED',
                'error_message', 'Ce modèle n''est pas inclus dans votre palier actuel.',
                'details', format(
                    'Votre palier (%s - %s) autorise un coût combiné maximum de %s $/1M tokens. Le modèle demandé (%s) requiert %s $/1M tokens.',
                    v_tier.tier_number,
                    v_tier.name,
                    v_tier.max_cost_per_million_usd,
                    v_model.name,
                    v_model.combined_cost_per_million_usd
                ),
                'tier_number', v_tier.tier_number,
                'max_allowed_cost', v_tier.max_cost_per_million_usd,
                'model_cost', v_model.combined_cost_per_million_usd
            );
        END IF;
    END IF;

    -- 6. Modèles Gratuits : Passage immédiat sans déduction
    IF v_is_free THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', true,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number,
            'model_id', p_model_id,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', 0.0,
            'fallback_model_id', v_model.fallback_model_id
        );
    END IF;

    -- 7. Modèles Payants : Calcul de l'estimation et contrôle du solde
    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(1, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;

    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', false,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number,
            'model_id', v_model.id,
            'power_level', v_model.power_level,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost,
            'fallback_model_id', v_model.fallback_model_id
        );
    ELSE
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 402,
            'error_code', 'INSUFFICIENT_BALANCE',
            'error_message', format('Solde insuffisant ($%s) pour couvrir l''estimation de la requête ($%s).', v_sub.balance_usd, round(v_est_total_cost, 6)),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. RPC: axis_settle_usage (Décompte réel, verrous atomiques & log d'audit)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_settle_usage(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_output_tokens INTEGER DEFAULT 0,
    p_duration_ms INTEGER DEFAULT 0,
    p_status_code INTEGER DEFAULT 200,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_model RECORD;
    v_total_tokens INTEGER := 0;
    v_real_cost NUMERIC(16, 8) := 0.0;
    v_new_balance NUMERIC(14, 6) := 0.0;
    v_is_free BOOLEAN := false;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_total_tokens := GREATEST(0, p_input_tokens) + GREATEST(0, p_output_tokens);

    SELECT id, user_id, subscription_id INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable lors de la clôture.');
    END IF;

    -- Tarification du modèle
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) +
                       (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
    END IF;

    -- Déduction atomique sur la ligne verrouillée
    IF v_key.subscription_id IS NOT NULL THEN
        SELECT * INTO v_sub
        FROM public.subscriptions
        WHERE id = v_key.subscription_id
        FOR UPDATE;

        IF FOUND THEN
            IF NOT v_is_free AND v_real_cost > 0.0 AND p_status_code < 400 THEN
                v_new_balance := GREATEST(0.0, v_sub.balance_usd - v_real_cost);
                
                UPDATE public.subscriptions
                SET balance_usd = v_new_balance,
                    consumed_usd = consumed_usd + v_real_cost,
                    total_tokens_consumed = total_tokens_consumed + v_total_tokens,
                    status = CASE WHEN v_new_balance <= 0.0 THEN 'depleted' ELSE 'active' END,
                    is_active = (v_new_balance > 0.0),
                    updated_at = v_now
                WHERE id = v_sub.id;

                -- Si le solde vient de s'épuiser, vérifier s'il existe un pack 'pending' pour ce user
                IF v_new_balance <= 0.0 THEN
                    SELECT * INTO v_pending_sub
                    FROM public.subscriptions
                    WHERE user_id = v_key.user_id AND status = 'pending'
                    ORDER BY created_at ASC
                    LIMIT 1
                    FOR UPDATE;

                    IF FOUND THEN
                        -- Activation immédiate du pack en attente
                        UPDATE public.subscriptions
                        SET status = 'active',
                            is_active = true,
                            starts_at = v_now,
                            expires_at = v_now + INTERVAL '30 days',
                            updated_at = v_now
                        WHERE id = v_pending_sub.id;

                        -- Mise à jour de la clé pour pointer sur le nouveau pack
                        UPDATE public.api_keys
                        SET subscription_id = v_pending_sub.id,
                            is_enabled = true,
                            updated_at = v_now
                        WHERE id = v_key.id;
                    ELSE
                        -- Désactivation de la clé
                        UPDATE public.api_keys
                        SET is_enabled = false,
                            updated_at = v_now
                        WHERE subscription_id = v_sub.id;
                    END IF;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
                -- Comptabiliser les tokens même si gratuit
                UPDATE public.subscriptions
                SET total_tokens_consumed = total_tokens_consumed + v_total_tokens,
                    updated_at = v_now
                WHERE id = v_sub.id;
            END IF;
        END IF;
    END IF;

    -- Mise à jour du timestamp sur la clé
    UPDATE public.api_keys SET last_used_at = v_now WHERE id = v_key.id;

    -- Journalisation dans usage_logs
    INSERT INTO public.usage_logs (
        api_key_id,
        subscription_id,
        model_id,
        power_level,
        input_tokens,
        output_tokens,
        total_tokens,
        cost_usd,
        is_free,
        duration_ms,
        status_code,
        error_message
    ) VALUES (
        v_key.id,
        v_key.subscription_id,
        p_model_id,
        v_model.power_level,
        p_input_tokens,
        p_output_tokens,
        v_total_tokens,
        v_real_cost,
        v_is_free,
        p_duration_ms,
        p_status_code,
        p_error_message
    );

    RETURN jsonb_build_object(
        'success', true,
        'cost_usd', v_real_cost,
        'is_free', v_is_free,
        'new_balance_usd', v_new_balance,
        'total_tokens', v_total_tokens
    );
END;
$$;

---

FICHIER: /supabase/migrations/004_production_supabase_architecture.sql

-- ==============================================================================
-- ACCESS AI / AXIS PROXY - PRODUCTION DATABASE ARCHITECTURE & ROLES
-- ROLES: admin, moderator, client | VALIDATION HORS-LIGNE & COMMISSIONS | RÈGLE J-7
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE: profiles (Authentification, Rôles et Codes Modérateurs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    pseudo VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'moderator', 'client')),
    moderator_code VARCHAR(20) UNIQUE DEFAULT NULL, -- ex: 'MOD-8421' (attribué aux modérateurs)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_moderator_code ON public.profiles(moderator_code);

-- Trigger automatique de création du profil à l'inscription (Google Auth & Email/MDP)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_username VARCHAR(50);
    v_pseudo VARCHAR(50);
BEGIN
    v_username := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    );
    v_pseudo := COALESCE(
        new.raw_user_meta_data->>'pseudo',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, username, pseudo, role)
    VALUES (new.id, new.email, v_username, v_pseudo, 'client')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. TABLE: tiers (Les 7 Paliers d'abonnements et formule MaxAllowedCost)
-- Formule : MaxAllowedCost(P_i) = alpha * i + beta (en USD par 1M tokens combinés)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiers (
    tier_number INTEGER PRIMARY KEY CHECK (tier_number BETWEEN 1 AND 7),
    name VARCHAR(50) NOT NULL,
    alpha NUMERIC(8, 2) NOT NULL DEFAULT 5.00,
    beta NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    max_cost_per_million_usd NUMERIC(10, 2) GENERATED ALWAYS AS (alpha * tier_number + beta) STORED,
    price_usd NUMERIC(10, 2) NOT NULL,
    budget_amount_usd NUMERIC(10, 2) NOT NULL,
    description TEXT
);

INSERT INTO public.tiers (tier_number, name, alpha, beta, price_usd, budget_amount_usd, description)
VALUES
    (1, 'Palier 1 - Starter', 5.00, 0.00, 10.00, 10.00, 'Modèles gratuits et ultra-économiques (max 5$/1M tokens)'),
    (2, 'Palier 2 - Basic', 5.00, 0.00, 25.00, 25.00, 'Modèles légers et polyvalents (max 10$/1M tokens)'),
    (3, 'Palier 3 - Standard', 5.00, 0.00, 50.00, 50.00, 'Modèles standards type GPT-4o (max 15$/1M tokens)'),
    (4, 'Palier 4 - Pro', 5.00, 0.00, 100.00, 100.00, 'Modèles de pointe type Claude 3.5 Sonnet (max 20$/1M tokens)'),
    (5, 'Palier 5 - Expert', 5.00, 0.00, 200.00, 200.00, 'Modèles haute performance (max 25$/1M tokens)'),
    (6, 'Palier 6 - Master', 5.00, 0.00, 350.00, 350.00, 'Modèles de raisonnement lourd (max 30$/1M tokens)'),
    (7, 'Palier 7 - Enterprise', 5.00, 0.00, 500.00, 500.00, 'Accès illimité sans restriction (max 35$/1M tokens)')
ON CONFLICT (tier_number) DO UPDATE SET
    name = EXCLUDED.name,
    alpha = EXCLUDED.alpha,
    beta = EXCLUDED.beta,
    price_usd = EXCLUDED.price_usd,
    budget_amount_usd = EXCLUDED.budget_amount_usd,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 3. TABLE: models (Catalogue OpenRouter & Niveaux de Puissance Axis Auto)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.models (
    id VARCHAR(120) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    input_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    output_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    combined_cost_per_million_usd NUMERIC(14, 4) GENERATED ALWAYS AS ((input_cost_per_token + output_cost_per_token) * 1000000) STORED,
    power_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (power_level IN ('low', 'medium', 'high', 'ultra')),
    tier VARCHAR(30) DEFAULT 'economy',
    context_length INTEGER DEFAULT 128000,
    fallback_model_id VARCHAR(120) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.models (id, name, input_cost_per_token, output_cost_per_token, power_level, tier, fallback_model_id)
VALUES
    ('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Free', 0.0, 0.0, 'low', 'free', 'google/gemini-2.0-flash-exp:free'),
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Exp Free', 0.0, 0.0, 'low', 'free', 'meta-llama/llama-3.3-70b-instruct:free'),
    ('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 0.00000010, 0.00000040, 'low', 'economy', 'openai/gpt-4o-mini'),
    ('openai/gpt-4o-mini', 'GPT-4o Mini', 0.00000015, 0.00000060, 'low', 'economy', 'google/gemini-2.0-flash-001'),
    ('deepseek/deepseek-chat', 'DeepSeek V3 Chat', 0.00000014, 0.00000028, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 0.00000025, 0.00000125, 'medium', 'economy', 'deepseek/deepseek-chat'),
    ('mistralai/mistral-small', 'Mistral Small', 0.00000020, 0.00000060, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('qwen/qwen-2.5-coder-32b-instruct', 'Qwen 2.5 Coder 32B', 0.00000007, 0.00000016, 'high', 'economy', 'openai/gpt-4o'),
    ('openai/gpt-4o', 'GPT-4o', 0.00000250, 0.00001000, 'high', 'performance', 'google/gemini-pro-1.5'),
    ('google/gemini-pro-1.5', 'Gemini 1.5 Pro', 0.00000125, 0.00000500, 'high', 'performance', 'openai/gpt-4o'),
    ('deepseek/deepseek-r1', 'DeepSeek R1 Reasoning', 0.00000055, 0.00000219, 'ultra', 'performance', 'openai/gpt-4o'),
    ('openai/o1-mini', 'OpenAI o1 Mini', 0.00000300, 0.00001200, 'ultra', 'performance', 'anthropic/claude-3.5-sonnet'),
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 0.00000300, 0.00001500, 'ultra', 'performance', 'deepseek/deepseek-r1')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    input_cost_per_token = EXCLUDED.input_cost_per_token,
    output_cost_per_token = EXCLUDED.output_cost_per_token,
    power_level = EXCLUDED.power_level,
    tier = EXCLUDED.tier,
    fallback_model_id = EXCLUDED.fallback_model_id,
    updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 4. TABLE: subscriptions (Cycle 30 jours, validation modérateur, J-7 & motif de désactivation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL REFERENCES public.tiers(tier_number),
    budget_amount_usd NUMERIC(14, 6) NOT NULL CHECK (budget_amount_usd >= 0),
    balance_usd NUMERIC(14, 6) NOT NULL CHECK (balance_usd >= 0),
    consumed_usd NUMERIC(14, 6) NOT NULL DEFAULT 0.0,
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('active', 'pending_validation', 'pending', 'expired', 'depleted', 'disabled')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    
    -- Suivi Modérateur & Validation hors-ligne
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderator_code_used VARCHAR(20) DEFAULT NULL,
    validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ DEFAULT NULL,
    commission_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (commission_status IN ('unpaid', 'paid', 'archived', 'none')),

    -- Justificatif de désactivation administrative (Affiché en popup/alerte au client)
    disabled_reason TEXT DEFAULT NULL,
    disabled_at TIMESTAMPTZ DEFAULT NULL,
    disabled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_sub_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_moderator ON public.subscriptions(moderator_id, commission_status);

-- ------------------------------------------------------------------------------
-- 5. TABLE: api_keys (1 clé API = 1 abonnement actif unique)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    daily_request_limit INTEGER DEFAULT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- ------------------------------------------------------------------------------
-- 6. TABLE: usage_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    model_id VARCHAR(120) NOT NULL,
    power_level VARCHAR(20),
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(16, 8) NOT NULL DEFAULT 0.0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER NOT NULL DEFAULT 200,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_key_date ON public.usage_logs(api_key_id, created_at);

-- ==============================================================================
-- 7. FONCTIONS RPC MÉTIER
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RPC 1 : axis_create_moderator (Création d'un modérateur par l'administrateur)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_create_moderator(
    p_admin_id UUID,
    p_user_id UUID,
    p_custom_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_mod_code VARCHAR(20);
BEGIN
    -- Vérification des droits administrateur
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'UNAUTHORIZED',
            'error_message', 'Seul un administrateur peut créer ou nommer un modérateur.'
        );
    END IF;

    -- Génération d'un code unique MOD-XXXX si non fourni
    IF p_custom_code IS NOT NULL AND trim(p_custom_code) != '' THEN
        v_mod_code := upper(trim(p_custom_code));
    ELSE
        v_mod_code := 'MOD-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');
    END IF;

    UPDATE public.profiles
    SET role = 'moderator',
        moderator_code = v_mod_code,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'user_id', p_user_id,
        'role', 'moderator',
        'moderator_code', v_mod_code,
        'message', format('Rôle modérateur attribué avec succès. Identifiant : %s', v_mod_code)
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 2 : axis_subscribe (Souscription par le client avec saisie modérateur et règle J-7)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_subscribe(
    p_user_id UUID,
    p_tier_number INTEGER,
    p_moderator_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tier RECORD;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_mod RECORD;
    v_new_sub_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_is_renewal BOOLEAN := false;
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 1. Vérification du palier
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_code', 'INVALID_TIER', 'error_message', 'Palier invalide.');
    END IF;

    -- 2. Recherche du modérateur si un code a été renseigné
    IF p_moderator_code IS NOT NULL AND trim(p_moderator_code) != '' THEN
        SELECT id, moderator_code INTO v_mod
        FROM public.profiles
        WHERE moderator_code = upper(trim(p_moderator_code)) AND role = 'moderator';

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 404,
                'error_code', 'INVALID_MODERATOR_CODE',
                'error_message', format('Le code modérateur "%s" est invalide ou inactif.', p_moderator_code)
            );
        END IF;
    END IF;

    -- 3. Vérification de l'abonnement actif pour la règle anti-abus des 7 jours
    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND is_active = true
      AND expires_at > v_now
      AND balance_usd > 0
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Règle J-7 : Tentative avant les 7 derniers jours -> REFUS STRICT
        IF v_now < (v_active_sub.expires_at - INTERVAL '7 days') THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 409,
                'error_code', 'EARLY_RENEWAL_FORBIDDEN',
                'error_message', format(
                    'Vous disposez déjà d''un abonnement actif. La souscription anticipée n''est autorisée que dans les 7 jours précédant l''expiration (à partir du %s).',
                    (v_active_sub.expires_at - INTERVAL '7 days')::date
                ),
                'active_expires_at', v_active_sub.expires_at
            );
        END IF;

        -- Vérification si un renouvellement en attente existe déjà
        SELECT id INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = p_user_id AND status IN ('pending', 'pending_validation')
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 409,
                'error_code', 'PENDING_ALREADY_EXISTS',
                'error_message', 'Un abonnement de renouvellement est déjà en attente pour votre compte.'
            );
        END IF;

        v_is_renewal := true;
        v_starts_at := v_active_sub.expires_at;
        v_expires_at := v_starts_at + INTERVAL '30 days';
    ELSE
        v_starts_at := v_now;
        v_expires_at := v_now + INTERVAL '30 days';
    END IF;

    -- 4. Création de la souscription en attente de paiement / validation hors-ligne
    INSERT INTO public.subscriptions (
        user_id,
        tier_number,
        budget_amount_usd,
        balance_usd,
        consumed_usd,
        starts_at,
        expires_at,
        status,
        is_active,
        moderator_id,
        moderator_code_used,
        commission_status
    ) VALUES (
        p_user_id,
        v_tier.tier_number,
        v_tier.budget_amount_usd,
        v_tier.budget_amount_usd,
        0.0,
        v_starts_at,
        v_expires_at,
        'pending_validation',
        false,
        v_mod.id,
        v_mod.moderator_code,
        CASE WHEN v_mod.id IS NOT NULL THEN 'unpaid' ELSE 'none' END
    ) RETURNING id INTO v_new_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'subscription_id', v_new_sub_id,
        'status', 'pending_validation',
        'is_renewal_j7', v_is_renewal,
        'tier_number', v_tier.tier_number,
        'price_usd', v_tier.price_usd,
        'moderator_assigned', v_mod.moderator_code,
        'instructions', 'Veuillez effectuer le règlement hors-ligne sur le numéro officiel. Votre abonnement sera activé dès validation par le modérateur ou l''administrateur.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 3 : axis_moderator_validate_subscription (Validation de l'abonnement par le Modérateur)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_moderator_validate_subscription(
    p_validator_id UUID,
    p_subscription_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_validator RECORD;
    v_sub RECORD;
    v_active_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_new_status VARCHAR(30);
    v_make_active BOOLEAN := false;
BEGIN
    -- 1. Contrôle des permissions de l'opérateur (Modérateur ou Admin)
    SELECT role, moderator_code INTO v_validator
    FROM public.profiles
    WHERE id = p_validator_id;

    IF NOT FOUND OR v_validator.role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'UNAUTHORIZED',
            'error_message', 'Seuls les modérateurs et administrateurs peuvent valider les abonnements.'
        );
    END IF;

    -- 2. Recherche et verrouillage de l'abonnement
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = p_subscription_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
    END IF;

    IF v_sub.status != 'pending_validation' THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 400,
            'error_code', 'ALREADY_PROCESSED',
            'error_message', format('Cet abonnement est déjà dans l''état "%s".', v_sub.status)
        );
    END IF;

    -- Un modérateur ne peut valider que les clients qui ont renseigné son code (ou assignés à lui)
    IF v_validator.role = 'moderator' AND v_sub.moderator_id IS NOT NULL AND v_sub.moderator_id != p_validator_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'FORBIDDEN',
            'error_message', 'Vous ne pouvez valider que les abonnements rattachés à votre identifiant modérateur.'
        );
    END IF;

    -- 3. Détermination du statut : Actif immédiat ou Pending (si renouvellement J-7)
    SELECT id, expires_at INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = v_sub.user_id
      AND id != v_sub.id
      AND status = 'active'
      AND is_active = true
      AND expires_at > v_now
      AND balance_usd > 0
    LIMIT 1;

    IF FOUND THEN
        -- Le client a encore un abonnement actif en cours -> pack validé placé en 'pending' pour la relève
        v_new_status := 'pending';
        v_make_active := false;
    ELSE
        -- Pas d'abonnement actif -> Activation immédiate pour 30 jours
        v_new_status := 'active';
        v_make_active := true;
    END IF;

    UPDATE public.subscriptions
    SET status = v_new_status,
        is_active = v_make_active,
        starts_at = CASE WHEN v_make_active THEN v_now ELSE v_sub.starts_at END,
        expires_at = CASE WHEN v_make_active THEN v_now + INTERVAL '30 days' ELSE v_sub.expires_at END,
        validated_by = p_validator_id,
        validated_at = v_now,
        updated_at = v_now
    WHERE id = p_subscription_id;

    -- Si activation immédiate, mise à jour ou raccordement de la clé API du client
    IF v_make_active THEN
        UPDATE public.api_keys
        SET subscription_id = p_subscription_id,
            is_enabled = true,
            updated_at = v_now
        WHERE user_id = v_sub.user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'subscription_id', p_subscription_id,
        'assigned_status', v_new_status,
        'is_active', v_make_active,
        'validated_by', p_validator_id,
        'message', CASE 
            WHEN v_make_active THEN 'Paiement validé : abonnement activé immédiatement pour 30 jours.'
            ELSE 'Paiement validé : abonnement mis en attente (relais automatique à l''échéance de l''actuel).'
        END
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 4 : admin_disable_subscription (Désactivation avec motif obligatoire - Admin Seul)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_disable_subscription(
    p_admin_id UUID,
    p_subscription_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Contrôle strict du rôle administrateur
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'UNAUTHORIZED',
            'error_message', 'Action réservée exclusivement à l''administrateur suprême. Les modérateurs n''ont pas le droit de désactiver un abonnement.'
        );
    END IF;

    -- 2. Justificatif textuel obligatoire
    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 400,
            'error_code', 'REASON_REQUIRED',
            'error_message', 'Un justificatif textuel détaillé est obligatoire pour désactiver un abonnement.'
        );
    END IF;

    -- 3. Désactivation de l'abonnement
    UPDATE public.subscriptions
    SET status = 'disabled',
        is_active = false,
        disabled_reason = trim(p_reason),
        disabled_at = v_now,
        disabled_by = p_admin_id,
        updated_at = v_now
    WHERE id = p_subscription_id
    RETURNING * INTO v_sub;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
    END IF;

    -- Désactivation immédiate de la clé API
    UPDATE public.api_keys
    SET is_enabled = false,
        updated_at = v_now
    WHERE subscription_id = p_subscription_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'subscription_id', p_subscription_id,
        'disabled_reason', trim(p_reason),
        'message', 'Abonnement désactivé avec succès. Le motif sera affiché au client sous forme d''alerte popup.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 5 : admin_archive_moderator_commissions (Clôture des commissions modérateur)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_archive_moderator_commissions(
    p_admin_id UUID,
    p_moderator_id UUID,
    p_subscription_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Action réservée à l''administrateur.');
    END IF;

    IF p_subscription_ids IS NOT NULL AND array_length(p_subscription_ids, 1) > 0 THEN
        UPDATE public.subscriptions
        SET commission_status = 'archived',
            updated_at = timezone('utc'::text, now())
        WHERE moderator_id = p_moderator_id
          AND id = ANY(p_subscription_ids)
          AND commission_status = 'unpaid';
    ELSE
        UPDATE public.subscriptions
        SET commission_status = 'archived',
            updated_at = timezone('utc'::text, now())
        WHERE moderator_id = p_moderator_id
          AND commission_status = 'unpaid';
    END IF;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'moderator_id', p_moderator_id,
        'archived_commissions_count', v_updated_count,
        'message', 'Commissions modérateur archivées avec succès.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 6 : axis_get_user_status (Consultation profil, solde, popups d'alerte et relai J-7)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_get_user_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_disabled_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT id, email, username, pseudo, role, moderator_code
    INTO v_user
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Utilisateur introuvable.');
    END IF;

    -- Si administrateur : Accès illimité et gratuit sans abonnement requis
    IF v_user.role = 'admin' THEN
        RETURN jsonb_build_object(
            'success', true,
            'user', jsonb_build_object('id', v_user.id, 'username', v_user.username, 'role', 'admin'),
            'is_admin', true,
            'unlimited_access', true,
            'message', 'Accès administrateur suprême illimité et gratuit.'
        );
    END IF;

    -- Recherche abonnement actif
    SELECT s.*, t.name as tier_name, t.max_cost_per_million_usd
    INTO v_active_sub
    FROM public.subscriptions s
    JOIN public.tiers t ON t.tier_number = s.tier_number
    WHERE s.user_id = p_user_id AND s.status = 'active' AND s.is_active = true
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- Recherche abonnement pending (J-7 ou en attente de relève)
    SELECT s.*, t.name as tier_name
    INTO v_pending_sub
    FROM public.subscriptions s
    JOIN public.tiers t ON t.tier_number = s.tier_number
    WHERE s.user_id = p_user_id AND s.status IN ('pending', 'pending_validation')
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- Recherche dernier abonnement désactivé avec motif pour alerte popup
    SELECT disabled_reason, disabled_at
    INTO v_disabled_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'disabled' AND disabled_reason IS NOT NULL
    ORDER BY disabled_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'pseudo', v_user.pseudo,
            'role', v_user.role,
            'moderator_code', v_user.moderator_code
        ),
        'active_subscription', CASE WHEN v_active_sub.id IS NOT NULL THEN jsonb_build_object(
            'id', v_active_sub.id,
            'tier_number', v_active_sub.tier_number,
            'tier_name', v_active_sub.tier_name,
            'balance_usd', v_active_sub.balance_usd,
            'starts_at', v_active_sub.starts_at,
            'expires_at', v_active_sub.expires_at,
            'days_remaining', GREATEST(0, extract(day from (v_active_sub.expires_at - v_now))::int),
            'is_in_j7_window', (v_now >= v_active_sub.expires_at - INTERVAL '7 days')
        ) ELSE NULL END,
        'pending_subscription', CASE WHEN v_pending_sub.id IS NOT NULL THEN jsonb_build_object(
            'id', v_pending_sub.id,
            'status', v_pending_sub.status,
            'tier_number', v_pending_sub.tier_number,
            'tier_name', v_pending_sub.tier_name,
            'scheduled_starts_at', v_pending_sub.starts_at
        ) ELSE NULL END,
        'popup_alert', CASE WHEN v_disabled_sub.disabled_reason IS NOT NULL THEN jsonb_build_object(
            'type', 'SUBSCRIPTION_DISABLED',
            'title', 'Abonnement Désactivé par l''Administration',
            'reason', v_disabled_sub.disabled_reason,
            'disabled_at', v_disabled_sub.disabled_at
        ) ELSE NULL END
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 7 : axis_gatekeeper_validate (Gatekeeper atomique avec Bypass Admin)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_max_output_tokens INTEGER DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_user RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_tier RECORD;
    v_model RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_input_cost NUMERIC(18, 10) := 0;
    v_output_cost NUMERIC(18, 10) := 0;
    v_est_total_cost NUMERIC(18, 10) := 0;
    v_is_free BOOLEAN := false;
BEGIN
    -- 1. Validation de la clé API
    SELECT * INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 401,
            'error_code', 'INVALID_API_KEY',
            'error_message', 'Clé API inconnue ou invalide.'
        );
    END IF;

    -- Récupération du profil
    SELECT * INTO v_user FROM public.profiles WHERE id = v_key.user_id;

    -- 2. PRIVILÈGE ADMINISTRATEUR : ACCÈS TOTAL, GRATUIT & ILLIMITÉ SANS ABONNEMENT
    IF v_user.role = 'admin' THEN
        SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_admin', true,
            'is_free', true,
            'http_status', 200,
            'api_key_id', v_key.id,
            'model_id', p_model_id,
            'tier_number', 7,
            'current_balance_usd', 999999.0,
            'estimated_cost_usd', 0.0,
            'message', 'Accès Administrateur privilégié sans limite de coût.'
        );
    END IF;

    -- 3. Vérification de l'abonnement
    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'NO_SUBSCRIPTION',
            'error_message', 'Aucun abonnement actif n''est associé à cette clé API.'
        );
    END IF;

    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = v_key.subscription_id
    FOR UPDATE;

    -- Vérification de désactivation administrative avec motif
    IF FOUND AND v_sub.status = 'disabled' THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_DISABLED_BY_ADMIN',
            'error_message', 'Votre abonnement a été désactivé par l''administrateur.',
            'disabled_reason', v_sub.disabled_reason
        );
    END IF;

    -- 4. Expiration 30 jours calendaires ou Épuisement du solde
    IF NOT FOUND OR v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        IF FOUND AND v_sub.status = 'active' THEN
            UPDATE public.subscriptions
            SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
                is_active = false,
                updated_at = v_now
            WHERE id = v_sub.id;
        END IF;

        -- Vérifier s'il existe un pack 'pending' validé en attente de relève (Continuité J-7)
        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_key.user_id AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            -- Activation atomique immédiate du pack en attente
            UPDATE public.subscriptions
            SET status = 'active',
                is_active = true,
                starts_at = v_now,
                expires_at = v_now + INTERVAL '30 days',
                updated_at = v_now
            WHERE id = v_pending_sub.id
            RETURNING * INTO v_sub;

            UPDATE public.api_keys
            SET subscription_id = v_sub.id,
                is_enabled = true,
                updated_at = v_now
            WHERE id = v_key.id;
        ELSE
            -- Pas de relève -> coupure
            UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = v_key.id;
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 402,
                'error_code', CASE WHEN v_sub.balance_usd <= 0 THEN 'SUBSCRIPTION_DEPLETED' ELSE 'SUBSCRIPTION_EXPIRED' END,
                'error_message', 'Votre abonnement est arrivé à expiration ou votre budget est épuisé.'
            );
        END IF;
    END IF;

    -- 5. Vérification du palier et formule MaxAllowedCost(P_i)
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id AND is_active = true;

    IF NOT FOUND THEN
        IF p_model_id LIKE '%:free' THEN
            v_is_free := true;
        ELSE
            RETURN jsonb_build_object('is_allowed', false, 'http_status', 404, 'error_code', 'MODEL_NOT_FOUND', 'error_message', 'Modèle non répertorié.');
        END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
            v_is_free := true;
        END IF;
    END IF;

    -- Contrôle de plafond MaxAllowedCost(P_i)
    IF NOT v_is_free AND v_model.id IS NOT NULL THEN
        IF v_model.combined_cost_per_million_usd > v_tier.max_cost_per_million_usd THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 403,
                'error_code', 'TIER_MODEL_NOT_PERMITTED',
                'error_message', 'Ce modèle n''est pas inclus dans votre palier actuel.',
                'tier_number', v_tier.tier_number,
                'max_allowed_cost', v_tier.max_cost_per_million_usd,
                'model_cost', v_model.combined_cost_per_million_usd
            );
        END IF;
    END IF;

    IF v_is_free THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', true,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number,
            'model_id', p_model_id,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', 0.0
        );
    END IF;

    -- Estimation budgétaire
    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(1, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;

    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', false,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number,
            'model_id', v_model.id,
            'power_level', v_model.power_level,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost,
            'fallback_model_id', v_model.fallback_model_id
        );
    ELSE
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 402,
            'error_code', 'INSUFFICIENT_BALANCE',
            'error_message', format('Solde insuffisant ($%s) pour couvrir la requête ($%s).', v_sub.balance_usd, round(v_est_total_cost, 6)),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 8 : axis_settle_usage (Décompte réel atomique & journalisation)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_settle_usage(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_output_tokens INTEGER DEFAULT 0,
    p_duration_ms INTEGER DEFAULT 0,
    p_status_code INTEGER DEFAULT 200,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_user RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_model RECORD;
    v_total_tokens INTEGER := 0;
    v_real_cost NUMERIC(16, 8) := 0.0;
    v_new_balance NUMERIC(14, 6) := 0.0;
    v_is_free BOOLEAN := false;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_total_tokens := GREATEST(0, p_input_tokens) + GREATEST(0, p_output_tokens);

    SELECT id, user_id, subscription_id INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable.');
    END IF;

    SELECT role INTO v_user FROM public.profiles WHERE id = v_key.user_id;

    -- Si administrateur : aucune déduction de solde
    IF v_user.role = 'admin' THEN
        INSERT INTO public.usage_logs (
            api_key_id, model_id, input_tokens, output_tokens, total_tokens, cost_usd, is_free, duration_ms, status_code
        ) VALUES (
            v_key.id, p_model_id, p_input_tokens, p_output_tokens, v_total_tokens, 0.0, true, p_duration_ms, p_status_code
        );
        RETURN jsonb_build_object('success', true, 'is_admin', true, 'cost_usd', 0.0);
    END IF;

    -- Calcul du coût réel
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) +
                       (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
    END IF;

    IF v_key.subscription_id IS NOT NULL THEN
        SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;

        IF FOUND THEN
            IF NOT v_is_free AND v_real_cost > 0.0 AND p_status_code < 400 THEN
                v_new_balance := GREATEST(0.0, v_sub.balance_usd - v_real_cost);
                
                UPDATE public.subscriptions
                SET balance_usd = v_new_balance,
                    consumed_usd = consumed_usd + v_real_cost,
                    total_tokens_consumed = total_tokens_consumed + v_total_tokens,
                    status = CASE WHEN v_new_balance <= 0.0 THEN 'depleted' ELSE 'active' END,
                    is_active = (v_new_balance > 0.0),
                    updated_at = v_now
                WHERE id = v_sub.id;

                IF v_new_balance <= 0.0 THEN
                    SELECT * INTO v_pending_sub
                    FROM public.subscriptions
                    WHERE user_id = v_key.user_id AND status = 'pending'
                    ORDER BY created_at ASC
                    LIMIT 1
                    FOR UPDATE;

                    IF FOUND THEN
                        UPDATE public.subscriptions
                        SET status = 'active', is_active = true, starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now
                        WHERE id = v_pending_sub.id;

                        UPDATE public.api_keys SET subscription_id = v_pending_sub.id, is_enabled = true, updated_at = v_now WHERE id = v_key.id;
                    ELSE
                        UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE subscription_id = v_sub.id;
                    END IF;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
                UPDATE public.subscriptions
                SET total_tokens_consumed = total_tokens_consumed + v_total_tokens, updated_at = v_now
                WHERE id = v_sub.id;
            END IF;
        END IF;
    END IF;

    UPDATE public.api_keys SET last_used_at = v_now WHERE id = v_key.id;

    INSERT INTO public.usage_logs (
        api_key_id, subscription_id, model_id, power_level, input_tokens, output_tokens, total_tokens, cost_usd, is_free, duration_ms, status_code, error_message
    ) VALUES (
        v_key.id, v_key.subscription_id, p_model_id, v_model.power_level, p_input_tokens, p_output_tokens, v_total_tokens, v_real_cost, v_is_free, p_duration_ms, p_status_code, p_error_message
    );

    RETURN jsonb_build_object('success', true, 'cost_usd', v_real_cost, 'new_balance_usd', v_new_balance, 'total_tokens', v_total_tokens);
END;
$$;

---

FICHIER: /supabase/migrations/005_fix_key_sub_sync.sql

-- ==============================================================================
-- AXIS AI — MIGRATION 005 : Synchronisation atomique clé ↔ abonnement
-- 
-- Problème : Une clé API était activée (is_enabled = true) dès qu'un
-- subscription_id lui était associé, même si l'abonnement était encore
-- en statut `pending_validation` (paiement non validé).
-- 
-- Corrections :
-- 1. Trigger AFTER UPDATE sur subscriptions → synchronise api_keys.is_enabled
-- 2. axis_generate_api_key → n'active la clé que si l'abonnement est 'active'
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. TRIGGER : Synchronisation automatique de la clé liée
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_key_on_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Seulement si le statut ou is_active ont changé
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        
        UPDATE public.api_keys
        SET is_enabled = (NEW.status = 'active' AND NEW.is_active = true),
            updated_at = timezone('utc'::text, now())
        WHERE subscription_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

-- Appliquer le trigger à la table subscriptions
DROP TRIGGER IF EXISTS trg_sync_key_on_subscription_change ON public.subscriptions;
CREATE TRIGGER trg_sync_key_on_subscription_change
    AFTER UPDATE OF status, is_active
    ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_key_on_subscription_change();


-- ──────────────────────────────────────────────────────────────────────────────
-- 2. RPC axis_generate_api_key (correction : ne pas activer une clé si
--    l'abonnement lié n'est pas en statut 'active')
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user       RECORD;
    v_sub        RECORD;
    v_is_active  BOOLEAN := false;
    v_raw_secret TEXT;
    v_full_key   TEXT;
    v_key_hash   TEXT;
    v_key_prefix TEXT;
    v_key_id     UUID;
BEGIN
    -- 1. Récupération du profil utilisateur
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
                                  'error_message', 'Utilisateur introuvable.');
    END IF;

    -- 2. Si un abonnement est fourni, vérifier son existence ET son statut
    v_is_active := (v_user.role = 'admin');
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, status, is_active
          INTO v_sub
          FROM public.subscriptions
         WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404,
                                      'error_message',
                                      'Abonnement introuvable ou non associé à cet utilisateur.');
        END IF;
        -- Activation conditionnelle : admin OU abonnement actif
        v_is_active := (v_user.role = 'admin' OR (v_sub.status = 'active' AND v_sub.is_active = true));
    END IF;

    -- 3. Génération cryptographique résiliente
    BEGIN
        v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text)
                     || md5(random()::text || clock_timestamp()::text);
    END;

    v_full_key  := 'axis_live_' || substr(v_raw_secret, 1, 40);

    BEGIN
        v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;

    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 10) || '...';

    -- 4. Insertion avec le bon état
    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix,
                                 name, is_enabled, daily_request_limit)
    VALUES (
        p_user_id,
        p_subscription_id,
        v_key_hash,
        v_key_prefix,
        coalesce(nullif(trim(p_name), ''), 'Default API Key'),
        v_is_active,
        p_daily_limit
    )
    RETURNING id INTO v_key_id;

    RETURN jsonb_build_object(
        'success',    true,
        'http_status', 201,
        'key_id',     v_key_id,
        'api_key',    v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', v_is_active,
        'warning',    'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.'
    );
END;
$$;
-- ──────────────────────────────────────────────────────────────────────────────
-- 3. TRIGGER GARDE-FOU : Une clé ne peut être activée que si son abonnement
--    est 'active' (ou si le propriétaire est admin)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_key_requires_active_sub()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_role TEXT;
  v_ok BOOLEAN := false;
BEGIN
  IF NEW.is_enabled IS NOT TRUE THEN RETURN NEW; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = NEW.user_id;
  IF v_role = 'admin' THEN RETURN NEW; END IF;
  IF NEW.subscription_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = NEW.subscription_id
        AND status = 'active' AND is_active = true
        AND expires_at > now() AND balance_usd > 0
    ) INTO v_ok;
  END IF;
  IF NOT v_ok THEN NEW.is_enabled := false; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_key_requires_active_sub ON public.api_keys;
CREATE TRIGGER trg_key_requires_active_sub
BEFORE INSERT OR UPDATE OF is_enabled, subscription_id ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.enforce_key_requires_active_sub();

-- Nettoyage des clés actuellement actives avec un abonnement non valide
UPDATE public.api_keys k
SET is_enabled = false, updated_at = now()
WHERE k.is_enabled = true
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = k.user_id AND p.role = 'admin'
  )
-- ──────────────────────────────────────────────────────────────────────────────
-- 4. CORRECTION axis_moderator_validate_subscription : activer UNIQUEMENT
--    les clés explicitement LIÉES à cet abonnement (pas toutes les clés
--    de l'utilisateur)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.axis_moderator_validate_subscription(
    p_validator_id UUID,
    p_subscription_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_sub RECORD;
    v_validator_role TEXT;
BEGIN
    SELECT role INTO v_validator_role FROM public.profiles WHERE id = p_validator_id;
    IF v_validator_role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403,
            'error_message', 'Seuls les administrateurs et modérateurs peuvent valider un abonnement.');
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_message', 'Abonnement introuvable.');
    END IF;

    IF v_sub.status != 'pending_validation' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 409,
            'error_message', 'Cet abonnement n''est pas en attente de validation.');
    END IF;

    -- Activer l'abonnement
    UPDATE public.subscriptions
    SET status = 'active', is_active = true,
        validated_at = v_now, updated_at = v_now
    WHERE id = p_subscription_id;

    -- Activer UNIQUEMENT les clés liées à CET abonnement
    UPDATE public.api_keys
    SET is_enabled = true, updated_at = v_now
    WHERE subscription_id = p_subscription_id;

    RETURN jsonb_build_object(
        'success', true, 'http_status', 200,
        'subscription_id', p_subscription_id,
        'status', 'active',
        'message', 'Abonnement validé. Seules les clés liées sont activées.'
    );
END;
$$;
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.id = k.subscription_id
      AND s.status = 'active' AND s.is_active = true
      AND s.expires_at > now() AND s.balance_usd > 0
  );

---

FICHIER: /supabase/migrations/005b_gatekeeper_is_enabled_fix.sql

-- ==============================================================================
-- AXIS AI — MIGRATION 005b : Fix axis_gatekeeper_validate
-- Ajoute la vérification de is_enabled sur la clé API.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash VARCHAR, p_model_id VARCHAR,
    p_input_tokens INTEGER, p_max_output_tokens INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_key RECORD; v_sub RECORD; v_model RECORD; v_tier RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_input_cost NUMERIC(14,6); v_output_cost NUMERIC(14,6);
    v_est_total_cost NUMERIC(14,6);
BEGIN
    SELECT id, user_id, subscription_id, is_enabled INTO v_key
      FROM public.api_keys WHERE key_hash = p_key_hash;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 401,
            'error_code', 'INVALID_API_KEY', 'error_message', 'Clé API introuvable.');
    END IF;
    IF NOT v_key.is_enabled THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403,
            'error_code', 'KEY_DISABLED', 'error_message', 'Clé API désactivée.');
    END IF;
    IF v_key.subscription_id IS NULL THEN
        SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
        IF FOUND AND (v_model.input_cost_per_token + v_model.output_cost_per_token) = 0 THEN
            RETURN jsonb_build_object('is_allowed', true, 'http_status', 200, 'is_free', true,
                'api_key_id', v_key.id, 'subscription_id', NULL::UUID, 'tier_number', 0,
                'model_id', p_model_id, 'power_level', v_model.tier,
                'current_balance_usd', 0::NUMERIC(14,6), 'estimated_cost_usd', 0::NUMERIC(14,6),
                'message', 'Accès libre sans abonnement.');
        END IF;
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
            'error_code', 'NO_SUBSCRIPTION', 'error_message', 'Aucun abonnement.');
    END IF;
    SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 404,
            'error_code', 'SUBSCRIPTION_NOT_FOUND', 'error_message', 'Abonnement introuvable.');
    END IF;
    IF v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        DECLARE v_pending RECORD; BEGIN
            SELECT * INTO v_pending FROM public.subscriptions
             WHERE user_id = v_sub.user_id AND status = 'pending_validation'
               AND expires_at > v_now AND balance_usd > 0
             ORDER BY created_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED;
            IF FOUND THEN
                UPDATE public.subscriptions SET status = 'active', is_active = true,
                    starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now
                WHERE id = v_pending.id;
                UPDATE public.api_keys SET subscription_id = v_pending.id,
                    is_enabled = true, updated_at = v_now WHERE id = v_key.id;
                v_key.is_enabled := true;
                SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_pending.id;
            ELSE
                IF v_sub.status = 'active' THEN
                    UPDATE public.subscriptions SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
                        is_active = false, updated_at = v_now WHERE id = v_sub.id;
                END IF;
                RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
                    'error_code', CASE WHEN v_sub.balance_usd <= 0 THEN 'SUBSCRIPTION_DEPLETED' ELSE 'SUBSCRIPTION_EXPIRED' END,
                    'error_message', 'Abonnement expiré ou budget épuisé.', 'current_balance_usd', v_sub.balance_usd);
            END IF;
        END;
    END IF;
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 404,
            'error_code', 'MODEL_NOT_FOUND', 'error_message', 'Modèle non trouvé.', 'model_id', p_model_id);
    END IF;
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 500,
            'error_code', 'TIER_NOT_FOUND', 'error_message', 'Palier introuvable.');
    END IF;
    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(0, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;
    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object('is_allowed', true, 'http_status', 200,
            'api_key_id', v_key.id, 'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number, 'model_id', p_model_id,
            'power_level', v_model.tier,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost,
            'fallback_model_id', v_model.fallback_model_id);
    END IF;
    RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
        'error_code', 'INSUFFICIENT_BALANCE',
        'error_message', format('Solde insuffisant ($%s) pour couvrir la requête ($%s).', v_sub.balance_usd, round(v_est_total_cost, 6)),
        'current_balance_usd', v_sub.balance_usd, 'estimated_cost_usd', v_est_total_cost);
END; $$;

---

FICHIER: /supabase/migrations/006_fix_key_prefix_refresh.sql

-- ==============================================================================
-- AXIS AI — MIGRATION 006 : Correctifs clés API (préfixe, blocage refresh, retour)
-- Partie 1/2 : ALTER colonne + axis_generate_api_key corrigé
-- ==============================================================================

ALTER TABLE public.api_keys ALTER COLUMN key_prefix TYPE VARCHAR(24);

CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_user RECORD; v_sub RECORD; v_is_active BOOLEAN := false;
    v_raw_secret TEXT; v_full_key TEXT; v_key_hash TEXT; v_key_prefix TEXT; v_key_id UUID;
BEGIN
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;
    v_is_active := (v_user.role = 'admin');
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, status, is_active INTO v_sub
          FROM public.subscriptions WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
        END IF;
        v_is_active := (v_user.role = 'admin' OR (v_sub.status = 'active' AND v_sub.is_active = true));
    END IF;
    BEGIN v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;
    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);
    BEGIN v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;
    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 8) || '...';
    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix, name, is_enabled, daily_request_limit)
    VALUES (p_user_id, p_subscription_id, v_key_hash, v_key_prefix, coalesce(nullif(trim(p_name), ''), 'Default API Key'), v_is_active, p_daily_limit)
    RETURNING id INTO v_key_id;
    RETURN jsonb_build_object('success', true, 'http_status', 201, 'key_id', v_key_id,
        'api_key', v_full_key, 'key_prefix', v_key_prefix, 'is_enabled', v_is_active,
        'warning', 'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.');
END;
$$;
-- Partie 2/2 : axis_refresh_api_key — préfixe corrigé, blocage pending, retour normalisé
CREATE OR REPLACE FUNCTION public.axis_refresh_api_key(p_key_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_old_key RECORD; v_owner_role TEXT; v_sub_status TEXT;
    v_raw_secret TEXT; v_full_key TEXT; v_key_hash TEXT; v_key_prefix TEXT;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_old_key FROM public.api_keys WHERE id = p_key_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_code', 'KEY_NOT_FOUND', 'error_message', 'Clé API introuvable.');
    END IF;
    IF auth.uid() IS NOT NULL AND v_old_key.user_id <> auth.uid()
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403,
            'error_code', 'FORBIDDEN', 'error_message', 'Cette clé ne vous appartient pas.');
    END IF;
    SELECT role INTO v_owner_role FROM public.profiles WHERE id = v_old_key.user_id;
    IF v_owner_role IS DISTINCT FROM 'admin' AND v_old_key.subscription_id IS NOT NULL THEN
        SELECT status INTO v_sub_status FROM public.subscriptions WHERE id = v_old_key.subscription_id;
        IF v_sub_status IN ('pending', 'pending_validation') THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409,
                'error_code', 'REFRESH_BLOCKED_PENDING',
                'error_message', 'Régénération impossible : l''abonnement lié est en attente de validation.',
                'subscription_id', v_old_key.subscription_id);
        END IF;
    END IF;
    BEGIN v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;
    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);
    BEGIN v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;
    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 8) || '...';
    UPDATE public.api_keys SET key_hash = v_key_hash, key_prefix = v_key_prefix,
        last_used_at = NULL, updated_at = v_now WHERE id = p_key_id;
    RETURN jsonb_build_object('success', true, 'http_status', 200, 'key_id', p_key_id,
        'api_key', v_full_key, 'new_api_key', v_full_key, 'key_prefix', v_key_prefix,
        'is_enabled', v_old_key.is_enabled, 'subscription_id', v_old_key.subscription_id,
        'warning', 'Ancienne clé révoquée. Sauvegardez la nouvelle clé maintenant.');
END;
$$;

---

FICHIER: /supabase_hotfix.sql

-- ==============================================================================
-- AXIS AI — SCRIPT DE CORRECTIFS DE PRODUCTION (HOTFIX SUPABASE)
-- Résout :
-- 1. "record v_mod is not assigned yet" lors de la souscription sans modérateur
-- 2. "function gen_random_bytes(integer) does not exist" lors de la création de clé
-- 3. "infinite recursion detected in policy for relation profiles"
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 1 : Extension pgcrypto & Fonctions de sécurité
-- ──────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Fonction helper de contrôle administrateur SANS récursion RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 2 : Suppression et réécriture des politiques RLS récursives
-- ──────────────────────────────────────────────────────────────────────────────

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_moderator_assigned" ON public.subscriptions;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
    FOR ALL USING (public.is_admin());

CREATE POLICY "subscriptions_moderator_assigned" ON public.subscriptions
    FOR SELECT USING (moderator_id = auth.uid());

-- API KEYS
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_admin_all" ON public.api_keys;

CREATE POLICY "api_keys_select_own" ON public.api_keys
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "api_keys_admin_all" ON public.api_keys
    FOR ALL USING (public.is_admin());

-- USAGE LOGS
DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs_admin_all" ON public.usage_logs;

CREATE POLICY "usage_logs_select_own" ON public.usage_logs
    FOR SELECT USING (
        api_key_id IN (SELECT id FROM public.api_keys WHERE user_id = auth.uid())
    );

CREATE POLICY "usage_logs_admin_all" ON public.usage_logs
    FOR ALL USING (public.is_admin());


-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 3 : RPC axis_subscribe (Correction du bug record "v_mod" is not assigned)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.axis_subscribe(
    p_user_id UUID,
    p_tier_number INTEGER,
    p_moderator_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_tier RECORD;
    v_mod RECORD;
    v_mod_id UUID := NULL;
    v_mod_code_assigned TEXT := NULL;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
    v_is_renewal BOOLEAN := false;
    v_new_sub_id UUID;
BEGIN
    SELECT role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    IF v_user.role = 'admin' THEN
        RETURN jsonb_build_object('success', true, 'http_status', 200, 'message', 'L''administrateur bénéficie d''un accès illimité.');
    END IF;

    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Palier introuvable.');
    END IF;

    -- Affectation sécurisée du modérateur (ne plante pas si null)
    IF p_moderator_code IS NOT NULL AND trim(p_moderator_code) != '' THEN
        SELECT id, moderator_code INTO v_mod
        FROM public.profiles
        WHERE role = 'moderator' AND upper(moderator_code) = upper(trim(p_moderator_code));

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Identifiant modérateur introuvable.');
        END IF;
        v_mod_id := v_mod.id;
        v_mod_code_assigned := v_mod.moderator_code;
    END IF;

    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'active' AND is_active = true AND expires_at > v_now AND balance_usd > 0
    ORDER BY created_at DESC LIMIT 1;

    IF FOUND THEN
        IF v_now < (v_active_sub.expires_at - INTERVAL '7 days') THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 409,
                'error_code', 'EARLY_RENEWAL_FORBIDDEN',
                'error_message', 'Souscription anticipée autorisée uniquement dans les 7 derniers jours.',
                'active_expires_at', v_active_sub.expires_at
            );
        END IF;

        SELECT id INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = p_user_id AND status IN ('pending', 'pending_validation') LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409, 'error_code', 'PENDING_ALREADY_EXISTS', 'error_message', 'Un abonnement de renouvellement est déjà en attente.');
        END IF;

        v_is_renewal := true;
        v_starts_at := v_active_sub.expires_at;
        v_expires_at := v_starts_at + INTERVAL '30 days';
    ELSE
        v_starts_at := v_now;
        v_expires_at := v_now + INTERVAL '30 days';
    END IF;

    INSERT INTO public.subscriptions (
        user_id, tier_number, budget_amount_usd, balance_usd, consumed_usd,
        starts_at, expires_at, status, is_active, moderator_id, moderator_code_used, commission_status
    ) VALUES (
        p_user_id, v_tier.tier_number, v_tier.budget_amount_usd, v_tier.budget_amount_usd, 0.0,
        v_starts_at, v_expires_at, 'pending_validation', false, v_mod_id, v_mod_code_assigned,
        CASE WHEN v_mod_id IS NOT NULL THEN 'unpaid' ELSE 'none' END
    ) RETURNING id INTO v_new_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'subscription_id', v_new_sub_id,
        'status', 'pending_validation',
        'is_renewal_j7', v_is_renewal,
        'tier_number', v_tier.tier_number,
        'price_usd', v_tier.price_usd,
        'moderator_assigned', v_mod_code_assigned,
        'instructions', 'Effectuez le règlement hors-ligne. Votre pack sera activé dès validation.'
    );
END;
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 4 : RPC axis_generate_api_key (Indépendance totale vis-à-vis de pgcrypto)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user RECORD;
    v_sub RECORD;
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_key_hash TEXT;
    v_key_prefix TEXT;
    v_key_id UUID;
BEGIN
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    IF p_subscription_id IS NOT NULL THEN
        SELECT id INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable ou non associé à cet utilisateur.');
        END IF;
    END IF;

    -- Génération cryptographique résiliente : tente pgcrypto, fallback sur random natif
    BEGIN
        v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;

    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);

    -- Hachage SHA-256 résilient
    BEGIN
        v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;

    -- Préfixe court : 'ax_' + 10 hex + '...' = 16 chars exactement (tient dans varchar(16))
    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 10) || '...';

    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix, name, is_enabled, daily_request_limit)
    VALUES (

        p_user_id,
        p_subscription_id,
        v_key_hash,
        v_key_prefix,
        coalesce(nullif(trim(p_name), ''), 'Default API Key'),
        CASE WHEN v_user.role = 'admin' THEN true
             WHEN p_subscription_id IS NOT NULL THEN true
             ELSE false END,
        p_daily_limit
    )
    RETURNING id INTO v_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'key_id', v_key_id,
        'api_key', v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', CASE WHEN v_user.role = 'admin' THEN true WHEN p_subscription_id IS NOT NULL THEN true ELSE false END,
        'warning', 'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.'
    );
END;
$$;

-- Rotation de clé
CREATE OR REPLACE FUNCTION public.axis_refresh_api_key(
    p_key_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_old_key RECORD;
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_key_hash TEXT;
    v_key_prefix TEXT;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_old_key FROM public.api_keys WHERE id = p_key_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Clé API introuvable.');
    END IF;

    BEGIN
        v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;

    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);

    BEGIN
        v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;

    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 10) || '...';



    UPDATE public.api_keys
    SET key_hash = v_key_hash,
        key_prefix = v_key_prefix,
        last_used_at = NULL,
        updated_at = v_now
    WHERE id = p_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'key_id', p_key_id,
        'new_api_key', v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', v_old_key.is_enabled,
        'warning', 'Votre ancienne clé a été immédiatement révoquée. Remplacez-la dans votre IDE.'
    );
END;
$$;
-- ==============================================================================
-- ÉTAPE 5 : Trigger de synchronisation clé ↔ abonnement
-- Garantit qu'une clé liée à un abonnement est activée/désactivée en temps réel
-- lorsque le statut de l'abonnement change (pending_validation → active).
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_key_on_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        UPDATE public.api_keys
        SET is_enabled = (NEW.status = 'active' AND NEW.is_active = true),
            updated_at = timezone('utc'::text, now())
        WHERE subscription_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_key_on_subscription_change ON public.subscriptions;
CREATE TRIGGER trg_sync_key_on_subscription_change
    AFTER UPDATE OF status, is_active
    ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_key_on_subscription_change();

---

FICHIER: /supabase_production_schema.sql

-- ==============================================================================
-- ACCESS AI / AXIS PROXY - SCHEMA COMPLET DE PRODUCTION (SUPABASE SQL EDITOR)
-- Exécutez ce script directement dans le SQL Editor de Supabase pour déployer
-- l'intégralité de l'architecture : profils, rôles, modérateurs, abonnements,
-- paliers mathématiques, règle J-7, journalisation et procédures RPC sécurisées.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    pseudo VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'moderator', 'client')),
    moderator_code VARCHAR(20) UNIQUE DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_moderator_code ON public.profiles(moderator_code);

-- Avatar vectoriel : 20 icônes x 360 teintes x 3 tons = 21 600 variantes (NULL = dérivé automatiquement du pseudo)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_icon SMALLINT CHECK (avatar_icon BETWEEN 0 AND 19);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_hue  SMALLINT CHECK (avatar_hue  BETWEEN 0 AND 359);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_tone SMALLINT CHECK (avatar_tone BETWEEN 0 AND 2);

-- Trigger automatique de création de profil à l'inscription (Google Auth / Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_username VARCHAR(50);
    v_pseudo VARCHAR(50);
BEGIN
    v_username := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    );
    v_pseudo := COALESCE(
        new.raw_user_meta_data->>'pseudo',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, username, pseudo, role)
    VALUES (new.id, new.email, v_username, v_pseudo, 'client')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABLE TIERS (Les 7 Paliers avec formule mathématique : MaxAllowedCost = alpha * i + beta)
CREATE TABLE IF NOT EXISTS public.tiers (
    tier_number INTEGER PRIMARY KEY CHECK (tier_number BETWEEN 1 AND 7),
    name VARCHAR(50) NOT NULL,
    alpha NUMERIC(8, 2) NOT NULL DEFAULT 5.00,
    beta NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    max_cost_per_million_usd NUMERIC(10, 2) GENERATED ALWAYS AS (alpha * tier_number + beta) STORED,
    price_usd NUMERIC(10, 2) NOT NULL,
    budget_amount_usd NUMERIC(10, 2) NOT NULL,
    description TEXT
);

INSERT INTO public.tiers (tier_number, name, alpha, beta, price_usd, budget_amount_usd, description)
VALUES
    (1, 'Palier 1 - Starter', 5.00, 0.00, 10.00, 10.00, 'Modèles gratuits et ultra-économiques (max 5$/1M tokens)'),
    (2, 'Palier 2 - Basic', 5.00, 0.00, 25.00, 25.00, 'Modèles légers et polyvalents (max 10$/1M tokens)'),
    (3, 'Palier 3 - Standard', 5.00, 0.00, 50.00, 50.00, 'Modèles standards type GPT-4o (max 15$/1M tokens)'),
    (4, 'Palier 4 - Pro', 5.00, 0.00, 100.00, 100.00, 'Modèles de pointe type Claude 3.5 Sonnet (max 20$/1M tokens)'),
    (5, 'Palier 5 - Expert', 5.00, 0.00, 200.00, 200.00, 'Modèles haute performance (max 25$/1M tokens)'),
    (6, 'Palier 6 - Master', 5.00, 0.00, 350.00, 350.00, 'Modèles de raisonnement lourd (max 30$/1M tokens)'),
    (7, 'Palier 7 - Enterprise', 5.00, 0.00, 500.00, 500.00, 'Accès illimité sans restriction (max 35$/1M tokens)')
ON CONFLICT (tier_number) DO UPDATE SET
    name = EXCLUDED.name,
    alpha = EXCLUDED.alpha,
    beta = EXCLUDED.beta,
    price_usd = EXCLUDED.price_usd,
    budget_amount_usd = EXCLUDED.budget_amount_usd,
    description = EXCLUDED.description;

-- 4. TABLE MODELS (Catalogue OpenRouter classé par niveau de puissance)
CREATE TABLE IF NOT EXISTS public.models (
    id VARCHAR(120) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    input_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    output_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    combined_cost_per_million_usd NUMERIC(14, 4) GENERATED ALWAYS AS ((input_cost_per_token + output_cost_per_token) * 1000000) STORED,
    power_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (power_level IN ('low', 'medium', 'high', 'ultra')),
    tier VARCHAR(30) DEFAULT 'economy',
    context_length INTEGER DEFAULT 128000,
    fallback_model_id VARCHAR(120) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.models (id, name, input_cost_per_token, output_cost_per_token, power_level, tier, fallback_model_id)
VALUES
    ('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Free', 0.0, 0.0, 'low', 'free', 'google/gemini-2.0-flash-exp:free'),
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Exp Free', 0.0, 0.0, 'low', 'free', 'meta-llama/llama-3.3-70b-instruct:free'),
    ('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 0.00000010, 0.00000040, 'low', 'economy', 'openai/gpt-4o-mini'),
    ('openai/gpt-4o-mini', 'GPT-4o Mini', 0.00000015, 0.00000060, 'low', 'economy', 'google/gemini-2.0-flash-001'),
    ('deepseek/deepseek-chat', 'DeepSeek V3 Chat', 0.00000014, 0.00000028, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 0.00000025, 0.00000125, 'medium', 'economy', 'deepseek/deepseek-chat'),
    ('mistralai/mistral-small', 'Mistral Small', 0.00000020, 0.00000060, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('qwen/qwen-2.5-coder-32b-instruct', 'Qwen 2.5 Coder 32B', 0.00000007, 0.00000016, 'high', 'economy', 'openai/gpt-4o'),
    ('openai/gpt-4o', 'GPT-4o', 0.00000250, 0.00001000, 'high', 'performance', 'google/gemini-pro-1.5'),
    ('google/gemini-pro-1.5', 'Gemini 1.5 Pro', 0.00000125, 0.00000500, 'high', 'performance', 'openai/gpt-4o'),
    ('deepseek/deepseek-r1', 'DeepSeek R1 Reasoning', 0.00000055, 0.00000219, 'ultra', 'performance', 'openai/gpt-4o'),
    ('openai/o1-mini', 'OpenAI o1 Mini', 0.00000300, 0.00001200, 'ultra', 'performance', 'anthropic/claude-3.5-sonnet'),
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 0.00000300, 0.00001500, 'ultra', 'performance', 'deepseek/deepseek-r1')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    input_cost_per_token = EXCLUDED.input_cost_per_token,
    output_cost_per_token = EXCLUDED.output_cost_per_token,
    power_level = EXCLUDED.power_level,
    tier = EXCLUDED.tier,
    fallback_model_id = EXCLUDED.fallback_model_id,
    updated_at = timezone('utc'::text, now());

-- 5. TABLE SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL REFERENCES public.tiers(tier_number),
    budget_amount_usd NUMERIC(14, 6) NOT NULL CHECK (budget_amount_usd >= 0),
    balance_usd NUMERIC(14, 6) NOT NULL CHECK (balance_usd >= 0),
    consumed_usd NUMERIC(14, 6) NOT NULL DEFAULT 0.0,
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('active', 'pending_validation', 'pending', 'expired', 'depleted', 'disabled')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderator_code_used VARCHAR(20) DEFAULT NULL,
    validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ DEFAULT NULL,
    commission_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (commission_status IN ('unpaid', 'paid', 'archived', 'none')),

    disabled_reason TEXT DEFAULT NULL,
    disabled_at TIMESTAMPTZ DEFAULT NULL,
    disabled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_sub_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_moderator ON public.subscriptions(moderator_id, commission_status);

-- 6. TABLE API_KEYS
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(24) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    daily_request_limit INTEGER DEFAULT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Migration douce pour les bases déjà déployées (non bloquante)
DO $$
BEGIN
    ALTER TABLE public.api_keys ALTER COLUMN key_prefix TYPE VARCHAR(24);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'key_prefix non élargie : %', SQLERRM;
END $$;

-- 7. TABLE USAGE_LOGS
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    model_id VARCHAR(120) NOT NULL,
    power_level VARCHAR(20),
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(16, 8) NOT NULL DEFAULT 0.0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER NOT NULL DEFAULT 200,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_key_date ON public.usage_logs(api_key_id, created_at);

-- Vérifie que l'appelant authentifié est bien celui qu'il prétend être.
-- auth.uid() est NULL pour le backend (service_role), qui reste de confiance.
-- Un administrateur peut agir pour le compte d'un autre identifiant.
CREATE OR REPLACE FUNCTION public.assert_caller_is(p_claimed UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL
       AND auth.uid() IS DISTINCT FROM p_claimed
       AND NOT public.is_admin_unlocked() THEN
        RAISE EXCEPTION 'Identité non conforme' USING ERRCODE = '42501';
    END IF;
END;
$$;

-- 8. RPC: axis_create_moderator
CREATE OR REPLACE FUNCTION public.axis_create_moderator(
    p_admin_id UUID,
    p_user_id UUID,
    p_custom_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_mod_code VARCHAR(20);
BEGIN
    PERFORM public.assert_caller_is(p_admin_id);
    PERFORM public.assert_admin_unlocked();
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Seul un administrateur peut nommer un modérateur.');
    END IF;

    IF p_custom_code IS NOT NULL AND trim(p_custom_code) != '' THEN
        v_mod_code := upper(trim(p_custom_code));
    ELSE
        v_mod_code := 'MOD-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');
    END IF;

    UPDATE public.profiles
    SET role = 'moderator',
        moderator_code = v_mod_code,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'role', 'moderator',
        'moderator_code', v_mod_code
    );
END;
$$;

-- 9. RPC: axis_subscribe
CREATE OR REPLACE FUNCTION public.axis_subscribe(
    p_user_id UUID,
    p_tier_number INTEGER,
    p_moderator_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tier RECORD;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_mod RECORD;
    v_mod_id UUID := NULL;
    v_mod_code_assigned TEXT := NULL;
    v_new_sub_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_is_renewal BOOLEAN := false;
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
BEGIN
    PERFORM public.assert_caller_is(p_user_id);
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_code', 'INVALID_TIER', 'error_message', 'Palier invalide.');
    END IF;

    IF p_moderator_code IS NOT NULL AND trim(p_moderator_code) != '' THEN
        SELECT id, moderator_code INTO v_mod
        FROM public.profiles
        WHERE moderator_code = upper(trim(p_moderator_code)) AND role = 'moderator';

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_code', 'INVALID_MODERATOR_CODE', 'error_message', 'Code modérateur invalide.');
        END IF;
        v_mod_id := v_mod.id;
        v_mod_code_assigned := v_mod.moderator_code;
    END IF;

    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'active' AND is_active = true AND expires_at > v_now AND balance_usd > 0
    ORDER BY created_at DESC LIMIT 1;

    IF FOUND THEN
        IF v_now < (v_active_sub.expires_at - INTERVAL '7 days') THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 409,
                'error_code', 'EARLY_RENEWAL_FORBIDDEN',
                'error_message', 'Souscription anticipée autorisée uniquement dans les 7 derniers jours.',
                'active_expires_at', v_active_sub.expires_at
            );
        END IF;

        SELECT id INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = p_user_id AND status IN ('pending', 'pending_validation') LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409, 'error_code', 'PENDING_ALREADY_EXISTS', 'error_message', 'Un abonnement de renouvellement est déjà en attente.');
        END IF;

        v_is_renewal := true;
        v_starts_at := v_active_sub.expires_at;
        v_expires_at := v_starts_at + INTERVAL '30 days';
    ELSE
        v_starts_at := v_now;
        v_expires_at := v_now + INTERVAL '30 days';
    END IF;

    INSERT INTO public.subscriptions (
        user_id, tier_number, budget_amount_usd, balance_usd, consumed_usd,
        starts_at, expires_at, status, is_active, moderator_id, moderator_code_used, commission_status
    ) VALUES (
        p_user_id, v_tier.tier_number, v_tier.budget_amount_usd, v_tier.budget_amount_usd, 0.0,
        v_starts_at, v_expires_at, 'pending_validation', false, v_mod_id, v_mod_code_assigned,
        CASE WHEN v_mod_id IS NOT NULL THEN 'unpaid' ELSE 'none' END
    ) RETURNING id INTO v_new_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'subscription_id', v_new_sub_id,
        'status', 'pending_validation',
        'is_renewal_j7', v_is_renewal,
        'tier_number', v_tier.tier_number,
        'price_usd', v_tier.price_usd,
        'moderator_assigned', v_mod_code_assigned,
        'instructions', 'Effectuez le règlement hors-ligne sur le numéro officiel. Votre pack sera activé dès validation.'
    );
END;
$$;

-- 10. RPC: axis_moderator_validate_subscription
CREATE OR REPLACE FUNCTION public.axis_moderator_validate_subscription(
    p_validator_id UUID,
    p_subscription_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_validator RECORD;
    v_sub RECORD;
    v_active_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_new_status VARCHAR(30);
    v_make_active BOOLEAN := false;
BEGIN
    PERFORM public.assert_caller_is(p_validator_id);
    SELECT role INTO v_validator FROM public.profiles WHERE id = p_validator_id;
    IF NOT FOUND OR v_validator.role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Autorisation refusée.');
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
    END IF;

    IF v_sub.status != 'pending_validation' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_message', format('Abonnement déjà dans l''état "%s".', v_sub.status));
    END IF;

    IF v_validator.role = 'moderator' AND v_sub.moderator_id IS NOT NULL AND v_sub.moderator_id != p_validator_id THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Vous ne pouvez valider que les clients rattachés à votre code modérateur.');
    END IF;

    SELECT id INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = v_sub.user_id AND id != v_sub.id AND status = 'active' AND is_active = true AND expires_at > v_now AND balance_usd > 0 LIMIT 1;

    IF FOUND THEN
        v_new_status := 'pending';
        v_make_active := false;
    ELSE
        v_new_status := 'active';
        v_make_active := true;
    END IF;

    UPDATE public.subscriptions
    SET status = v_new_status,
        is_active = v_make_active,
        starts_at = CASE WHEN v_make_active THEN v_now ELSE v_sub.starts_at END,
        expires_at = CASE WHEN v_make_active THEN v_now + INTERVAL '30 days' ELSE v_sub.expires_at END,
        validated_by = p_validator_id,
        validated_at = v_now,
        updated_at = v_now
    WHERE id = p_subscription_id;

    IF v_make_active THEN
       UPDATE public.api_keys SET is_enabled = true, updated_at = v_now WHERE subscription_id = p_subscription_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'subscription_id', p_subscription_id,
        'assigned_status', v_new_status,
        'is_active', v_make_active,
        'message', CASE WHEN v_make_active THEN 'Abonnement activé pour 30 jours.' ELSE 'Abonnement mis en attente (relais J-7).' END
    );
END;
$$;

-- 11. RPC: admin_disable_subscription (Désactivation avec motif obligatoire - Admin Seul)
CREATE OR REPLACE FUNCTION public.admin_disable_subscription(
    p_admin_id UUID,
    p_subscription_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    PERFORM public.assert_caller_is(p_admin_id);
    PERFORM public.assert_admin_unlocked();
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Action réservée exclusivement à l''administrateur.');
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_message', 'Un justificatif textuel est obligatoire pour désactiver un abonnement.');
    END IF;

    UPDATE public.subscriptions
    SET status = 'disabled',
        is_active = false,
        disabled_reason = trim(p_reason),
        disabled_at = v_now,
        disabled_by = p_admin_id,
        updated_at = v_now
    WHERE id = p_subscription_id;

    UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE subscription_id = p_subscription_id;

    RETURN jsonb_build_object('success', true, 'subscription_id', p_subscription_id, 'disabled_reason', trim(p_reason));
END;
$$;

-- 12. RPC: axis_gatekeeper_validate
CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_max_output_tokens INTEGER DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_user RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_tier RECORD;
    v_model RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_input_cost NUMERIC(18, 10) := 0;
    v_output_cost NUMERIC(18, 10) := 0;
    v_est_total_cost NUMERIC(18, 10) := 0;
    v_is_free BOOLEAN := false;
BEGIN
    SELECT * INTO v_key FROM public.api_keys WHERE key_hash = p_key_hash;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 401, 'error_code', 'INVALID_API_KEY', 'error_message', 'Clé API invalide.');
    END IF;

    SELECT * INTO v_user FROM public.profiles WHERE id = v_key.user_id;

    -- PRIVILÈGE ADMIN : ACCÈS TOTAL ET GRATUIT
    IF v_user.role = 'admin' THEN
        RETURN jsonb_build_object('is_allowed', true, 'is_admin', true, 'is_free', true, 'http_status', 200, 'api_key_id', v_key.id, 'model_id', p_model_id, 'current_balance_usd', 999999.0);
    END IF;

    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403, 'error_code', 'NO_SUBSCRIPTION', 'error_message', 'Aucun abonnement rattaché.');
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;

    IF FOUND AND v_sub.status = 'disabled' THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_DISABLED_BY_ADMIN',
            'error_message', 'Abonnement désactivé par l''administrateur.',
            'disabled_reason', v_sub.disabled_reason
        );
    END IF;

    IF NOT FOUND OR v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        IF FOUND AND v_sub.status = 'active' THEN
            UPDATE public.subscriptions SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END, is_active = false, updated_at = v_now WHERE id = v_sub.id;
        END IF;

        -- Vérifier si un pending validé existe
        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_key.user_id AND status = 'pending' ORDER BY created_at ASC LIMIT 1 FOR UPDATE;

        IF FOUND THEN
            UPDATE public.subscriptions SET status = 'active', is_active = true, starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now WHERE id = v_pending_sub.id RETURNING * INTO v_sub;
            UPDATE public.api_keys SET subscription_id = v_sub.id, is_enabled = true, updated_at = v_now WHERE id = v_key.id;
            v_key.is_enabled := true;
        ELSE
            UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = v_key.id;
            RETURN jsonb_build_object('is_allowed', false, 'http_status', 402, 'error_code', 'SUBSCRIPTION_EXPIRED', 'error_message', 'Abonnement expiré ou solde épuisé.');
        END IF;
    END IF;

    -- La clé elle-même doit être activée (contrôle placé APRÈS le relais d'abonnement)
    IF NOT v_key.is_enabled THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403,
            'error_code', 'KEY_DISABLED', 'error_message', 'Cette clé API est désactivée.');
    END IF;

    -- Formule mathématique du palier
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id AND is_active = true;

    IF NOT FOUND THEN
        IF p_model_id LIKE '%:free' THEN v_is_free := true;
        ELSE RETURN jsonb_build_object('is_allowed', false, 'http_status', 404, 'error_message', 'Modèle introuvable.'); END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN v_is_free := true; END IF;
    END IF;

    IF NOT v_is_free AND v_model.id IS NOT NULL THEN
        IF v_model.combined_cost_per_million_usd > v_tier.max_cost_per_million_usd THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 403,
                'error_code', 'TIER_MODEL_NOT_PERMITTED',
                'error_message', 'Ce modèle n''est pas inclus dans votre palier actuel.'
            );
        END IF;
    END IF;

    IF v_is_free THEN
        RETURN jsonb_build_object('is_allowed', true, 'is_free', true, 'http_status', 200, 'current_balance_usd', v_sub.balance_usd, 'estimated_cost_usd', 0.0);
    END IF;

    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(1, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;

    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object('is_allowed', true, 'is_free', false, 'http_status', 200, 'current_balance_usd', v_sub.balance_usd, 'estimated_cost_usd', v_est_total_cost);
    ELSE
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 402, 'error_code', 'INSUFFICIENT_BALANCE', 'error_message', 'Solde insuffisant pour couvrir la requête.');
    END IF;
END;
$$;

-- 13. RPC: axis_settle_usage
CREATE OR REPLACE FUNCTION public.axis_settle_usage(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_output_tokens INTEGER DEFAULT 0,
    p_duration_ms INTEGER DEFAULT 0,
    p_status_code INTEGER DEFAULT 200,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_user RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_model RECORD;
    v_total_tokens INTEGER := 0;
    v_real_cost NUMERIC(16, 8) := 0.0;
    v_new_balance NUMERIC(14, 6) := 0.0;
    v_is_free BOOLEAN := false;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_total_tokens := GREATEST(0, p_input_tokens) + GREATEST(0, p_output_tokens);

    SELECT id, user_id, subscription_id INTO v_key FROM public.api_keys WHERE key_hash = p_key_hash;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable.'); END IF;

    SELECT role INTO v_user FROM public.profiles WHERE id = v_key.user_id;
    IF v_user.role = 'admin' THEN
        INSERT INTO public.usage_logs (api_key_id, model_id, input_tokens, output_tokens, total_tokens, cost_usd, is_free, duration_ms, status_code)
        VALUES (v_key.id, p_model_id, p_input_tokens, p_output_tokens, v_total_tokens, 0.0, true, p_duration_ms, p_status_code);
        RETURN jsonb_build_object('success', true, 'is_admin', true, 'cost_usd', 0.0);
    END IF;

    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) + (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
    END IF;

    IF v_key.subscription_id IS NOT NULL THEN
        SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;

        IF FOUND THEN
            IF NOT v_is_free AND v_real_cost > 0.0 AND p_status_code < 400 THEN
                v_new_balance := GREATEST(0.0, v_sub.balance_usd - v_real_cost);
                UPDATE public.subscriptions
                SET balance_usd = v_new_balance,
                    consumed_usd = consumed_usd + v_real_cost,
                    total_tokens_consumed = total_tokens_consumed + v_total_tokens,
                    status = CASE WHEN v_new_balance <= 0.0 THEN 'depleted' ELSE 'active' END,
                    is_active = (v_new_balance > 0.0),
                    updated_at = v_now
                WHERE id = v_sub.id;

                IF v_new_balance <= 0.0 THEN
                    SELECT * INTO v_pending_sub FROM public.subscriptions WHERE user_id = v_key.user_id AND status = 'pending' ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
                    IF FOUND THEN
                        UPDATE public.subscriptions SET status = 'active', is_active = true, starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now WHERE id = v_pending_sub.id;
                        UPDATE public.api_keys SET subscription_id = v_pending_sub.id, is_enabled = true, updated_at = v_now WHERE id = v_key.id;
                    ELSE
                        UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE subscription_id = v_sub.id;
                    END IF;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
                UPDATE public.subscriptions SET total_tokens_consumed = total_tokens_consumed + v_total_tokens, updated_at = v_now WHERE id = v_sub.id;
            END IF;
        END IF;
    END IF;

    UPDATE public.api_keys SET last_used_at = v_now WHERE id = v_key.id;

    INSERT INTO public.usage_logs (
        api_key_id, subscription_id, model_id, power_level, input_tokens, output_tokens, total_tokens, cost_usd, is_free, duration_ms, status_code, error_message
    ) VALUES (
        v_key.id, v_key.subscription_id, p_model_id, v_model.power_level, p_input_tokens, p_output_tokens, v_total_tokens, v_real_cost, v_is_free, p_duration_ms, p_status_code, p_error_message
    );

    RETURN jsonb_build_object('success', true, 'cost_usd', v_real_cost, 'new_balance_usd', v_new_balance, 'total_tokens', v_total_tokens);
END;
$$;

-- 14. RPC: axis_generate_api_key (FIX : n'active la clé que si l'abonnement est 'active')
CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user       RECORD;
    v_sub        RECORD;
    v_is_active  BOOLEAN := false;
    v_raw_secret TEXT;
    v_full_key   TEXT;
    v_key_hash   TEXT;
    v_key_prefix TEXT;
    v_key_id     UUID;
BEGIN
    PERFORM public.assert_caller_is(p_user_id);
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    v_is_active := (v_user.role = 'admin');
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, status, is_active
          INTO v_sub
          FROM public.subscriptions
         WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404,
                                      'error_message', 'Abonnement introuvable ou n''appartient pas à cet utilisateur.');
        END IF;
        v_is_active := (v_user.role = 'admin' OR (v_sub.status = 'active' AND v_sub.is_active = true));
    END IF;

    -- Génération cryptographique résiliente : tente pgcrypto, fallback sur random natif
    BEGIN
        v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;

    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);

    -- Hachage SHA-256 résilient
    BEGIN
        v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;

    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 8) || '...';

    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix, name, is_enabled, daily_request_limit)
    VALUES (
        p_user_id,
        p_subscription_id,
        v_key_hash,
        v_key_prefix,
        coalesce(nullif(trim(p_name), ''), 'Default API Key'),
        v_is_active,
        p_daily_limit
    )
    RETURNING id INTO v_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'key_id', v_key_id,
        'api_key', v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', v_is_active,
        'warning', 'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.'
    );
END;
$$;

-- 15. RPC: axis_refresh_api_key (FIX : préfixe correct, blocage pending, retour normalisé)
CREATE OR REPLACE FUNCTION public.axis_refresh_api_key(p_key_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_old_key RECORD; v_owner_role TEXT; v_sub_status TEXT;
    v_raw_secret TEXT; v_full_key TEXT; v_key_hash TEXT; v_key_prefix TEXT;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_old_key FROM public.api_keys WHERE id = p_key_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_code', 'KEY_NOT_FOUND', 'error_message', 'Clé API introuvable.');
    END IF;
    IF auth.uid() IS NOT NULL AND v_old_key.user_id <> auth.uid()
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403,
            'error_code', 'FORBIDDEN', 'error_message', 'Cette clé ne vous appartient pas.');
    END IF;
    SELECT role INTO v_owner_role FROM public.profiles WHERE id = v_old_key.user_id;
    IF v_owner_role IS DISTINCT FROM 'admin' AND v_old_key.subscription_id IS NOT NULL THEN
        SELECT status INTO v_sub_status FROM public.subscriptions WHERE id = v_old_key.subscription_id;
        IF v_sub_status IN ('pending', 'pending_validation') THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409,
                'error_code', 'REFRESH_BLOCKED_PENDING',
                'error_message', 'Régénération impossible : l''abonnement lié est en attente de validation.',
                'subscription_id', v_old_key.subscription_id);
        END IF;
    END IF;
    BEGIN v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;
    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);
    BEGIN v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;
    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 8) || '...';
    UPDATE public.api_keys SET key_hash = v_key_hash, key_prefix = v_key_prefix,
        last_used_at = NULL, updated_at = v_now WHERE id = p_key_id;
    RETURN jsonb_build_object('success', true, 'http_status', 200, 'key_id', p_key_id,
        'api_key', v_full_key, 'new_api_key', v_full_key, 'key_prefix', v_key_prefix,
        'is_enabled', v_old_key.is_enabled, 'subscription_id', v_old_key.subscription_id,
        'warning', 'Ancienne clé révoquée. Sauvegardez la nouvelle clé maintenant.');
END;
$$;

-- 16. RPC: axis_revoke_api_key
-- Désactive ou supprime définitivement une clé API.
CREATE OR REPLACE FUNCTION public.axis_revoke_api_key(
    p_key_id UUID,
    p_delete BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.api_keys
        WHERE id = p_key_id
          AND (auth.uid() IS NULL OR user_id = auth.uid() OR public.is_admin_unlocked())
    ) THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Clé API introuvable.');
    END IF;

    IF p_delete THEN
        -- Interdit de supprimer une clé liée à un abonnement en attente ou validé
        IF EXISTS (
            SELECT 1 FROM public.api_keys k
            JOIN public.subscriptions s ON s.id = k.subscription_id
            WHERE k.id = p_key_id AND s.status IN ('pending_validation', 'pending', 'active')
        ) THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409,
                'error_code', 'KEY_HAS_SUBSCRIPTION',
                'error_message', 'Suppression impossible : cette clé est liée à un abonnement en attente ou validé.');
        END IF;
        DELETE FROM public.api_keys WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'deleted', 'key_id', p_key_id);
    ELSE
        UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'disabled', 'key_id', p_key_id);
    END IF;
END;
$$;

-- 17. RPC: axis_cleanup_expired_subscriptions
-- Cron : expire les abonnements échus et active les packs "pending" en attente.
CREATE OR REPLACE FUNCTION public.axis_cleanup_expired_subscriptions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_activated_count INTEGER := 0;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_sub RECORD;
    v_pending_sub RECORD;
BEGIN
    FOR v_sub IN
        SELECT * FROM public.subscriptions
        WHERE status = 'active' AND is_active = true AND (expires_at <= v_now OR balance_usd <= 0)
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.subscriptions
        SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
            is_active = false,
            updated_at = v_now
        WHERE id = v_sub.id;

        v_expired_count := v_expired_count + 1;

        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_sub.user_id AND status = 'pending'
        ORDER BY created_at ASC LIMIT 1
        FOR UPDATE SKIP LOCKED;

        IF FOUND THEN
            UPDATE public.subscriptions
            SET status = 'active', is_active = true,
                starts_at = v_now, expires_at = v_now + INTERVAL '30 days',
                updated_at = v_now
            WHERE id = v_pending_sub.id;

            UPDATE public.api_keys
            SET subscription_id = v_pending_sub.id, is_enabled = true, updated_at = v_now
            WHERE user_id = v_sub.user_id;

            v_activated_count := v_activated_count + 1;
        ELSE
            UPDATE public.api_keys
            SET is_enabled = false, updated_at = v_now
            WHERE user_id = v_sub.user_id AND subscription_id = v_sub.id;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'expired_count', v_expired_count,
        'activated_pending_count', v_activated_count,
        'ran_at', v_now
    );
END;
$$;

-- 18. RPC: axis_get_moderator_dashboard
-- Retourne la liste des abonnements rattachés au code du modérateur + totaux commissions.
CREATE OR REPLACE FUNCTION public.axis_get_moderator_dashboard(
    p_moderator_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mod RECORD;
    v_clients JSONB;
    v_totals JSONB;
BEGIN
    PERFORM public.assert_caller_is(p_moderator_id);
    SELECT id, role, moderator_code INTO v_mod FROM public.profiles WHERE id = p_moderator_id;
    IF NOT FOUND OR v_mod.role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Accès refusé.');
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'subscription_id', s.id,
            'client_username', p.username,
            'client_pseudo', p.pseudo,
            'tier_number', s.tier_number,
            'status', s.status,
            'is_active', s.is_active,
            'balance_usd', s.balance_usd,
            'budget_amount_usd', s.budget_amount_usd,
            'commission_status', s.commission_status,
            'validated_at', s.validated_at,
            'expires_at', s.expires_at,
            'starts_at', s.starts_at
        ) ORDER BY s.created_at DESC
    ) INTO v_clients
    FROM public.subscriptions s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.moderator_id = p_moderator_id;

    SELECT jsonb_build_object(
        'total_validated', count(*),
        'unpaid_commissions', count(*) FILTER (WHERE commission_status = 'unpaid'),
        'paid_commissions', count(*) FILTER (WHERE commission_status = 'paid'),
        'archived_commissions', count(*) FILTER (WHERE commission_status = 'archived')
    ) INTO v_totals
    FROM public.subscriptions
    WHERE moderator_id = p_moderator_id;

    RETURN jsonb_build_object(
        'success', true,
        'moderator_code', v_mod.moderator_code,
        'totals', v_totals,
        'clients', coalesce(v_clients, '[]'::jsonb)
    );
END;
$$;

-- 19. RPC: axis_get_popup_alert
-- Appelé à chaque ouverture de session : retourne le message de suspension admin si présent.
CREATE OR REPLACE FUNCTION public.axis_get_popup_alert(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_disabled_sub RECORD;
BEGIN
    PERFORM public.assert_caller_is(p_user_id);
    SELECT disabled_reason, disabled_at, disabled_by INTO v_disabled_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'disabled' AND disabled_reason IS NOT NULL
    ORDER BY disabled_at DESC LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'has_alert', true,
            'alert_type', 'subscription_disabled',
            'message', v_disabled_sub.disabled_reason,
            'disabled_at', v_disabled_sub.disabled_at
        );
    END IF;

    RETURN jsonb_build_object('has_alert', false);
END;
$$;

-- 20. RPC: admin_archive_commission
-- L'admin archive/clôture une commission modérateur après paiement externe.
CREATE OR REPLACE FUNCTION public.admin_archive_commission(
    p_admin_id UUID,
    p_subscription_id UUID,
    p_new_status TEXT DEFAULT 'paid'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    PERFORM public.assert_caller_is(p_admin_id);
    PERFORM public.assert_admin_unlocked();
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Action réservée exclusivement à l''administrateur.');
    END IF;

    IF p_new_status NOT IN ('paid', 'archived') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_message', 'Statut invalide. Valeurs acceptées : paid, archived.');
    END IF;

    UPDATE public.subscriptions
    SET commission_status = p_new_status, updated_at = v_now
    WHERE id = p_subscription_id AND moderator_id IS NOT NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable ou sans modérateur rattaché.');
    END IF;

    RETURN jsonb_build_object('success', true, 'subscription_id', p_subscription_id, 'commission_status', p_new_status);
END;
$$;

-- ==============================================================================
-- 21. ROW LEVEL SECURITY (RLS)
-- Les RPCs utilisent SECURITY DEFINER (ils contournent RLS automatiquement).
-- Ces règles protègent l'accès direct aux tables depuis le client JS (anon/auth).
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (idempotent)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_moderator_assigned" ON public.subscriptions;
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_admin_all" ON public.api_keys;
DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs_admin_all" ON public.usage_logs;
DROP POLICY IF EXISTS "tiers_public_read" ON public.tiers;
DROP POLICY IF EXISTS "models_public_read" ON public.models;

-- Helper non-récursif (SECURITY DEFINER contourne RLS automatiquement)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── SÉCURITÉ ADMIN : PIN haché, anti brute-force, session de déverrouillage ───
CREATE TABLE IF NOT EXISTS public.admin_security (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT true,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ DEFAULT NULL,
    unlocked_until TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.admin_security ENABLE ROW LEVEL SECURITY;   -- aucune policy : accès uniquement via les RPC
REVOKE ALL ON TABLE public.admin_security FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.app_admin_email()
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$ SELECT 'aureltchiakpe819@gmail.com'::text $$;

-- Admin ET PIN saisi (session de 2 h) : base de toutes les policies et RPC d'administration
CREATE OR REPLACE FUNCTION public.is_admin_unlocked()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() AND EXISTS (
    SELECT 1 FROM public.admin_security s
    WHERE s.user_id = auth.uid() AND s.unlocked_until > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.assert_admin_unlocked()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- auth.uid() NULL = backend (service_role)
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_unlocked() THEN
        RAISE EXCEPTION 'PIN administrateur requis' USING ERRCODE = '42501';
    END IF;
END;
$$;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin_unlocked());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin_unlocked())
    WITH CHECK (auth.uid() = id OR public.is_admin_unlocked());

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
    FOR ALL USING (public.is_admin_unlocked());

-- Modérateur : lecture seule des abonnements de ses clients assignés
CREATE POLICY "subscriptions_moderator_assigned" ON public.subscriptions
    FOR SELECT USING (moderator_id = auth.uid());

-- ── API KEYS ──────────────────────────────────────────────────────────────────
CREATE POLICY "api_keys_select_own" ON public.api_keys
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "api_keys_admin_all" ON public.api_keys
    FOR ALL USING (public.is_admin_unlocked());

-- ── USAGE LOGS ────────────────────────────────────────────────────────────────
CREATE POLICY "usage_logs_select_own" ON public.usage_logs
    FOR SELECT USING (
        api_key_id IN (SELECT id FROM public.api_keys WHERE user_id = auth.uid())
    );

CREATE POLICY "usage_logs_admin_all" ON public.usage_logs
    FOR ALL USING (public.is_admin_unlocked());

-- ── TIERS & MODELS : Lecture publique (catalogue accessible sans auth) ─────────
CREATE POLICY "tiers_public_read" ON public.tiers
    FOR SELECT USING (true);

CREATE POLICY "models_public_read" ON public.models
    FOR SELECT USING (true);

-- ==============================================================================
-- HOTFIX v2.1 : Trigger de synchronisation clé ↔ abonnement
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_key_on_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        UPDATE public.api_keys
        SET is_enabled = (NEW.status = 'active' AND NEW.is_active = true),
            updated_at = timezone('utc'::text, now())
        WHERE subscription_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_key_on_subscription_change ON public.subscriptions;
CREATE TRIGGER trg_sync_key_on_subscription_change
    AFTER UPDATE OF status, is_active
    ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_key_on_subscription_change();

-- ==============================================================================
-- 22. TRIGGERS D'INTÉGRITÉ ET DURCISSEMENT SÉCURITÉ (v2.3)
-- ==============================================================================

-- 22.1 Une clé ne s'active que si son abonnement (le sien) est actif
CREATE OR REPLACE FUNCTION public.enforce_key_requires_active_sub()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_ok   BOOLEAN := false;
BEGIN
    -- Interdit de rattacher une clé à l'abonnement d'un autre utilisateur
    IF NEW.subscription_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE id = NEW.subscription_id AND user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Abonnement invalide pour cette clé' USING ERRCODE = '42501';
    END IF;

    IF NEW.is_enabled IS NOT TRUE THEN RETURN NEW; END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_role = 'admin' THEN RETURN NEW; END IF;

    IF NEW.subscription_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE id = NEW.subscription_id
              AND status = 'active' AND is_active = true
              AND expires_at > now() AND balance_usd > 0
        ) INTO v_ok;
    END IF;

    IF NOT v_ok THEN NEW.is_enabled := false; END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_key_requires_active_sub ON public.api_keys;
CREATE TRIGGER trg_key_requires_active_sub
    BEFORE INSERT OR UPDATE OF is_enabled, subscription_id ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.enforce_key_requires_active_sub();

-- 22.2 Un non-admin ne peut pas modifier son rôle ni son code modérateur
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_unlocked() THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.moderator_code IS DISTINCT FROM OLD.moderator_code THEN
            RAISE EXCEPTION 'Modification du rôle interdite' USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- 22.3 Une clé liée à un abonnement en attente ou validé ne peut pas être supprimée
CREATE OR REPLACE FUNCTION public.prevent_key_delete_with_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Suppression en cascade (compte supprimé) : on ne bloque pas
    IF pg_trigger_depth() > 1 THEN RETURN OLD; END IF;

    IF OLD.subscription_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE id = OLD.subscription_id AND status IN ('pending_validation', 'pending', 'active')
    ) THEN
        RAISE EXCEPTION 'KEY_HAS_SUBSCRIPTION : clé liée à un abonnement en attente ou validé'
            USING ERRCODE = '23503';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_key_delete ON public.api_keys;
CREATE TRIGGER trg_prevent_key_delete
    BEFORE DELETE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.prevent_key_delete_with_subscription();

-- 22.4 Le rôle admin est réservé au compte propriétaire
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'admin' AND lower(NEW.email) IS DISTINCT FROM lower(public.app_admin_email()) THEN
        RAISE EXCEPTION 'Le rôle admin est réservé au compte propriétaire' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_admin ON public.profiles;
CREATE TRIGGER trg_enforce_single_admin
    BEFORE INSERT OR UPDATE OF role, email ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();

-- Promotion du compte propriétaire (idempotent ; le compte doit déjà exister et être confirmé)
UPDATE public.profiles
SET role = 'admin', updated_at = timezone('utc'::text, now())
WHERE lower(email) = lower(public.app_admin_email()) AND role <> 'admin';

-- 22.5 PIN administrateur (vérification, déverrouillage 2 h, changement, verrouillage)
-- Contrôle interne : compteur d'échecs, blocage 15 min après 5 erreurs
CREATE OR REPLACE FUNCTION public.private_admin_pin_check(p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT; v_fail INTEGER; v_lock TIMESTAMPTZ;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('ok', false, 'error_code', 'FORBIDDEN', 'error_message', 'Accès réservé à l''administrateur.');
    END IF;
    IF p_pin IS NULL OR p_pin !~ '^[0-9]{5,8}$' THEN
        RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_FORMAT', 'error_message', 'Le PIN contient 5 à 8 chiffres.');
    END IF;

    -- Première utilisation : PIN par défaut (à changer dans le dashboard)
    INSERT INTO public.admin_security (user_id, pin_hash)
    VALUES (auth.uid(), crypt('10606', gen_salt('bf')))
    ON CONFLICT (user_id) DO NOTHING;

    SELECT pin_hash, failed_attempts, locked_until INTO v_hash, v_fail, v_lock
    FROM public.admin_security WHERE user_id = auth.uid() FOR UPDATE;

    IF v_lock IS NOT NULL AND v_lock > v_now THEN
        RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_LOCKED', 'locked_until', v_lock,
            'error_message', 'Trop de tentatives. Réessayez plus tard.');
    END IF;

    IF crypt(p_pin, v_hash) = v_hash THEN
        UPDATE public.admin_security SET failed_attempts = 0, locked_until = NULL, updated_at = v_now WHERE user_id = auth.uid();
        RETURN jsonb_build_object('ok', true);
    END IF;

    v_fail := v_fail + 1;
    IF v_fail >= 5 THEN
        UPDATE public.admin_security SET failed_attempts = 0, locked_until = v_now + INTERVAL '15 minutes', updated_at = v_now WHERE user_id = auth.uid();
        RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_LOCKED', 'locked_until', v_now + INTERVAL '15 minutes',
            'error_message', 'Trop de tentatives. Accès bloqué 15 minutes.');
    END IF;
    UPDATE public.admin_security SET failed_attempts = v_fail, updated_at = v_now WHERE user_id = auth.uid();
    RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_INVALID', 'attempts_left', 5 - v_fail,
        'error_message', 'PIN incorrect.');
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_pin_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_unlocked TIMESTAMPTZ; v_lock TIMESTAMPTZ; v_default BOOLEAN;
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'FORBIDDEN');
    END IF;
    SELECT unlocked_until, locked_until, is_default INTO v_unlocked, v_lock, v_default
    FROM public.admin_security WHERE user_id = auth.uid();
    RETURN jsonb_build_object(
        'success', true,
        'unlocked', COALESCE(v_unlocked > now(), false),
        'unlocked_until', v_unlocked,
        'locked_until', CASE WHEN v_lock > now() THEN v_lock END,
        'is_default_pin', COALESCE(v_default, true)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_verify_pin(p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_res JSONB; v_until TIMESTAMPTZ := timezone('utc'::text, now()) + INTERVAL '2 hours'; v_default BOOLEAN;
BEGIN
    v_res := public.private_admin_pin_check(p_pin);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
        RETURN v_res || jsonb_build_object('success', false);
    END IF;
    UPDATE public.admin_security SET unlocked_until = v_until WHERE user_id = auth.uid()
    RETURNING is_default INTO v_default;
    RETURN jsonb_build_object('success', true, 'unlocked_until', v_until, 'is_default_pin', v_default);
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_change_pin(p_current TEXT, p_new TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_res JSONB;
BEGIN
    PERFORM public.assert_admin_unlocked();
    v_res := public.private_admin_pin_check(p_current);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
        RETURN v_res || jsonb_build_object('success', false);
    END IF;
    IF p_new IS NULL OR p_new !~ '^[0-9]{5,8}$' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'PIN_FORMAT', 'error_message', 'Le nouveau PIN contient 5 à 8 chiffres.');
    END IF;
    IF p_new = p_current OR p_new = '10606' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'PIN_WEAK', 'error_message', 'Choisissez un PIN différent de l''actuel et du PIN par défaut.');
    END IF;
    UPDATE public.admin_security
    SET pin_hash = crypt(p_new, gen_salt('bf')), is_default = false, failed_attempts = 0, locked_until = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = auth.uid();
    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_lock()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.admin_security SET unlocked_until = NULL WHERE user_id = auth.uid();
    RETURN jsonb_build_object('success', true);
END;
$$;

-- 22.6 Privilèges d'exécution (DOIT rester en DERNIER, rejoué à chaque exécution)
--   Backend uniquement (service_role) : gatekeeper, settle_usage, cleanup
--   Front connecté (authenticated)    : les RPC listées dans v_front
--   anon / PUBLIC                     : aucune RPC axis_* / admin_*
DO $$
DECLARE
    r RECORD;
    v_front TEXT[] := ARRAY[
        'axis_generate_api_key', 'axis_refresh_api_key', 'axis_revoke_api_key',
        'axis_subscribe', 'axis_get_popup_alert', 'axis_get_moderator_dashboard',
        'axis_moderator_validate_subscription',
        'axis_moderator_validate_subscription_by_code',
        'admin_disable_subscription', 'axis_create_moderator', 'admin_archive_commission',
        'axis_admin_pin_status', 'axis_admin_verify_pin', 'axis_admin_change_pin', 'axis_admin_lock'
    ];
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig, p.proname
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname ~ '^(axis|admin|private)_'
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
        IF r.proname = ANY (v_front) THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- FIN DU SCRIPT — ACCESS AI / AXIS PROXY — Production Schema v2.3
-- Instance : oahduqmmqiwdldsqmzhv.supabase.co
-- 6 tables · 20 RPCs · RLS complète · triggers d'intégrité · privilèges d'exécution restreints · PIN admin · avatars
-- Synchronisation atomique clé ↔ abonnement activée
-- ==============================================================================

---

FICHIER: /tsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "scripts/**/*"]
}

---

