import { format, isToday, parseISO, differenceInMinutes, differenceInHours, isPast, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Scissors, Phone, DollarSign, Edit, Trash2, Printer, CalendarCheck, Timer, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface Professional {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
}

interface CompactAppointmentListProps {
  appointments: Appointment[];
  professionals: Professional[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
  onCheckout?: (appointment: Appointment) => void;
  onPrint?: (appointment: Appointment) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'confirmed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'completed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'Agendado';
    case 'confirmed':
      return 'Confirmado';
    case 'completed':
      return 'Concluído';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

export function CompactAppointmentList({
  appointments,
  professionals,
  onEdit,
  onDelete,
  onCheckout,
  onPrint,
  canEdit = false,
  canDelete = false,
}: CompactAppointmentListProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const todayAppointments = sortedAppointments.filter(apt => isToday(parseISO(apt.date)));
  const otherAppointments = sortedAppointments.filter(apt => !isToday(parseISO(apt.date)));

  const getNextTodayAppointment = () => {
    const now = currentTime;
    const upcomingAppointments = todayAppointments.filter(apt => {
      const appointmentDateTime = parse(`${apt.date} ${apt.time}`, 'yyyy-MM-dd HH:mm', new Date());
      return !isPast(appointmentDateTime) && (apt.status === 'scheduled' || apt.status === 'confirmed');
    });

    return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  };

  const formatTimeUntil = (appointment: Appointment) => {
    const now = currentTime;
    const appointmentDateTime = parse(`${appointment.date} ${appointment.time}`, 'yyyy-MM-dd HH:mm', new Date());
    
    const totalMinutes = differenceInMinutes(appointmentDateTime, now);
    
    if (totalMinutes < 0) return "Agora";
    if (totalMinutes === 0) return "Agora";
    if (totalMinutes < 60) return `em ${totalMinutes}min`;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) return `em ${hours}h`;
    return `em ${hours}h ${minutes}min`;
  };

  const nextAppointment = getNextTodayAppointment();

  const getDayOccupationStats = () => {
    const workDayStart = 8;
    const workDayEnd = 18;
    const totalWorkMinutes = (workDayEnd - workDayStart) * 60;

    const occupiedMinutes = todayAppointments
      .filter(apt => apt.status !== 'cancelled')
      .reduce((total, apt) => total + (apt.duration || 0), 0);

    const occupationPercentage = Math.round((occupiedMinutes / totalWorkMinutes) * 100);
    const freeMinutes = totalWorkMinutes - occupiedMinutes;

    const completedAppointments = todayAppointments.filter(apt => apt.status === 'completed').length;
    const pendingAppointments = todayAppointments.filter(
      apt => apt.status === 'scheduled' || apt.status === 'confirmed'
    ).length;

    return {
      totalWorkMinutes,
      occupiedMinutes,
      freeMinutes,
      occupationPercentage: Math.min(occupationPercentage, 100),
      completedAppointments,
      pendingAppointments,
      totalAppointments: todayAppointments.length,
    };
  };

  const stats = getDayOccupationStats();

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const groupedAppointments = otherAppointments.reduce((groups, appointment) => {
    const date = appointment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  const getProfessionalNames = (professionalIds: string[]) => {
    return professionalIds
      .map((id) => professionals.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const renderAppointmentCard = (appointment: Appointment, isToday = false) => (
    <Card 
      key={appointment.id} 
      className={cn(
        'p-3 transition-all',
        isToday && 'border-primary bg-primary/5 shadow-md'
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className={cn('h-4 w-4 flex-shrink-0', isToday ? 'text-primary' : 'text-muted-foreground')} />
            <span className={cn('font-semibold text-base', isToday && 'text-primary')}>{appointment.time}</span>
            {appointment.duration && (
              <span className="text-xs text-muted-foreground">
                ({appointment.duration}min)
              </span>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs', getStatusColor(appointment.status))}
          >
            {getStatusLabel(appointment.status)}
          </Badge>
        </div>

        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{appointment.client}</p>
            {appointment.clientPhone && (
              <div className="flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{appointment.clientPhone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Scissors className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm">{appointment.service}</p>
        </div>

        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {getProfessionalNames(appointment.professionals)}
          </p>
        </div>

        {appointment.price !== undefined && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(appointment.price)}
            </p>
          </div>
        )}

        {appointment.notes && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            {appointment.notes}
          </div>
        )}

        <div className="flex gap-1 pt-2 border-t">
          {onPrint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPrint(appointment)}
              className="flex-1"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') &&
            onCheckout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCheckout(appointment)}
                className="flex-1 text-green-600 hover:text-green-700"
              >
                <DollarSign className="h-4 w-4" />
              </Button>
            )}
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(appointment)}
              className="flex-1"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(appointment.id)}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {todayAppointments.length > 0 && (
        <div className="space-y-3">
          <div className="bg-primary/10 p-3 rounded-lg border-2 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-primary">Agendamentos de Hoje</h3>
                <p className="text-xs text-primary/70">
                  {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                {todayAppointments.length}
              </Badge>
            </div>
            
            <div className="mt-3 pt-3 border-t border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Ocupação do Dia</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-primary/70">
                    {formatMinutesToHours(stats.occupiedMinutes)} ocupado
                  </span>
                  <span className="font-bold text-primary">
                    {stats.occupationPercentage}%
                  </span>
                </div>
                <Progress value={stats.occupationPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-background/50 rounded p-1.5 text-center">
                  <p className="text-xs text-muted-foreground">Livres</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatMinutesToHours(stats.freeMinutes)}
                  </p>
                </div>
                <div className="bg-background/50 rounded p-1.5 text-center">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-sm font-semibold text-orange-600">
                    {stats.pendingAppointments}
                  </p>
                </div>
                <div className="bg-background/50 rounded p-1.5 text-center">
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                  <p className="text-sm font-semibold text-green-600">
                    {stats.completedAppointments}
                  </p>
                </div>
              </div>
            </div>

            {nextAppointment && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-primary/20">
                <Timer className="h-4 w-4 text-primary animate-pulse" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary">Próximo agendamento:</p>
                  <p className="text-xs text-primary/70">
                    {nextAppointment.client} às {nextAppointment.time}
                  </p>
                </div>
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-bold">
                  {formatTimeUntil(nextAppointment)}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {todayAppointments.map((appointment) => renderAppointmentCard(appointment, true))}
          </div>
        </div>
      )}

      {Object.keys(groupedAppointments).length > 0 && (
        <div className="space-y-4">
          {todayAppointments.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Próximos Agendamentos
              </h3>
            </>
          )}
          
          {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
            <div key={date}>
              <div className="sticky top-0 bg-background z-10 pb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <Separator className="mt-2" />
              </div>

              <div className="space-y-2">
                {dayAppointments.map((appointment) => renderAppointmentCard(appointment, false))}
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedAppointments.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
        </Card>
      )}
    </div>
  );
}
