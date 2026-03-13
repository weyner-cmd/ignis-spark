import React from 'react';
import {
  Home,
  Calendar,
  ScrollText,
  MapPin,
  Users,
  Heart,
  Wallet,
  Settings,
  Flame,
  FileBarChart,
  Globe,
  Sun,
  Moon,
  UserCog,
} from 'lucide-react';
import './Sidebar.css';

import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { icon: Home, label: 'Início', id: 'home' },
  { icon: Calendar, label: 'Agenda do Padre', id: 'priest-agenda' },
  { icon: ScrollText, label: 'Sacramenta', id: 'sacramenta' },
  { icon: MapPin, label: 'Missio', id: 'missio' },
  { icon: Users, label: 'Pastoralis', id: 'pastoralis' },
  { icon: Heart, label: 'Communio', id: 'communio' },
  { icon: Wallet, label: 'Administratio', id: 'administratio' },
  { icon: FileBarChart, label: 'Relatórios', id: 'reports' },
  { icon: Globe, label: 'Mapa Global', id: 'global-map' },
  { icon: UserCog, label: 'Usuários', id: 'users' },
  { icon: Settings, label: 'Configurações', id: 'settings' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userLevel?: string;
  isOpen?: boolean;
  onProfileClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userLevel, isOpen, onProfileClick }) => {
  const { activeTenant } = useTenant();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'home') return true;
    // B8: Agenda do Padre only for matriz level
    if (item.id === 'priest-agenda') return userLevel === 'matriz';
    if (item.id === 'global-map') return userLevel === 'super';
    // B5: Users tab for super_admin and matriz_admin
    if (item.id === 'users') return userLevel === 'super' || userLevel === 'matriz';
    if (item.id === 'settings') return userLevel === 'super';
    // B9: Reports always visible for super and matriz
    if (item.id === 'reports') return userLevel === 'super' || userLevel === 'matriz' || (activeTenant?.active_modules?.includes(item.id) ?? false);
    if (!activeTenant?.active_modules) return true;
    return activeTenant.active_modules.includes(item.id);
  });

  const displayName = profile?.full_name || 'Usuário';
  const displayRole = profile?.role === 'super_admin' ? 'Super Admin'
    : profile?.role === 'matriz_admin' ? 'Admin Paróquia'
    : profile?.role === 'comunidade_lead' ? 'Líder Comunidade'
    : 'Fiel';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">
          <Flame size={20} fill="currentColor" />
        </div>
        <span className="logo-text">IGNIS</span>
      </div>

      <nav className="nav-section">
        <ul className="nav-list">
          {filteredNavItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onTabChange(item.id);
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="nav-list" style={{ marginBottom: '16px' }}>
          <button
            className="nav-item theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar">{avatarLetter}</div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{displayRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
