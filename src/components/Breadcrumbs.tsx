import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

interface BreadcrumbItem {
    label: string;
    icon?: React.ReactNode;
    tabId?: string;
}

interface BreadcrumbsProps {
    level: 'super' | 'matriz' | 'comunidade' | 'fiel';
    activeTab?: string;
    onNavigate?: (tabId: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ level, activeTab, onNavigate }) => {
    const getItems = (): BreadcrumbItem[] => {
        const base: BreadcrumbItem[] = [{ label: 'IGNIS', icon: <Home size={14} />, tabId: 'home' }];

        // Tab-specific breadcrumbs
        const tabLabels: Record<string, string> = {
            home: '',
            'priest-agenda': 'Agenda do Padre',
            sacramenta: 'Sacramenta',
            missio: 'Missio',
            pastoralis: 'Pastoralis',
            communio: 'Communio',
            administratio: 'Administratio',
            reports: 'Relatórios',
            'global-map': 'Mapa Global',
            settings: 'Configurações',
            users: 'Gestão de Usuários',
        };

        switch (level) {
            case 'super':
                base.push({ label: 'Administração' });
                break;
            case 'matriz':
                base.push({ label: 'Paróquia', tabId: 'home' });
                break;
            case 'comunidade':
                base.push({ label: 'Comunidade', tabId: 'home' });
                break;
            case 'fiel':
                base.push({ label: 'Minha Chama' });
                break;
        }

        if (activeTab && activeTab !== 'home' && tabLabels[activeTab]) {
            base.push({ label: tabLabels[activeTab] });
        } else {
            // Default last item per level
            const defaults: Record<string, string> = {
                super: 'Visão Global',
                matriz: 'Gestão Cenáculo',
                comunidade: 'Missão Local',
                fiel: '',
            };
            if (defaults[level]) base.push({ label: defaults[level] });
        }

        return base;
    };

    const items = getItems();

    return (
        <nav className="breadcrumbs">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isClickable = !isLast && item.tabId && onNavigate;

                return (
                    <React.Fragment key={index}>
                        <div
                            className={`breadcrumb-item ${isClickable ? 'breadcrumb-clickable' : ''}`}
                            onClick={() => isClickable && onNavigate!(item.tabId!)}
                            role={isClickable ? 'button' : undefined}
                            tabIndex={isClickable ? 0 : undefined}
                        >
                            {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                            <span className="breadcrumb-label">{item.label}</span>
                        </div>
                        {!isLast && (
                            <ChevronRight size={12} className="breadcrumb-separator" />
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
