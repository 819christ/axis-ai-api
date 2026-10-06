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
