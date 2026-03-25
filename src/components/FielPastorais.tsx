import { useState, useEffect } from 'react';
import { Users, Calendar, ChevronRight, ChevronDown, Plus, Crown, Shield, Wallet, User } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './FielPastorais.css';

interface PastoralGroup {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
}

interface PastoralMember {
  id: string;
  person_name: string;
  person_id: string | null;
  role: string;
}

interface PastoralEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; order: number }> = {
  coordenador: { label: 'Coordenador(a)', icon: Crown, order: 0 },
  vice_coordenador: { label: 'Vice-Coordenador(a)', icon: Shield, order: 1 },
  tesoureiro: { label: 'Tesoureiro(a)', icon: Wallet, order: 2 },
  secretario: { label: 'Secretário(a)', icon: User, order: 3 },
  membro: { label: 'Membro', icon: User, order: 4 },
};

export const FielPastorais: React.FC = () => {
  const { user } = useAuth();
  const { activeTenant } = useTenant();
  const [myGroups, setMyGroups] = useState<PastoralGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, PastoralMember[]>>({});
  const [events, setEvents] = useState<Record<string, PastoralEvent[]>>({});
  const [myRoles, setMyRoles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // New event form
  const [showEventForm, setShowEventForm] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  useEffect(() => {
    if (!activeTenant?.id || !user?.id) return;
    loadMyPastorais();
  }, [activeTenant?.id, user?.id]);

  const loadMyPastorais = async () => {
    if (!activeTenant?.id || !user?.id) return;
    setIsLoading(true);
    try {
      // Get all memberships for this user
      const { data: memberships, error: mErr } = await supabase
        .from('pastoral_members')
        .select('group_id, role')
        .eq('tenant_id', activeTenant.id)
        .eq('person_id', user.id);
      if (mErr) throw mErr;
      if (!memberships || memberships.length === 0) {
        setMyGroups([]);
        setIsLoading(false);
        return;
      }

      const roles: Record<string, string> = {};
      const groupIds = memberships.map(m => {
        roles[m.group_id] = m.role;
        return m.group_id;
      });
      setMyRoles(roles);

      // Get group details
      const { data: groups, error: gErr } = await supabase
        .from('pastoral_groups')
        .select('*')
        .in('id', groupIds)
        .eq('status', 'active');
      if (gErr) throw gErr;
      setMyGroups(groups || []);
    } catch (err) {
      console.error('Error loading pastorais:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    if (!activeTenant?.id) return;
    try {
      const [membersRes, eventsRes] = await Promise.all([
        supabase.from('pastoral_members').select('*').eq('group_id', groupId).eq('tenant_id', activeTenant.id),
        supabase.from('pastoral_events').select('*').eq('group_id', groupId).eq('tenant_id', activeTenant.id).order('event_date', { ascending: true }),
      ]);
      if (membersRes.data) {
        setMembers(prev => ({ ...prev, [groupId]: membersRes.data }));
      }
      if (eventsRes.data) {
        setEvents(prev => ({ ...prev, [groupId]: eventsRes.data }));
      }
    } catch (err) {
      console.error('Error loading group details:', err);
    }
  };

  const toggleGroup = (groupId: string) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      if (!members[groupId]) loadGroupDetails(groupId);
    }
  };

  const handleCreateEvent = async (groupId: string) => {
    if (!newEventTitle || !newEventDate || !activeTenant?.id) {
      toast.error('Preencha título e data.');
      return;
    }
    try {
      const { error } = await supabase.from('pastoral_events').insert({
        group_id: groupId,
        tenant_id: activeTenant.id,
        title: newEventTitle,
        description: newEventDesc || null,
        event_date: newEventDate,
      });
      if (error) throw error;
      toast.success('Evento criado!');
      setShowEventForm(null);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventDesc('');
      loadGroupDetails(groupId);
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Erro ao criar evento.');
    }
  };

  const sortedMembers = (groupId: string) => {
    const m = members[groupId] || [];
    return [...m].sort((a, b) => {
      const orderA = ROLE_CONFIG[a.role]?.order ?? 99;
      const orderB = ROLE_CONFIG[b.role]?.order ?? 99;
      return orderA - orderB;
    });
  };

  const isCoordinator = (groupId: string) => {
    const role = myRoles[groupId];
    return role === 'coordenador' || role === 'vice_coordenador';
  };

  if (isLoading) {
    return (
      <section className="fiel-section" aria-label="Minhas Pastorais">
        <h3><Users size={18} /> Minhas Pastorais</h3>
        <div className="pastoral-loading glass">Carregando pastorais...</div>
      </section>
    );
  }

  if (myGroups.length === 0) {
    return (
      <section className="fiel-section" aria-label="Minhas Pastorais">
        <h3><Users size={18} /> Minhas Pastorais</h3>
        <div className="pastoral-empty glass">
          <Users size={24} />
          <p>Você ainda não faz parte de nenhuma pastoral.</p>
          <p className="pastoral-empty-hint">Edite seu perfil para participar de uma pastoral.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="fiel-section" aria-label="Minhas Pastorais">
      <h3><Users size={18} /> Minhas Pastorais</h3>
      <div className="pastoral-list">
        {myGroups.map(group => {
          const isExpanded = expandedGroup === group.id;
          const groupMembers = sortedMembers(group.id);
          const groupEvents = events[group.id] || [];
          const futureEvents = groupEvents.filter(e => !isPast(new Date(e.event_date)));
          const canManageEvents = isCoordinator(group.id);

          return (
            <div key={group.id} className={`pastoral-card glass${isExpanded ? ' expanded' : ''}`}>
              <button className="pastoral-card-header" onClick={() => toggleGroup(group.id)}>
                <div className="pastoral-card-info">
                  <span className="pastoral-card-name">{group.name}</span>
                  {group.description && <span className="pastoral-card-desc">{group.description}</span>}
                </div>
                <div className="pastoral-card-meta">
                  <span className="pastoral-role-badge">{ROLE_CONFIG[myRoles[group.id]]?.label || myRoles[group.id]}</span>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>

              {isExpanded && (
                <div className="pastoral-card-body">
                  {/* Equipe */}
                  <div className="pastoral-section">
                    <h4>Equipe</h4>
                    <div className="pastoral-team">
                      {groupMembers.map(m => {
                        const config = ROLE_CONFIG[m.role] || ROLE_CONFIG.membro;
                        const Icon = config.icon;
                        return (
                          <div key={m.id} className={`team-member${m.role !== 'membro' ? ' leader' : ''}`}>
                            <Icon size={14} />
                            <span className="team-member-name">{m.person_name}</span>
                            {m.role !== 'membro' && <span className="team-member-role">{config.label}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Eventos */}
                  <div className="pastoral-section">
                    <div className="pastoral-section-header">
                      <h4>Próximos Eventos</h4>
                      {canManageEvents && (
                        <button className="btn-sm" onClick={() => setShowEventForm(showEventForm === group.id ? null : group.id)}>
                          <Plus size={14} /> Novo Evento
                        </button>
                      )}
                    </div>

                    {showEventForm === group.id && (
                      <div className="event-form glass">
                        <input className="input-text" placeholder="Título do evento" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
                        <input className="input-text" type="datetime-local" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                        <input className="input-text" placeholder="Descrição (opcional)" value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} />
                        <div className="event-form-actions">
                          <button className="btn-secondary" onClick={() => setShowEventForm(null)}>Cancelar</button>
                          <button className="btn-primary" onClick={() => handleCreateEvent(group.id)}>Criar</button>
                        </div>
                      </div>
                    )}

                    {futureEvents.length === 0 ? (
                      <p className="no-events">Nenhum evento agendado.</p>
                    ) : (
                      <div className="pastoral-events-list">
                        {futureEvents.slice(0, 5).map(evt => (
                          <div key={evt.id} className="pastoral-event-item">
                            <div className="pastoral-event-date">
                              <Calendar size={14} />
                              <span>{format(new Date(evt.event_date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                            <span className="pastoral-event-title">{evt.title}</span>
                            {evt.description && <span className="pastoral-event-desc">{evt.description}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
