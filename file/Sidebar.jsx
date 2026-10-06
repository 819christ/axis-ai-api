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
