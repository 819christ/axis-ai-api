import { NavLink } from 'react-router-dom';
import { Home, Key, CreditCard, Settings, Shield, UserCog, LogOut, Layers } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AxisLogo } from './AxisLogo';

export const Sidebar = () => {
  const { profile, signOut } = useAuth();

  const navItems = [
    { to: '/dashboard',                icon: Home,       label: 'Accueil' },
    { to: '/dashboard/keys',           icon: Key,        label: 'Clés API' },
    { to: '/dashboard/history',        icon: Layers,     label: 'Mes abonnements' },
    { to: '/dashboard/subscriptions',  icon: CreditCard, label: 'Paliers & Tarifs' },
    { to: '/dashboard/settings',       icon: Settings,   label: 'Paramètres' },
  ];

  if (profile?.role === 'moderator' || profile?.role === 'admin') {
    navItems.push({ to: '/dashboard/moderator', icon: Shield, label: 'Modération' });
  }
  if (profile?.role === 'admin') {
    navItems.push({ to: '/dashboard/admin', icon: UserCog, label: 'Administration' });
  }

  return (
    <div style={{
      width: 260,
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

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              borderRadius: 10, textDecoration: 'none',
              background: isActive ? 'var(--axis-hover)' : 'transparent',
              color: isActive ? '#fff' : 'var(--axis-textMuted)',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              transition: 'all 0.15s ease',
            })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User profile + Logout */}
      <div style={{ paddingTop: 16, borderTop: '1px solid var(--axis-border)' }}>
        {profile && (
          <div style={{ padding: '10px 14px', marginBottom: 8, borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-text)' }}>{profile.pseudo || profile.username}</div>
            <div style={{ fontSize: 11, color: 'var(--axis-muted)', marginTop: 1 }}>{profile.email}</div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${profile.role === 'admin' ? 'badge-purple' : profile.role === 'moderator' ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: 10 }}>
                {profile.role}
              </span>
            </div>
          </div>
        )}
        <button onClick={signOut} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
          width: '100%', color: 'var(--axis-danger)', fontWeight: 500, fontSize: 14, borderRadius: 10,
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  );
};
