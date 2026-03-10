import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ParishesTable } from './components/ParishesTable';
import { OnboardingModal } from './components/OnboardingModal';
import { SystemHealth } from './components/SystemHealth';
import { MatrizDashboard } from './components/MatrizDashboard';
import { ClergyManager } from './components/ClergyManager';
import { StaffDirectory } from './components/StaffDirectory';
import { LocalTriagem } from './components/LocalTriagem';
import { FielHome } from './components/FielHome';
import { SacramentRegistry } from './components/Sacramenta/SacramentRegistry';
import type { SacramentType } from './components/Sacramenta/SacramentRegistry';
import { PeopleDirectory } from './components/Pastoralis/PeopleDirectory';
import { Login } from './components/Login';
import { Breadcrumbs } from './components/Breadcrumbs';
import { ReportsPanel } from './components/ReportsPanel';
import { GlobalPastoralMap } from './components/Governance/GlobalPastoralMap';
import { AppointmentWizard } from './components/AppointmentWizard';
import { PriestAgenda } from './components/PriestAgenda';
import { useDashboardKPIs } from './hooks/useDashboardKPIs';
import {
  Plus,
  Bell,
  LogOut,
  TrendingUp,
  Activity,
  ShieldCheck,
  Landmark,
  Home,
  Heart,
  ChevronDown
} from 'lucide-react';
import { useTenant } from './contexts/TenantContext';
import { useAuth } from './contexts/AuthContext';
import './App.css';

type Level = 'super' | 'matriz' | 'comunidade' | 'fiel';

const levelsByRole: Record<string, Level[]> = {
  super_admin: ['super', 'matriz', 'comunidade', 'fiel'],
  matriz_admin: ['matriz', 'comunidade', 'fiel'],
  comunidade_lead: ['comunidade', 'fiel'],
  fiel: ['fiel'],
};

const defaultLevelForRole: Record<string, Level> = {
  super_admin: 'super',
  matriz_admin: 'matriz',
  comunidade_lead: 'comunidade',
  fiel: 'fiel',
};

const levelLabels: Record<Level, string> = {
  super: 'Visão Super Admin',
  matriz: 'Visão Paróquia',
  comunidade: 'Visão Comunidade',
  fiel: 'Visão Fiel',
};

