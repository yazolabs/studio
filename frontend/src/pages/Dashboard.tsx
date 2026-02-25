import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Scissors, TrendingUp, Clock, Tag, Megaphone, TrendingDown, Target, Wallet, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePermissions } from "@/contexts/permissionsContext";
import { Screen } from "@/types/auth";
import { api } from "@/services/api";
import { getDashboardSummary, getProfessionalsSchedule, getRecentAppointments, getPopularServices, getDashboardPromotions, ApiProfessional, ApiPromotion } from "@/services/dashboardService";

interface WorkSchedule {
  dayOfWeek: string;
  isWorkingDay: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

interface Professional {
  id: string;
  name: string;
  services: string[];
  schedule: WorkSchedule[];
}

interface AppointmentForManagement {
  id: string | number;
  professionalId: string;
  clientName: string;
  service: string;
  time: string;
  status: "scheduled" | "in-progress" | "completed";
}

interface Promotion {
  id: string;
  name: string;
  type: "discount" | "package" | "loyalty";
  discount: number;
  usage: number;
  target: number;
  revenue: number;
  status: "active" | "scheduled" | "expired";
  endDate: string;
}

function formatYmdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ApiAppointmentLite = {
  id: number | string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: number | null;
  status?: string | null;
  customer?: { id: number | string; name: string } | null;
  services?: Array<{ id?: number | string; name?: string | null }>;
};

type ApiCommissionLite = {
  id: number | string;
  date?: string | null;
  commission_amount?: string | number;
  status?: string;
};

async function getMyAppointments(params: Record<string, any>) {
  const { data } = await api.get("/appointments", { params });
  return (data?.data ?? data) as ApiAppointmentLite[];
}

async function getMyCommissions(params: Record<string, any>) {
  const { data } = await api.get("/commissions", { params });
  return (data?.data ?? data) as ApiCommissionLite[];
}

function statusBadgeVariant(status?: string) {
  if (status === "completed") return "outline";
  if (status === "in-progress") return "secondary";
  return "default";
}

function statusLabel(status?: string) {
  if (status === "completed") return "Concluído";
  if (status === "in-progress") return "Em Atendimento";
  if (status === "scheduled") return "Agendado";
  return status ?? "—";
}

function DashboardProfessionalView({
  userName,
  dateYmd,
}: {
  userName?: string;
  dateYmd: string;
}) {
  const todayQ = useQuery({
    queryKey: ["dash-pro", "today", dateYmd],
    queryFn: () => getMyAppointments({ date: dateYmd }),
  });

  const weekRange = useMemo(() => {
    const start = new Date(dateYmd + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start: dateYmd, end: formatYmdLocal(end) };
  }, [dateYmd]);

  const weekQ = useQuery({
    queryKey: ["dash-pro", "week", weekRange.start, weekRange.end],
    queryFn: () => getMyAppointments({ start_date: weekRange.start, end_date: weekRange.end }),
  });

  const monthRange = useMemo(() => {
    const now = new Date(dateYmd + "T00:00:00");
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: formatYmdLocal(start), end: dateYmd };
  }, [dateYmd]);

  const commissionsQ = useQuery({
    queryKey: ["dash-pro", "commissions", monthRange.start, monthRange.end],
    queryFn: () => getMyCommissions({ start_date: monthRange.start, end_date: monthRange.end, perPage: 200 }),
  });

  const loading = todayQ.isLoading || weekQ.isLoading || commissionsQ.isLoading;
  const error = todayQ.isError || weekQ.isError || commissionsQ.isError;

  const todaySorted = useMemo(() => {
    const list = todayQ.data ?? [];
    return [...list].sort((a, b) =>
      String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
    );
  }, [todayQ.data]);

