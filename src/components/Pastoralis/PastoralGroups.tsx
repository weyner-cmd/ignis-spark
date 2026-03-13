import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit2, Trash2, Calendar, UserPlus,
  ChevronDown, ChevronUp, X, Save
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';

interface PastoralGroup {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface PastoralMember {
  id: string;
  group_id: string;
  person_name: string;
  role: string;
  mandate_start: string | null;
  mandate_end: string | null;
}

interface PastoralEvent {
  id: string;
  group_id: string;
  title: string;
  event_date: string;
  description: string | null;
}

const MEMBER_ROLES = [
  { value: 'coordenador', label: 'Coordenador(a)' },
  { value: 'vice_coordenador', label: 'Vice-Coordenador(a)' },
  { value: 'tesoureiro', label: 'Tesoureiro(a)' },
  { value: 'secretario', label: 'Secretário(a)' },
  { value: 'membro', label: 'Membro' },
];

interface PastoralGroupsProps {
  tenantId: string;
}

export const PastoralGroups: React.FC<PastoralGroupsProps> = ({ tenantId }) => {
  const [groups, setGroups] = useState<PastoralGroup[]>([]);
  const [members, setMembers] = useState<Record<string, PastoralMember[]>>({});
  const [events, setEvents] = useState<Record<string, PastoralEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });

  // Member form
  const [showMemberForm, setShowMemberForm] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ person_name: '', role: 'membro', mandate_start: '', mandate_end: '' });

  // Event form
  const [showEventForm, setShowEventForm] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', event_date: '', description: '' });

  useEffect(() => { loadGroups(); }, [tenantId]);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pastoral_groups')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw error;
      setGroups((data || []) as PastoralGroup[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      const [membersRes, eventsRes] = await Promise.all([
        supabase.from('pastoral_members').select('*').eq('group_id', groupId).order('role'),
        supabase.from('pastoral_events').select('*').eq('group_id', groupId).order('event_date', { ascending: false }),
      ]);
      setMembers(prev => ({ ...prev, [groupId]: (membersRes.data || []) as PastoralMember[] }));
      setEvents(prev => ({ ...prev, [groupId]: (eventsRes.data || []) as PastoralEvent[] }));
    } catch (err) {
      console.error(err);
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

  const handleSaveGroup = async () => {
    if (!groupForm.name) { toast.error('Nome obrigatório.'); return; }
    try {
      if (editingGroupId) {
        const { error } = await supabase.from('pastoral_groups')
          .update({ name: groupForm.name, description: groupForm.description || null })
          .eq('id', editingGroupId);
        if (error) throw error;
        toast.success('Pastoral atualizada.');
      } else {
        const { error } = await supabase.from('pastoral_groups')
          .insert([{ tenant_id: tenantId, name: groupForm.name, description: groupForm.description || null }]);
        if (error) throw error;
        toast.success('Pastoral criada.');
      }
      setShowGroupForm(false);
      setEditingGroupId(null);
      setGroupForm({ name: '', description: '' });
      loadGroups();
    } catch { toast.error('Erro ao salvar.'); }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const { error } = await supabase.from('pastoral_groups').delete().eq('id', id);
      if (error) throw error;
      toast.success('Pastoral excluída.');
      loadGroups();
    } catch { toast.error('Erro ao excluir.'); }
  };

  const handleSaveMember = async (groupId: string) => {
    if (!memberForm.person_name) { toast.error('Nome obrigatório.'); return; }
    try {
      const { error } = await supabase.from('pastoral_members').insert([{
        group_id: groupId, tenant_id: tenantId,
        person_name: memberForm.person_name, role: memberForm.role,
        mandate_start: memberForm.mandate_start || null,
        mandate_end: memberForm.mandate_end || null,
      }]);
      if (error) throw error;
      toast.success('Membro adicionado.');
      setShowMemberForm(null);
      setMemberForm({ person_name: '', role: 'membro', mandate_start: '', mandate_end: '' });
      loadGroupDetails(groupId);
    } catch { toast.error('Erro ao adicionar membro.'); }
  };

  const handleDeleteMember = async (memberId: string, groupId: string) => {
    try {
      const { error } = await supabase.from('pastoral_members').delete().eq('id', memberId);
      if (error) throw error;
      loadGroupDetails(groupId);
    } catch { toast.error('Erro ao remover.'); }
  };

  const handleSaveEvent = async (groupId: string) => {
    if (!eventForm.title || !eventForm.event_date) { toast.error('Título e data obrigatórios.'); return; }
    try {
      const { error } = await supabase.from('pastoral_events').insert([{
        group_id: groupId, tenant_id: tenantId,
        title: eventForm.title, event_date: eventForm.event_date,
        description: eventForm.description || null,
      }]);
      if (error) throw error;
      toast.success('Evento criado.');
      setShowEventForm(null);
      setEventForm({ title: '', event_date: '', description: '' });
      loadGroupDetails(groupId);
    } catch { toast.error('Erro ao criar evento.'); }
  };

  const handleDeleteEvent = async (eventId: string, groupId: string) => {
    try {
      const { error } = await supabase.from('pastoral_events').delete().eq('id', eventId);
      if (error) throw error;
      loadGroupDetails(groupId);
    } catch { toast.error('Erro ao excluir evento.'); }
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === 'coordenador') return 'role-coord';
    if (role === 'vice_coordenador') return 'role-vice';
    if (role === 'tesoureiro') return 'role-tres';
    return 'role-member';
  };

  return (
    <div className="pastoral-groups-module">
      <header className="module-header glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
              <Users size={24} className="text-accent" /> Pastorais
            </h2>
            <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Gestão de pastorais, cargos e eventos.</p>
          </div>
          <button className="btn-primary" onClick={() => { setGroupForm({ name: '', description: '' }); setEditingGroupId(null); setShowGroupForm(true); }}>
            <Plus size={18} /> Nova Pastoral
          </button>
        </div>
      </header>

      {showGroupForm && (
        <div className="glass" style={{ padding: '20px', marginBottom: '16px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3>{editingGroupId ? 'Editar' : 'Nova'} Pastoral</h3>
            <button className="btn-icon" onClick={() => setShowGroupForm(false)}><X size={18} /></button>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input className="input-text" placeholder="Nome da pastoral *" value={groupForm.name}
              onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1, minWidth: '200px' }} />
            <input className="input-text" placeholder="Descrição" value={groupForm.description}
              onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 2, minWidth: '200px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button className="btn-secondary" onClick={() => setShowGroupForm(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveGroup}><Save size={16} /> Salvar</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton glass" style={{ height: '60px', borderRadius: '12px' }} />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center', opacity: 0.5, borderRadius: 'var(--radius-lg)' }}>
          <Users size={48} style={{ margin: '0 auto 12px' }} />
          <p>Nenhuma pastoral cadastrada.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {groups.map(g => (
            <div key={g.id} className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => toggleGroup(g.id)}
              >
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{g.name}</h3>
                  {g.description && <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>{g.description}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="btn-icon-sm" onClick={e => { e.stopPropagation(); setGroupForm({ name: g.name, description: g.description || '' }); setEditingGroupId(g.id); setShowGroupForm(true); }}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-icon-sm danger" onClick={e => { e.stopPropagation(); handleDeleteGroup(g.id); }}>
                    <Trash2 size={14} />
                  </button>
                  {expandedGroup === g.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedGroup === g.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                  {/* Members */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', opacity: 0.7 }}>Membros</h4>
                      <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                        onClick={() => setShowMemberForm(showMemberForm === g.id ? null : g.id)}>
                        <UserPlus size={14} /> Adicionar
                      </button>
                    </div>

                    {showMemberForm === g.id && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                        <input className="input-text" placeholder="Nome *" value={memberForm.person_name}
                          onChange={e => setMemberForm(f => ({ ...f, person_name: e.target.value }))} style={{ flex: 1, minWidth: '150px' }} />
                        <select className="input-select" value={memberForm.role}
                          onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} style={{ width: '160px' }}>
                          {MEMBER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <input className="input-text" type="date" placeholder="Início mandato" value={memberForm.mandate_start}
                          onChange={e => setMemberForm(f => ({ ...f, mandate_start: e.target.value }))} style={{ width: '140px' }} />
                        <input className="input-text" type="date" placeholder="Fim mandato" value={memberForm.mandate_end}
                          onChange={e => setMemberForm(f => ({ ...f, mandate_end: e.target.value }))} style={{ width: '140px' }} />
                        <button className="btn-primary" style={{ padding: '6px 12px' }} onClick={() => handleSaveMember(g.id)}>
                          <Save size={14} />
                        </button>
                      </div>
                    )}

                    {(members[g.id] || []).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', opacity: 0.4, padding: '8px 0' }}>Nenhum membro cadastrado.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(members[g.id] || []).map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{m.person_name}</span>
                              <span className={`pastoral-role-badge ${getRoleBadgeClass(m.role)}`}>
                                {MEMBER_ROLES.find(r => r.value === m.role)?.label || m.role}
                              </span>
                            </div>
                            <button className="btn-icon-sm danger" onClick={() => handleDeleteMember(m.id, g.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Events */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', opacity: 0.7 }}>Eventos</h4>
                      <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                        onClick={() => setShowEventForm(showEventForm === g.id ? null : g.id)}>
                        <Calendar size={14} /> Novo Evento
                      </button>
                    </div>

                    {showEventForm === g.id && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                        <input className="input-text" placeholder="Título *" value={eventForm.title}
                          onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} style={{ flex: 1, minWidth: '150px' }} />
                        <input className="input-text" type="datetime-local" value={eventForm.event_date}
                          onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} style={{ width: '200px' }} />
                        <input className="input-text" placeholder="Descrição" value={eventForm.description}
                          onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 1, minWidth: '150px' }} />
                        <button className="btn-primary" style={{ padding: '6px 12px' }} onClick={() => handleSaveEvent(g.id)}>
                          <Save size={14} />
                        </button>
                      </div>
                    )}

                    {(events[g.id] || []).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', opacity: 0.4, padding: '8px 0' }}>Nenhum evento cadastrado.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(events[g.id] || []).map(ev => (
                          <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                            <div>
                              <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{ev.title}</span>
                              <span style={{ fontSize: '0.75rem', opacity: 0.5, marginLeft: '8px' }}>
                                {new Date(ev.event_date).toLocaleDateString('pt-BR')} {new Date(ev.event_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button className="btn-icon-sm danger" onClick={() => handleDeleteEvent(ev.id, g.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
