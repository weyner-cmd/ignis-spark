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
  Shield,
} from 'lucide-react';
import './Sidebar.css';

import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'VISÃO GERAL',
    items: [
      { icon: Home, label: 'Início', id: 'home' },
      { icon: Globe, label: 'Mapa Global', id: 'global-map' },
    ],
  },
  {
    title: 'GESTÃO PAROQUIAL',
    items: [
      { icon: Calendar, label: 'Agenda do Padre', id: 'priest-agenda' },
      { icon: FileBarChart, label: 'Relatórios', id: 'reports' },
      { icon: Shield, label: 'Estratégia Pastoral', id: 'governance-local' },
    ],
  },
  {
    title: 'MÓDULOS IGNIS',
    items: [
      { icon: ScrollText, label: 'Sacramenta', id: 'sacramenta' },
      { icon: Users, label: 'Pastoralis', id: 'pastoralis' },
      { icon: MapPin, label: 'Missio', id: 'missio' },
      { icon: Heart, label: 'Communio', id: 'communio' },
      { icon: Wallet, label: 'Administratio', id: 'administratio' },
    ],
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [
      { icon: UserCog, label: 'Gestão de Usuários', id: 'users' },
      { icon: Settings, label: 'Configurações', id: 'settings' },
    ],
  },
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

  const moduleItems = ['sacramenta', 'pastoralis', 'missio', 'communio', 'administratio'];

  const isItemVisible = (itemId: string): boolean => {
    if (itemId === 'home') return true;
    if (itemId === 'priest-agenda') return userLevel === 'matriz';
    if (itemId === 'global-map') return userLevel === 'super';
    if (itemId === 'users') return userLevel === 'super' || userLevel === 'matriz';
    if (itemId === 'settings') return userLevel === 'super';
    if (itemId === 'reports') return userLevel === 'super' || userLevel === 'matriz';
    if (itemId === 'governance-local') return userLevel === 'matriz';
    if (moduleItems.includes(itemId)) {
      return activeTenant?.active_modules?.includes(itemId) ?? false;
    }
    return true;
  };

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
      <p className="sidebar-slogan">Onde o Espírito Santo age, a Igreja se move.</p>

      <nav className="nav-section">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => isItemVisible(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="nav-group">
              <span className="nav-group-title">{group.title}</span>
              <ul className="nav-list">
                {visibleItems.map((item) => (
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
            </div>
          );
        })}
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

        <div className="user-profile" onClick={onProfileClick} style={{ cursor: onProfileClick ? 'pointer' : 'default' }}>
          {(profile as any)?.avatar_url ? (
            <img src={(profile as any).avatar_url} alt={displayName} className="avatar avatar-img" />
          ) : (
            <div className="avatar">{avatarLetter}</div>
          )}
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{displayRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
