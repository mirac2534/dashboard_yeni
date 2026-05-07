import {
  AlertTriangle,
  CircleHelp,
  CloudOff,
  Gauge,
  LockKeyhole,
  Menu,
  UserRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.png';

const navItems = [
  { to: '/normal-operation', label: 'Problemsiz Operasyon', icon: Gauge },
  { to: '/offline-operation', label: 'İnternet Bağlantısı Olmadığı Operasyon', icon: CloudOff },
  { to: '/emergency-operation', label: 'Acil Durumlar Operasyonu', icon: AlertTriangle },
  { to: '/zk-snark', label: 'zk-SNARK Gösterimi', icon: LockKeyhole },
  { to: '/profile', label: 'Profil', icon: UserRound },
  { to: '/help', label: 'Yardım ve Sıkça Sorulan Sorular', icon: CircleHelp },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onCollapse, onExpand, onToggle }: SidebarProps) {
  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
      onMouseEnter={onExpand}
      onMouseLeave={onCollapse}
    >
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <img src={logo} alt="Synapse" />
        </span>
        {!collapsed ? <strong>Synapse</strong> : null}
      </div>
      <div className="sidebar__menu-toggle">
        <button aria-label="Menüyü aç/kapat" onClick={onToggle} type="button">
          <Menu size={20} />
        </button>
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} title={item.label}>
              <Icon size={20} />
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