function App() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const { user, profile, isLoading: isAuthLoading, signOut } = useAuth();

  const userRole = profile?.role || 'fiel';
  const allowedLevels = levelsByRole[userRole] || ['fiel'];
  const defaultLevel = defaultLevelForRole[userRole] || 'fiel';

  const [currentLevel, setCurrentLevel] = useState<Level>(defaultLevel);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [refreshTrigger] = useState(0);
  const [sacramentView, setSacramentView] = useState<SacramentType>('baptism');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Update currentLevel when profile loads and current level isn't allowed
  useEffect(() => {
    if (profile?.role && !allowedLevels.includes(currentLevel)) {
      setCurrentLevel(defaultLevel);
    } else if (profile?.role && currentLevel === 'fiel' && defaultLevel !== 'fiel') {
      // First load: profile just arrived, upgrade from default 'fiel'
      setCurrentLevel(defaultLevel);
    }
  }, [profile?.role]);

  const { kpis: dynamicKpis } = useDashboardKPIs({
    level: currentLevel,
    tenantId: activeTenant?.id,
    subTenantId: undefined,
  });

  const renderDashboard = () => {
    switch (currentLevel) {
      case 'super':
        return (
          <>
            <section className="dashboard-grid">
              <StatCard label="Paróquias Ativas" value="12" trend="+2 este mês" />
              <StatCard label="Total de Fiéis" value="4.2k" trend="12% crescimento" />
              <StatCard label="Sacramentos (Hoje)" value="28" trend="Normal" />
              <StatCard label="Uptime Global" value="99.9%" trend="Estável" />
            </section>
            <div className="dashboard-sections">
              {activeTab === 'home' && (
                <>
                  <SystemHealth />
                  <ParishesTable refreshTrigger={refreshTrigger} />
                </>
              )}
              {activeTab === 'priest-agenda' && (
                <PriestAgenda />
              )}
              {activeTab === 'global-map' && (
                <GlobalPastoralMap />
              )}
              {activeTab === 'missio' && (
                <MatrizDashboard />
              )}
              {activeTab === 'sacramenta' && activeTenant && (
                <div className="sacramenta-container">
                  <div className="sub-nav glass" style={{ marginBottom: '20px', padding: '8px', display: 'flex', gap: '6px', borderRadius: '12px', flexWrap: 'wrap' }}>
                    {([
                      ['baptism', 'Batismos'],
                      ['first_communion', '1ª Eucaristia'],
                      ['confirmation', 'Crisma'],
                      ['marriage', 'Matrimônios'],
                      ['anointing_of_sick', 'Unção Enfermos'],
                    ] as [SacramentType, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        className={`btn-secondary ${sacramentView === key ? 'active-tab' : ''}`}
                        onClick={() => setSacramentView(key)}
                        style={{ flex: 1, minWidth: '100px', color: sacramentView === key ? 'var(--accent-color)' : 'inherit', fontSize: '0.8rem', padding: '8px 6px' }}
                      >{label}</button>
                    ))}
                  </div>
                  <SacramentRegistry tenantId={activeTenant.id} type={sacramentView} />
                </div>
              )}
              {activeTab === 'pastoralis' && activeTenant && (
                <PeopleDirectory tenantId={activeTenant.id} />
              )}
              {activeTab === 'reports' && activeTenant && (
                <ReportsPanel tenantId={activeTenant.id} />
              )}
            </div>
          </>
        );
      case 'matriz':
        return (
          <>
            <section className="dashboard-grid">
              <StatCard label="Comunidades" value="8" trend="2 capelas" />
              <StatCard label="Clero Ativo" value="3" trend="Pe/Diac" />
              <StatCard label="Missio (Pendente)" value="14" trend="7 urgentes" />
              <StatCard label="Sacramenta" value="156" trend="Total Ano" />
            </section>
            <div className="dashboard-sections">
              {activeTab === 'home' && (
                <>
                  <MatrizDashboard />
                  <ClergyManager />
                  <StaffDirectory />
                </>
              )}
              {activeTab === 'priest-agenda' && <PriestAgenda />}
              {activeTab === 'missio' && <MatrizDashboard />}
              {activeTab === 'sacramenta' && activeTenant && (
                <div className="sacramenta-container">
                  <div className="sub-nav glass" style={{ marginBottom: '20px', padding: '8px', display: 'flex', gap: '6px', borderRadius: '12px', flexWrap: 'wrap' }}>
                    {([
                      ['baptism', 'Batismos'],
                      ['first_communion', '1ª Eucaristia'],
                      ['confirmation', 'Crisma'],
                      ['marriage', 'Matrimônios'],
                      ['anointing_of_sick', 'Unção Enfermos'],
                    ] as [SacramentType, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        className={`btn-secondary ${sacramentView === key ? 'active-tab' : ''}`}
                        onClick={() => setSacramentView(key)}
                        style={{ flex: 1, minWidth: '100px', color: sacramentView === key ? 'var(--accent-color)' : 'inherit', fontSize: '0.8rem', padding: '8px 6px' }}
                      >{label}</button>
                    ))}
                  </div>
                  <SacramentRegistry tenantId={activeTenant.id} type={sacramentView} />
                </div>
              )}
              {activeTab === 'pastoralis' && activeTenant && (
                <PeopleDirectory tenantId={activeTenant.id} />
              )}
              {activeTab === 'reports' && activeTenant && (
                <ReportsPanel tenantId={activeTenant.id} />
              )}
            </div>
          </>
        );
      case 'comunidade':
        return (
          <>
            <section className="dashboard-grid">
              <StatCard label="Triagem Missio" value="3" trend="Urgente" />
              <StatCard label="Bençãos (Hoje)" value="2" trend="Pendentes" />
              <StatCard label="Direção Espiritual" value="1" trend="Pe. João" />
              <StatCard label="Cestas Básicas" value="45" trend="Próxima entrega" />
            </section>
            <LocalTriagem />
          </>
        );
      case 'fiel':
        return <FielHome />;
    }
  };

  if (isAuthLoading || isTenantLoading) {
    return <div className="loading-state">Iniciando IGNIS...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className={`app-container level-${currentLevel}`}>
      {user && (
        <>
          <button
            className="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
          <Sidebar
            activeTab={activeTab}
            onTabChange={(id) => { setActiveTab(id); setIsSidebarOpen(false); }}
            userLevel={profile?.role === 'super_admin' ? 'super' : currentLevel}
            isOpen={isSidebarOpen}
          />
        </>
      )}

      <main className="main-content">
        <header className="main-header">
          <div className="header-top">
            <div className="header-left">
              <div className="tenant-selector">
                <div className="active-tenant-badge">
                  <Landmark size={14} />
                  <span>{activeTenant?.name || 'IGNIS Global'}</span>
                  {currentLevel !== 'super' && <ChevronDown size={14} className="ml-2 opacity-50" />}
                </div>
              </div>

              <div className="header-actions-group">
                <div className="level-badge">
                  {currentLevel === 'super' && <ShieldCheck size={14} />}
                  {currentLevel === 'matriz' && <Landmark size={14} />}
                  {currentLevel === 'comunidade' && <Home size={14} />}
                  {currentLevel === 'fiel' && <Heart size={14} />}
                  <span>
                    {currentLevel === 'super' && 'Super Admin'}
                    {currentLevel === 'matriz' && 'Nível 1: Matriz'}
                    {currentLevel === 'comunidade' && 'Nível 2: Comunidade'}
                    {currentLevel === 'fiel' && 'Nível 3: O Fiel'}
                  </span>
                </div>

                <div className="level-switcher">
                  <select
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value as Level)}
                  >
                    {allowedLevels.map((level) => (
                      <option key={level} value={level}>{levelLabels[level]}</option>
                    ))}
                  </select>
                </div>

                <button className="btn-icon"><Bell size={18} /></button>
                <button
                  className="btn-icon"
                  onClick={() => signOut()}
                  title="Sair do Sistema"
                  style={{ marginLeft: '1rem', color: '#ef4444' }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="header-bottom">
            <div>
              <Breadcrumbs level={currentLevel} />
              <h1 className="page-title">
                {currentLevel === 'super' && 'Dashboard de Infraestrutura'}
                {currentLevel === 'matriz' && 'Gestão Cenáculo'}
                {currentLevel === 'comunidade' && 'Missão Local'}
                {currentLevel === 'fiel' && 'Minha Chama'}
              </h1>
              <p className="page-subtitle">
                {currentLevel === 'super' && 'Pulso global do ecossistema IGNIS.'}
                {currentLevel === 'matriz' && 'Coordenação das comunidades e clero.'}
                {currentLevel === 'comunidade' && 'Operação e triagem pastoral local.'}
                {currentLevel === 'fiel' && 'Seu histórico e conexão com a Igreja.'}
              </p>
            </div>

            {currentLevel === 'super' && (
              <button className="btn-primary-action" onClick={() => setIsOnboardingOpen(true)}>
                <Plus size={18} />
                <span>Novo Onboarding</span>
              </button>
            )}

          </div>
        </header>

        {renderDashboard()}

        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />

        <AppointmentWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          tenantId={activeTenant?.id}
        />
      </main>
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-trend trend-up">
        {trend.includes('mês') || trend.includes('%') ? <TrendingUp size={14} /> : <Activity size={14} />}
        <span>{trend}</span>
      </div>
    </div>
  );
}

export default App;
