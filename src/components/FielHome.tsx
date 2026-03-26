import { useState, useEffect } from 'react';
import { Award, Calendar, Clock, ChevronLeft, ChevronRight, Plus, LogOut, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { ignisApi } from '../services/api';
import { AppointmentWizard } from './AppointmentWizard';
import { FielPastorais } from './FielPastorais';
import type { Appointment, Sacrament } from '../services/api';
import { format, startOfDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './FielHome.css';

interface FielHomeProps {
  onProfileClick?: () => void;
  canSwitchLevel?: boolean;
  onSwitchLevel?: () => void;
}

const SACRAMENT_LABELS: Record<string, string> = {
  baptism: 'Batismo',
  first_communion: '1ª Eucaristia',
  confirmation: 'Crisma',
  marriage: 'Matrimônio',
  anointing_of_sick: 'Unção dos Enfermos',
};

const SACRAMENT_ORDER = ['baptism', 'first_communion', 'confirmation', 'marriage', 'anointing_of_sick'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const FielHome: React.FC<FielHomeProps> = ({ onProfileClick, canSwitchLevel, onSwitchLevel }) => {
  const { user, profile, signOut } = useAuth();
  const { activeTenant } = useTenant();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; hour: number; minute: number }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [sacraments, setSacraments] = useState<Sacrament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [daysWithSlots, setDaysWithSlots] = useState<Set<string>>(new Set());

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Fiel';
  const firstName = userName.split(' ')[0];
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const parishName = activeTenant?.name || 'Paróquia';
  const displayAvatar = (profile as any)?.avatar_url || null;

  useEffect(() => {
    if (!activeTenant?.id) return;
    loadMyData();
  }, [activeTenant?.id]);

  // Load days with available slots for the current month
  useEffect(() => {
    if (!activeTenant?.id) return;
    loadMonthAvailability();
  }, [activeTenant?.id, currentMonth]);

  const loadMyData = async () => {
    if (!activeTenant?.id) return;
    setIsLoading(true);
    try {
      const now = startOfDay(new Date());
      const future = addDays(now, 30);
      const communities = await ignisApi.communities.getByTenant(activeTenant.id);

      // Load my upcoming appointments
      const allAppointments: Appointment[] = [];
      for (const c of communities) {
        const appts = await ignisApi.appointments.getByDateRange(activeTenant.id, c.id, now, future);
        allAppointments.push(...appts);
      }
      const myAppts = allAppointments
        .filter(a => a.status !== 'cancelled')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5);
      setMyAppointments(myAppts);

      // Load sacraments
      const allSacraments = await ignisApi.sacraments.getAll(activeTenant.id);
      const mySacraments = allSacraments.filter(s =>
        s.subjectName?.toLowerCase().includes(firstName.toLowerCase())
      );
      setSacraments(mySacraments);
    } catch (error) {
      console.error('FielHome: Error loading data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthAvailability = async () => {
    if (!activeTenant?.id) return;
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const today = startOfDay(new Date());
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const available = new Set<string>();

      // Check a few days ahead to show availability (sample: check each day)
      for (const day of days) {
        if (day < today) continue;
        const slots = await ignisApi.appointments.getAvailableSlots(activeTenant.id, day);
        if (slots.length > 0) {
          available.add(format(day, 'yyyy-MM-dd'));
        }
      }
      setDaysWithSlots(available);
    } catch (error) {
      console.error('Error loading month availability', error);
    }
  };

  const handleDayClick = async (day: Date) => {
    if (day < startOfDay(new Date())) return;
    setSelectedDate(day);
    setLoadingSlots(true);
    try {
      const slots = await ignisApi.appointments.getAvailableSlots(activeTenant!.id, day);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotClick = (_slot: { time: string; hour: number; minute: number }) => {
    setIsWizardOpen(true);
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const completedSacraments = sacraments.map(s => s.type);
  const journeyItems = SACRAMENT_ORDER.map(type => ({
    type,
    label: SACRAMENT_LABELS[type] || type,
    completed: completedSacraments.includes(type as any),
  }));

  return (
    <div className="fiel-mobile-container fade-in">
      {/* Header */}
      <header className="fiel-header glass" role="banner">
        <div className="fiel-user">
          <button className="fiel-avatar-btn" onClick={onProfileClick} aria-label="Editar perfil">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="fiel-avatar-img" />
            ) : (
              <div className="fiel-avatar" aria-hidden="true">{initials}</div>
            )}
          </button>
          <div>
            <h2 className="fiel-greeting">Salve Maria, {firstName}!</h2>
            <p className="fiel-subtitle">{parishName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {canSwitchLevel && (
            <button className="notif-btn" onClick={onSwitchLevel} aria-label="Trocar visão" title="Trocar visão" style={{ color: 'var(--warning-color)' }}>
              <ArrowLeftRight size={20} />
            </button>
          )}
          <button className="notif-btn logout-btn" onClick={() => signOut()} aria-label="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Monthly Calendar */}
      <section className="fiel-section" aria-label="Calendário">
        <div className="fiel-calendar-header">
          <button className="cal-nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={20} />
          </button>
          <h3 className="cal-month-label">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button className="cal-nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="fiel-calendar-grid">
          {WEEKDAYS.map(d => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-day empty" />
          ))}
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const hasSlots = daysWithSlots.has(dateKey);
            const isPast = day < startOfDay(new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={dateKey}
                className={`cal-day${isToday(day) ? ' today' : ''}${isSelected ? ' selected' : ''}${hasSlots ? ' has-slots' : ''}${isPast ? ' past' : ''}`}
                onClick={() => !isPast && handleDayClick(day)}
                disabled={isPast}
              >
                <span className="cal-day-number">{format(day, 'd')}</span>
                {hasSlots && <span className="cal-dot" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Available Slots for selected day */}
      {selectedDate && (
        <section className="fiel-section" aria-label="Horários disponíveis">
          <h3>Horários em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</h3>
          {loadingSlots ? (
            <div className="slots-loading">
              <Clock size={16} /> Carregando horários...
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="slots-empty glass">
              <Calendar size={20} />
              <p>Nenhum horário disponível neste dia.</p>
            </div>
          ) : (
            <div className="slots-grid">
              {availableSlots.map(slot => (
                <button
                  key={slot.time}
                  className="slot-btn glass"
                  onClick={() => handleSlotClick(slot)}
                >
                  <Clock size={14} />
                  <span>{slot.time}</span>
                  <Plus size={14} className="slot-plus" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Minhas Pastorais */}
      <FielPastorais />

      {/* My Appointments */}
      <section className="fiel-section" aria-label="Meus agendamentos">
        <h3>Meus Agendamentos</h3>
        {isLoading ? (
          <div className="event-card glass">
            <div className="skeleton skeleton-text" style={{ width: '100%', height: 60 }} />
          </div>
        ) : myAppointments.length === 0 ? (
          <div className="event-card glass empty-state">
            <Clock size={20} />
            <p>Nenhum agendamento. Selecione um dia no calendário!</p>
          </div>
        ) : (
          myAppointments.slice(0, 5).map((appt) => {
            const date = new Date(appt.startTime);
            return (
              <div key={appt.id} className="event-card glass">
                <div className="event-date">
                  <span className="day">{format(date, 'd')}</span>
                  <span className="month">{format(date, 'MMM', { locale: ptBR }).toUpperCase()}</span>
                </div>
                <div className="event-info">
                  <h4 className="event-name">{appt.serviceType}</h4>
                  <p className="event-loc">
                    {appt.celebrantName || parishName} • {format(date, 'HH:mm')}
                  </p>
                </div>
                <div className={`event-status-badge status-${appt.status}`}>
                  {appt.status === 'confirmed' ? 'Confirmado' :
                    appt.status === 'pending' ? 'Pendente' :
                      appt.status === 'completed' ? 'Realizado' : appt.status}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Faith Journey */}
      <section className="fiel-section" aria-label="Jornada sacramental">
        <h3>Minha Jornada de Fé</h3>
        <div className="journey-grid">
          {journeyItems.map((item) => (
            <button
              key={item.type}
              type="button"
              className={`journey-item glass ${item.completed ? '' : 'pending'}`}
              onClick={() => {
                if (item.completed) {
                  toast.success(`${item.label} já recebido! ✝️`);
                } else {
                  toast(`Procure a secretaria para iniciar o processo de ${item.label}.`, { icon: '📋' });
                }
              }}
            >
              {item.completed ? (
                <Award size={20} className="icon-gold" />
              ) : (
                <Plus size={20} />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Wizard */}
      <AppointmentWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        tenantId={activeTenant?.id}
        onSuccess={() => {
          toast.success('Agendamento criado com sucesso!');
          loadMyData();
          if (selectedDate) handleDayClick(selectedDate);
        }}
      />
    </div>
  );
};
