import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/stanford-town', label: 'Town Map', emoji: '🗺️' },
  { path: '/stanford-town/dashboard', label: 'Dashboard', emoji: '📋' },
  { path: '/stanford-town/agents', label: 'Agents', emoji: '👥' },
  { path: '/stanford-town/analytics', label: 'Analytics', emoji: '📊' },
];

export default function Navigation() {
  const location = useLocation();
  return (
    <nav style={{
      display: 'flex', gap: '6px', padding: '6px 16px',
      backgroundColor: '#181425', borderBottom: '2px solid #3A4466',
      position: 'relative', zIndex: 20,
      justifyContent: 'center',
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              padding: '6px 16px', borderRadius: '6px', textDecoration: 'none',
              fontSize: '14px', fontWeight: isActive ? 'bold' : 'normal',
              backgroundColor: isActive ? '#1d4ed8' : 'transparent',
              color: isActive ? 'white' : '#8B9BB4',
              transition: 'all 0.2s',
            }}
          >
            {item.emoji} {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
