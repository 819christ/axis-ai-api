import { NavLink } from 'react-router-dom';
import { Home, Key, CreditCard, Settings, Shield, UserCog, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AxisLogo } from './AxisLogo';

export const Sidebar = () => {
  const { profile, signOut } = useAuth();
  
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Accueil' },
    { to: '/dashboard/keys', icon: Key, label: 'Clés API' },
    { to: '/dashboard/subscriptions', icon: CreditCard, label: 'Abonnements' },
    { to: '/dashboard/settings', icon: Settings, label: 'Paramètres' }
  ];

  if (profile?.role === 'moderator' || profile?.role === 'admin') {
    navItems.push({ to: '/dashboard/moderator', icon: Shield, label: 'Modération' });
  }
  if (profile?.role === 'admin') {
    navItems.push({ to: '/dashboard/admin', icon: UserCog, label: 'Administration' });
  }

  return (
    <div style={{
      width: 280,
      background: 'var(--axis-sidebar)',
      borderRight: '1px solid var(--axis-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingLeft: 12 }}>
        <AxisLogo />
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--axis-text)' }}>Axis AI</span>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 10, textDecoration: 'none',
              background: isActive ? 'var(--axis-hover)' : 'transparent',
              color: isActive ? '#fff' : 'var(--axis-textMuted)',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s'
            })}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ paddingTop: 20, borderTop: '1px solid var(--axis-border)' }}>
        <button onClick={signOut} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          width: '100%', color: 'var(--axis-danger)', fontWeight: 500
        }}>
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </div>
  );
};
