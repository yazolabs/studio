import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OpenWindow {
  id: string;
  date_start: string;
  date_end: string;
  status: 'open' | 'closed';
}

interface Professional {
  id: string;
  name: string;
  openWindows?: OpenWindow[];
  color?: string;
}

interface Appointment {
  id: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
}

interface MonthlyAvailabilityCalendarProps {
  professionals: Professional[];
  appointments: Appointment[];
  onDayClick?: (date: Date) => void;
}

const professionalColors = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
];

export function MonthlyAvailabilityCalendar({ professionals, appointments, onDayClick }: MonthlyAvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const professionalsWithColors = professionals.map((prof, idx) => ({
    ...prof,
    colorScheme: professionalColors[idx % professionalColors.length],
  }));

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDayAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availableProfessionals: typeof professionalsWithColors = [];
    const busyProfessionals: typeof professionalsWithColors = [];

    professionalsWithColors.forEach(professional => {
      const hasOpenWindow = professional.openWindows?.some(window => {
        if (window.status !== 'open') return false;
        return dateStr >= window.date_start && dateStr <= window.date_end;
      });

      if (!hasOpenWindow && professional.openWindows && professional.openWindows.length > 0) {
        return;
      }

      const hasAppointments = appointments.some(apt => 
        apt.date === dateStr && 
        apt.professionals.includes(professional.id) &&
        apt.status !== 'cancelled'
      );

      if (hasAppointments) {
        busyProfessionals.push(professional);
      } else if (hasOpenWindow || !professional.openWindows || professional.openWindows.length === 0) {
        availableProfessionals.push(professional);
      }
    });

    return { availableProfessionals, busyProfessionals };
  };

  const getDayAppointments = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => 
      apt.date === dateStr && apt.status !== 'cancelled'
    );
  };

  const generateTooltipContent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAppointments = getDayAppointments(date);
    const { availableProfessionals, busyProfessionals } = getDayAvailability(date);

    if (dayAppointments.length === 0 && availableProfessionals.length === 0 && busyProfessionals.length === 0) {
      return (
        <div className="text-sm">
          <p className="font-medium mb-1">{format(date, "dd 'de' MMMM", { locale: ptBR })}</p>
          <p className="text-muted-foreground">Nenhum profissional disponível</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-w-xs">
        <p className="font-medium">{format(date, "dd 'de' MMMM", { locale: ptBR })}</p>
        
        {dayAppointments.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1">Agendamentos:</p>
            <div className="space-y-1">
              {dayAppointments.map(apt => {
                const professionalNames = apt.professionals
                  .map(id => professionals.find(p => p.id === id)?.name)
                  .filter(Boolean)
                  .join(', ');
                return (
                  <div key={apt.id} className="text-xs">
                    <span className="font-medium">{apt.time}</span> - {professionalNames}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {availableProfessionals.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1 text-green-600">Disponíveis:</p>
            <div className="flex flex-wrap gap-1">
              {availableProfessionals.map(prof => (
                <span key={prof.id} className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                  {prof.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {busyProfessionals.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1 text-orange-600">Com agendamentos:</p>
            <div className="flex flex-wrap gap-1">
              {busyProfessionals.map(prof => (
                <span key={prof.id} className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                  {prof.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <div className="flex gap-1 md:gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth} className="h-8 w-8 md:h-10 md:w-10">
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 md:h-10 md:w-10">
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-3 md:mb-4">
          <p className="text-xs md:text-sm font-medium mb-2">Legenda:</p>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {professionalsWithColors.map((prof) => (
              <div key={prof.id} className="flex items-center gap-1.5 md:gap-2">
                <div className={cn('w-3 h-3 md:w-4 md:h-4 rounded border-2', prof.colorScheme.bg, prof.colorScheme.border)} />
                <span className="text-xs md:text-sm">{prof.name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4 mt-2 text-[10px] md:text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded border-2 opacity-100" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded border-2 opacity-40" />
              <span>Ocupado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] md:text-sm font-medium text-muted-foreground py-1 md:py-2"
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.substring(0, 1)}</span>
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, idx) => {
          const { availableProfessionals, busyProfessionals } = getDayAvailability(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => isCurrentMonth && onDayClick?.(day)}
                  className={cn(
                    'min-h-[60px] md:min-h-[80px] border rounded-md md:rounded-lg p-0.5 md:p-1 relative transition-all',
                    !isCurrentMonth && 'bg-muted/30',
                    isTodayDate && 'ring-1 md:ring-2 ring-primary',
                    isCurrentMonth && onDayClick && 'cursor-pointer hover:bg-accent hover:shadow-md'
                  )}
                >
              <div className={cn(
                'text-[10px] md:text-xs font-medium mb-0.5 md:mb-1',
                !isCurrentMonth && 'text-muted-foreground',
                isTodayDate && 'text-primary font-bold'
              )}>
                {format(day, 'd')}
              </div>

              {/* Available professionals indicators */}
              <div className="flex flex-wrap gap-0.5">
                {availableProfessionals.map((prof) => (
                  <div
                    key={`available-${prof.id}`}
                    className={cn(
                      'w-1.5 h-1.5 md:w-2 md:h-2 rounded-full',
                      prof.colorScheme.bg,
                      'border',
                      prof.colorScheme.border
                    )}
                    title={`${prof.name} - Disponível`}
                  />
                ))}
                {busyProfessionals.map((prof) => (
                  <div
                    key={`busy-${prof.id}`}
                    className={cn(
                      'w-1.5 h-1.5 md:w-2 md:h-2 rounded-full opacity-40',
                      prof.colorScheme.bg,
                      'border',
                      prof.colorScheme.border
                    )}
                    title={`${prof.name} - Ocupado`}
                  />
                ))}
              </div>

              {/* Appointment count */}
              {(availableProfessionals.length > 0 || busyProfessionals.length > 0) && (
                <div className="text-[8px] md:text-[10px] text-muted-foreground mt-0.5 md:mt-1">
                  {busyProfessionals.length > 0 && `${busyProfessionals.length} ocupado`}
                </div>
              )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] md:max-w-sm text-xs md:text-sm">
                {generateTooltipContent(day)}
              </TooltipContent>
            </Tooltip>
          );
        })}
        </div>
      </TooltipProvider>
    </Card>
  );
}