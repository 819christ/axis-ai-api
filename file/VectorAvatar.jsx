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
