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
