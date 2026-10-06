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
