import { format, isToday, parseISO, differenceInMinutes, isPast, parse, startOfWeek, endOfWeek, addWeeks, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Scissors, Phone, DollarSign, Pencil, Trash2, Printer, CalendarCheck, Timer, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getStatusBadgeClass, getStatusLabel, type AptStatus, getStatusCardClass } from "@/lib/appointments/statusUI";

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
  status: AptStatus;
  payment_status: "unpaid" | "partial" | "paid";
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
  itemsPerPage?: number;
}

const getPaymentStatusColor = (status: Appointment["payment_status"]) => {
  switch (status) {
    case "unpaid":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "partial":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "paid":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getPaymentStatusLabel = (status: Appointment["payment_status"]) => {
  switch (status) {
    case "unpaid":
      return "Não pago";
    case "partial":
      return "Pago antecipado";
    case "paid":
      return "Pago";
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
  itemsPerPage = 10,
}: CompactAppointmentListProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem("appointments_list_expanded_days");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [appointments]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "appointments_list_expanded_days",
        JSON.stringify(expandedDays)
      );
    } catch {
    }
  }, [expandedDays]);

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const todayAppointments = sortedAppointments.filter((apt) =>
    isToday(parseISO(apt.date))
  );
  const otherAppointments = sortedAppointments.filter(
    (apt) => !isToday(parseISO(apt.date))
  );

  const safeItemsPerPage = Math.max(1, itemsPerPage);
  const totalOtherAppointments = otherAppointments.length;
  const totalPages =
    totalOtherAppointments === 0
      ? 1
      : Math.ceil(totalOtherAppointments / safeItemsPerPage);

  const startIndex = (currentPage - 1) * safeItemsPerPage;
  const endIndex = startIndex + safeItemsPerPage;
  const paginatedOtherAppointments = otherAppointments.slice(
    startIndex,
    endIndex
  );

  const getNextTodayAppointment = () => {
    const now = currentTime;
    const upcomingAppointments = todayAppointments.filter((apt) => {
      const appointmentDateTime = parse(
        `${apt.date} ${apt.time}`,
        "yyyy-MM-dd HH:mm",
        new Date()
      );
      return (
        !isPast(appointmentDateTime) &&
        (apt.status === "scheduled" || apt.status === "confirmed")
      );
    });

    return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  };

  const formatTimeUntil = (appointment: Appointment) => {
    const now = currentTime;
    const appointmentDateTime = parse(
      `${appointment.date} ${appointment.time}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );

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
      .filter((apt) => apt.status !== "cancelled")
      .reduce((total, apt) => total + (apt.duration || 0), 0);

    const occupationPercentage = Math.round(
      (occupiedMinutes / totalWorkMinutes) * 100
    );
    const freeMinutes = totalWorkMinutes - occupiedMinutes;

    const completedAppointments = todayAppointments.filter(
      (apt) => apt.status === "completed"
    ).length;
    const pendingAppointments = todayAppointments.filter(
      (apt) =>
        apt.status === "scheduled" || apt.status === "confirmed"
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

  const groupedAppointments = paginatedOtherAppointments.reduce(
    (groups, appointment) => {
      const date = appointment.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    },
    {} as Record<string, Appointment[]>
  );

  const getWeekTag = (jsDate: Date) => {
    const today = new Date();

    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    const startOfNextWeek = addWeeks(startOfThisWeek, 1);
    const endOfNextWeek = addWeeks(endOfThisWeek, 1);

    if (jsDate >= startOfThisWeek && jsDate <= endOfThisWeek) {
      return {
        label: "Esta semana",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }

    if (jsDate >= startOfNextWeek && jsDate <= endOfNextWeek) {
      return {
        label: "Próxima semana",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      };
    }

    if (isSameMonth(jsDate, today)) {
      return {
        label: "Este mês",
        badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
      };
    }

    return {
      label: format(jsDate, "MMM yyyy", { locale: ptBR }),
      badgeClass: "bg-muted text-muted-foreground border-border",
    };
  };

  const getProfessionalNames = (professionalIds: string[]) => {
    return professionalIds
      .map((id) => professionals.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const renderAppointmentCard = (
    appointment: Appointment,
    isToday = false
  ) => (
    <Card
      key={appointment.id}
      className={cn(
        "p-3 transition-all",
        getStatusCardClass(appointment.status as any),
        isToday && "shadow-md"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isToday ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "font-semibold text-base",
                isToday && "text-primary"
              )}
            >
              {appointment.time}
            </span>
            {appointment.duration && (
              <span className="text-xs text-muted-foreground">
                ({appointment.duration}min)
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={getStatusBadgeClass(
                appointment.status as any,
                "text-[11px] px-2 py-0.5 rounded-full"
              )}
            >
              {getStatusLabel(appointment.status as any)}
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full",
                getPaymentStatusColor(appointment.payment_status)
              )}
            >
              {getPaymentStatusLabel(appointment.payment_status)}
            </Badge>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {appointment.client}
            </p>
            {appointment.clientPhone && (
              <div className="flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {appointment.clientPhone}
                </p>
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
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
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
          {(appointment.status === "scheduled" ||
            appointment.status === "confirmed") &&
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
              <Pencil className="h-4 w-4" />
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

  const showingFrom =
    totalOtherAppointments === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalOtherAppointments);

  return (
    <div className="space-y-6">
      {todayAppointments.length > 0 && (
        <div className="space-y-3">
          <div className="bg-primary/10 p-3 rounded-lg border-2 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-primary">
                  Agendamentos de Hoje
                </h3>
                <p className="text-xs text-primary/70">
                  {format(new Date(), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-primary text-primary-foreground"
              >
                {todayAppointments.length}
              </Badge>
            </div>

            <div className="mt-3 pt-3 border-t border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  Ocupação do Dia
                </span>
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
                  <p className="text-xs font-medium text-primary">
                    Próximo agendamento:
                  </p>
                  <p className="text-xs text-primary/70">
                    {nextAppointment.client} às {nextAppointment.time}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/20 text-primary border-primary/30 font-bold"
                >
                  {formatTimeUntil(nextAppointment)}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {todayAppointments.map((appointment) =>
              renderAppointmentCard(appointment, true)
            )}
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

          {Object.entries(groupedAppointments).map(([date, dayAppointments]) => {
            const jsDate = parseISO(date);
            const weekday = format(jsDate, "EEEE", { locale: ptBR });
            const fullDate = format(jsDate, "dd 'de' MMMM", { locale: ptBR });

            const weekTag = getWeekTag(jsDate);

            const isExpanded = expandedDays[date] ?? false;

            const toggleDay = () => {
              setExpandedDays((prev) => ({
                ...prev,
                [date]: !isExpanded,
              }));
            };

            return (
              <div key={date} className="space-y-2">
                <div className="sticky top-0 z-10 pt-2">
                  <div
                    className="flex items-center justify-between rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm cursor-pointer select-none"
                    onClick={toggleDay}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        {weekday}
                      </span>
                      <span className="text-sm font-semibold">
                        {fullDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full",
                          weekTag.badgeClass
                        )}
                      >
                        <CalendarDays className="h-3 w-3" />
                        <span>{weekTag.label}</span>
                      </Badge>

                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5"
                      >
                        {dayAppointments.length}{" "}
                        {dayAppointments.length === 1 ? "agendamento" : "agendamentos"}
                      </Badge>

                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-2">
                    {dayAppointments.map((appointment) =>
                      renderAppointmentCard(appointment, false)
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {totalOtherAppointments > safeItemsPerPage && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-3 border-t">
              <p className="text-[11px] md:text-xs text-muted-foreground">
                Exibindo{" "}
                <span className="font-semibold">
                  {showingFrom}–{showingTo}
                </span>{" "}
                de{" "}
                <span className="font-semibold">
                  {totalOtherAppointments}
                </span>{" "}
                agendamentos futuros
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página{" "}
                  <span className="font-semibold">{currentPage}</span> de{" "}
                  <span className="font-semibold">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPages, prev + 1)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {sortedAppointments.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum agendamento encontrado
          </p>
        </Card>
      )}
    </div>
  );
}