  const nowHms = useMemo(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  }, []);

  const nextAppointment = useMemo(() => {
    return (
      todaySorted.find((a) => (a.start_time ?? "99:99:99") >= nowHms) ?? null
    );
  }, [todaySorted, nowHms]);

  const dayStats = useMemo(() => {
    const total = todaySorted.length;
    const completed = todaySorted.filter((a) => a.status === "completed").length;
    const inProgress = todaySorted.filter((a) => a.status === "in-progress").length;
    const scheduled = todaySorted.filter((a) => a.status === "scheduled").length;
    return { total, completed, inProgress, scheduled };
  }, [todaySorted]);

  const commissionStats = useMemo(() => {
    const list = commissionsQ.data ?? [];
    const toNum = (v: any) => {
      const n = Number(String(v ?? "0").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };

    const pending = list
      .filter((c) => c.status === "pending")
      .reduce((s, c) => s + toNum(c.commission_amount), 0);

    const paid = list
      .filter((c) => c.status === "paid")
      .reduce((s, c) => s + toNum(c.commission_amount), 0);

    return { pending, paid };
  }, [commissionsQ.data]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meu Dia</h1>
          <p className="text-muted-foreground">Bem-vindo, {userName}!</p>
        </div>
        <p className="text-sm text-red-500">
          Ocorreu um erro ao carregar seus dados. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meu Dia</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {userName}! Aqui estão seus atendimentos e comissões.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Atendimentos hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.total}</div>
            <p className="text-xs text-muted-foreground">Total do dia</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.completed}</div>
            <p className="text-xs text-muted-foreground">Finalizados hoje</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Em atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Agora</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              A receber (mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{"$"}{" "}
              {commissionStats.pending.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Comissões pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Próximo atendimento</CardTitle>
            <CardDescription>O que vem a seguir no seu dia</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : nextAppointment ? (
              <div className="space-y-3">
                <div className="rounded-lg border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="text-lg font-semibold">
                      {nextAppointment.start_time ?? "—"}
                    </p>
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-sm font-medium truncate">
                      {nextAppointment.customer?.name ?? "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nextAppointment.services?.[0]?.name ?? "Serviço"}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Dica: no celular, “Próximo atendimento” e “Agenda de hoje” viram
                  seu fluxo principal.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Sem próximos atendimentos hoje.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Agenda de hoje</CardTitle>
            <CardDescription>Seus atendimentos do dia</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : todaySorted.length ? (
              <div className="space-y-2">
                {todaySorted.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.customer?.name ?? "Cliente"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.services?.[0]?.name ?? "Serviço"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {a.start_time ?? "—"}
                      </p>
                      <Badge className="text-xs" variant={statusBadgeVariant(a.status ?? undefined)}>
                        {statusLabel(a.status ?? undefined)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Sem agendamentos para hoje.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Próximos 7 dias</CardTitle>
            <CardDescription>Visão rápida da sua agenda</CardDescription>
          </CardHeader>
          <CardContent>
            {weekQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <p className="text-sm">
                <span className="font-semibold">{(weekQ.data ?? []).length}</span>{" "}
                atendimentos nos próximos 7 dias.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Comissões do mês
            </CardTitle>
            <CardDescription>Somente seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {commissionsQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                  <span className="font-semibold">
                    R{"$"}{" "}
                    {commissionStats.pending.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagas</span>
                  <span className="font-semibold">
                    R{"$"}{" "}
                    {commissionStats.paid.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function DashboardManagementView({ userName }: { userName?: string }) {
  const [selectedDate] = useState(new Date());
  const currentDateStr = formatYmdLocal(selectedDate);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const {
    data: professionalsSchedule,
    isLoading: isProfLoading,
    isError: isProfError,
  } = useQuery({
    queryKey: ["dashboard-professionals", currentDateStr],
    queryFn: () => getProfessionalsSchedule(currentDateStr),
  });

  const {
    data: recentAppointments,
    isLoading: isRecentLoading,
    isError: isRecentError,
  } = useQuery({
    queryKey: ["dashboard-recent-appointments"],
    queryFn: getRecentAppointments,
  });

  const {
    data: popularServices,
    isLoading: isPopularLoading,
    isError: isPopularError,
  } = useQuery({
    queryKey: ["dashboard-popular-services"],
    queryFn: getPopularServices,
  });

  const {
    data: promotionsApi,
    isLoading: isPromotionsLoading,
    isError: isPromotionsError,
  } = useQuery({
    queryKey: ["dashboard-promotions"],
    queryFn: getDashboardPromotions,
    retry: false,
  });

  const isLoading =
    isSummaryLoading || isProfLoading || isRecentLoading || isPopularLoading;
  const hasError =
    isSummaryError || isProfError || isRecentError || isPopularError;

  const getCurrentDayOfWeek = () => {
    const days = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    return days[selectedDate.getDay()];
  };

  const professionals: Professional[] = useMemo(() => {
    if (!professionalsSchedule) return [];

    return professionalsSchedule.data.map((prof: ApiProfessional) => {
      const rawSchedule = prof.work_schedule;

      const safeSchedule = Array.isArray(rawSchedule)
        ? rawSchedule.filter(
            (d): d is NonNullable<typeof rawSchedule[number]> => !!d
          )
        : [];

      return {
        id: String(prof.id),
        name: prof.name ?? "Sem nome",
        services: prof.specialties ?? [],
        schedule: safeSchedule.map((d) => ({
          dayOfWeek: d.day ?? "",
          isWorkingDay: !!d.isWorkingDay && !d.isDayOff,
          morningStart: d.startTime ?? "",
          morningEnd: d.lunchStart ?? "",
          afternoonStart: d.lunchEnd ?? "",
          afternoonEnd: d.endTime ?? "",
        })),
      };
    });
  }, [professionalsSchedule]);

  const appointmentsByProfessional: Record<string, AppointmentForManagement[]> =
    useMemo(() => {
      if (!professionalsSchedule) return {};

      const map: Record<string, AppointmentForManagement[]> = {};

      professionalsSchedule.data.forEach((prof) => {
        const profId = String(prof.id);
        map[profId] =
          prof.todays_appointments?.map((apt) => ({
            id: apt.id,
            professionalId: profId,
            clientName: apt.customer_name ?? "Cliente",
            service: apt.service_name ?? "Serviço",
            time: apt.time,
            status: apt.status,
          })) ?? [];
      });

      return map;
    }, [professionalsSchedule]);

  const getWorkingHours = (professional: Professional) => {
    const today = getCurrentDayOfWeek();
    const todaySchedule = professional.schedule.find((s) => s.dayOfWeek === today);

    if (!todaySchedule || !todaySchedule.isWorkingDay) return "Folga";

    const periods: string[] = [];
    if (todaySchedule.morningStart && todaySchedule.morningEnd) {
      periods.push(`${todaySchedule.morningStart}-${todaySchedule.morningEnd}`);
    }
    if (todaySchedule.afternoonStart && todaySchedule.afternoonEnd) {
      periods.push(`${todaySchedule.afternoonStart}-${todaySchedule.afternoonEnd}`);
    }

    return periods.join(" | ") || "Sem horário definido";
  };

  const getProfessionalAppointments = (professionalId: string) =>
    appointmentsByProfessional[professionalId] ?? [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "in-progress":
        return "secondary";
      case "completed":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendado";
      case "in-progress":
        return "Em Atendimento";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const stats =
    summary && [
      {
        title: "Total de Clientes",
        value: summary.total_customers.toLocaleString("pt-BR"),
        description:
          summary.customers_change_percent != null
            ? `${summary.customers_change_percent > 0 ? "+" : ""}${summary.customers_change_percent}% em relação ao mês passado`
            : "Sem comparação com o mês anterior",
        icon: Users,
        color: "text-primary",
      },
      {
        title: "Agendamentos Hoje",
        value: summary.appointments_today.toString(),
        description: `${summary.pending_appointments} agendamentos pendentes`,
        icon: Calendar,
        color: "text-secondary",
      },
      {
        title: "Serviços Ativos",
        value: summary.active_services.toString(),
        description: `${summary.service_categories} categorias disponíveis`,
        icon: Scissors,
        color: "text-green-600",
      },
      {
        title: "Receita do Mês",
        value: `R$ ${(summary.month_revenue / 1000).toFixed(1)}k`,
        description:
          summary.revenue_change_percent != null
            ? `${summary.revenue_change_percent > 0 ? "+" : ""}${summary.revenue_change_percent}% em relação ao mês passado`
            : "Sem comparação com o mês anterior",
        icon: TrendingUp,
        color: "text-yellow-500",
      },
    ];

  const promotions: Promotion[] = useMemo(() => {
    if (!promotionsApi) return [];
    return promotionsApi.map((p: ApiPromotion) => ({
      id: String(p.id),
      name: p.name,
      type: p.type,
      discount: p.discount,
      usage: p.usage,
      target: p.target,
      revenue: p.revenue,
      status: p.status,
      endDate: p.endDate ?? "",
    }));
  }, [promotionsApi]);

  const activePromotions = promotions.filter((p) => p.status === "active");
  const totalPromotionRevenue = activePromotions.reduce((sum, p) => sum + p.revenue, 0);
  const totalPromotionUsage = activePromotions.reduce((sum, p) => sum + p.usage, 0);
  const averageConversion =
    activePromotions.length > 0
      ? (
          activePromotions.reduce(
            (sum, p) => sum + (p.target ? (p.usage / p.target) * 100 : 0),
            0
          ) / activePromotions.length
        ).toFixed(1)
      : "0";

  const promotionStats = [
    {
      title: "Promoções Ativas",
      value: activePromotions.length.toString(),
      description: `${promotions.filter((p) => p.status === "scheduled").length} agendadas`,
      icon: Tag,
      color: "text-green-600",
    },
    {
      title: "Uso Total",
      value: totalPromotionUsage.toString(),
      description: "Clientes atingidos este mês",
      icon: Target,
      color: "text-primary",
    },
    {
      title: "Receita Promoções",
      value: `R$ ${(totalPromotionRevenue / 1000).toFixed(1)}k`,
      description: `${activePromotions.length} campanhas gerando receita`,
      icon: TrendingUp,
      color: "text-yellow-500",
    },
    {
      title: "Taxa de Conversão",
      value: `${averageConversion}%`,
      description: "Média de atingimento das metas",
      icon: Megaphone,
      color: "text-secondary",
    },
  ];

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case "discount":
        return "Desconto";
      case "package":
        return "Pacote";
      case "loyalty":
        return "Fidelidade";
      default:
        return type;
    }
  };

  const getPromotionTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "discount":
        return "default";
      case "package":
        return "secondary";
      case "loyalty":
        return "outline";
      default:
        return "default";
    }
  };

  if (isLoading && !summary && !professionalsSchedule) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {userName}! Carregando dados do salão...
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo, {userName}!</p>
        </div>
        <p className="text-sm text-red-500">
          Ocorreu um erro ao carregar os dados do dashboard. Verifique suas permissões ou tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {userName}! Aqui está uma visão geral do salão.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda dos Profissionais - {getCurrentDayOfWeek()}
          </CardTitle>
          <CardDescription>
            Visualize os horários de trabalho e agendamentos de cada profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {professionals.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Nenhum profissional cadastrado ou com agenda para hoje.
              </p>
            )}

            {professionals.map((professional) => {
              const appointments = getProfessionalAppointments(professional.id);
              const workingHours = getWorkingHours(professional);
              const isWorking = workingHours !== "Folga";

              return (
                <div key={professional.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">{professional.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {professional.services.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={isWorking ? "text-foreground" : "text-muted-foreground"}>
                        {workingHours}
                      </span>
                    </div>
                  </div>

                  {isWorking && (
                    <div className="space-y-2 mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Agendamentos de Hoje
                      </p>
                      {appointments.length > 0 ? (
                        <div className="space-y-2">
                          {appointments.map((apt) => (
                            <div
                              key={apt.id}
                              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-sm">{apt.time}</span>
                                <div>
                                  <p className="text-sm font-medium">{apt.clientName}</p>
                                  <p className="text-xs text-muted-foreground">{apt.service}</p>
                                </div>
                              </div>
                              <Badge variant={getStatusBadgeVariant(apt.status)} className="text-xs">
                                {getStatusLabel(apt.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Sem agendamentos para hoje
                        </p>
                      )}
                    </div>
                  )}

                  {!isWorking && (
                    <p className="text-sm text-muted-foreground italic pt-2 border-t">
                      Profissional não trabalha neste dia
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold tracking-tight">Promoções e Campanhas</h2>

          {isPromotionsLoading && (
            <span className="text-xs text-muted-foreground">Carregando promoções...</span>
          )}
          {isPromotionsError && (
            <span className="text-xs text-red-500">
              Não foi possível carregar as promoções (dados opcionais).
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {promotionStats.map((stat) => (
            <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Campanhas Ativas
            </CardTitle>
            <CardDescription>Promoções em andamento e seu desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePromotions.map((promo) => (
                <div key={promo.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">{promo.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant={getPromotionTypeBadgeVariant(promo.type)} className="text-xs">
                          {getPromotionTypeLabel(promo.type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {promo.discount}% OFF
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        R$ {promo.revenue.toLocaleString("pt-BR")}
                      </p>
                      {promo.endDate && (
                        <p className="text-xs text-muted-foreground">
                          Até {new Date(promo.endDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {promo.usage} / {promo.target} usos
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          promo.usage >= promo.target
                            ? "bg-green-600"
                            : promo.usage >= promo.target * 0.7
                            ? "bg-yellow-500"
                            : "bg-primary"
                        }`}
                        style={{
                          width: `${
                            promo.target ? Math.min((promo.usage / promo.target) * 100, 100) : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {!activePromotions.length && !isPromotionsLoading && (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhuma promoção ativa no momento
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Performance das Campanhas
            </CardTitle>
            <CardDescription>Análise de resultados e conversão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {promotions
                .slice()
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 4)
                .map((promo) => {
                  const conversion = promo.target ? (promo.usage / promo.target) * 100 : 0;
                  const isGood = conversion >= 70;
                  const isMedium = conversion >= 40 && conversion < 70;

                  return (
                    <div key={promo.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{promo.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={promo.status === "active" ? "default" : "outline"} className="text-xs">
                              {promo.status === "active" ? "Ativa" : "Encerrada"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {isGood ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <TrendingUp className="h-3 w-3" />
                                  Excelente
                                </span>
                              ) : isMedium ? (
                                <span className="flex items-center gap-1 text-yellow-500">
                                  <Target className="h-3 w-3" />
                                  Regular
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-500">
                                  <TrendingDown className="h-3 w-3" />
                                  Baixa
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">R$ {(promo.revenue / 1000).toFixed(1)}k</p>
                          <p className="text-xs text-muted-foreground">{conversion.toFixed(0)}% conversão</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isGood ? "bg-green-600" : isMedium ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(conversion, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

              {!promotions.length && !isPromotionsLoading && (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhuma campanha para exibir
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Agendamentos Recentes</CardTitle>
            <CardDescription>Últimos agendamentos realizados no salão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(recentAppointments ?? []).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{apt.customer_name ?? "Cliente"}</p>
                    <p className="text-sm text-muted-foreground">{apt.service_name ?? "Serviço"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{apt.time}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(apt.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
              {!recentAppointments?.length && (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum agendamento recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Serviços Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(popularServices ?? []).map((service) => (
                <div key={service.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.count}</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${service.percentage}%` }} />
                  </div>
                </div>
              ))}
              {!popularServices?.length && (
                <p className="text-sm text-muted-foreground italic">
                  Ainda não há serviços populares neste mês
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


const MANAGEMENT_SCREENS: Screen[] = [
  "users",
  "professionals",
  "suppliers",
  "accounts-payable",
  "cashier",
  "item-prices",
  "item-price-histories",
];

export default function Dashboard() {
  const { user } = useAuthUser();
  const { permissions, loading } = usePermissions();

  const isManagement = useMemo(() => {
    if (loading) return false;
    const set = new Set((permissions ?? []).map((p) => p.screen));
    return MANAGEMENT_SCREENS.some((s) => set.has(s));
  }, [permissions, loading]);

  const todayYmd = useMemo(() => formatYmdLocal(new Date()), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Carregando suas permissões...</p>
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isManagement) {
    return <DashboardProfessionalView userName={user?.name} dateYmd={todayYmd} />;
  }

  return <DashboardManagementView userName={user?.name} />;
}