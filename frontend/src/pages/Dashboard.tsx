import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Scissors, TrendingUp, Clock, Tag, Megaphone, TrendingDown, Target } from 'lucide-react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

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

interface Appointment {
  id: string;
  professionalId: string;
  clientName: string;
  service: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

const mockProfessionals: Professional[] = [
  {
    id: '1',
    name: 'Maria Santos',
    services: ['Corte Feminino', 'Escova', 'Coloração'],
    schedule: [
      { dayOfWeek: 'Segunda-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
      { dayOfWeek: 'Terça-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
      { dayOfWeek: 'Quarta-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
      { dayOfWeek: 'Quinta-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
      { dayOfWeek: 'Sexta-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
      { dayOfWeek: 'Sábado', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '', afternoonEnd: '' },
      { dayOfWeek: 'Domingo', isWorkingDay: false, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
    ],
  },
  {
    id: '2',
    name: 'João Pedro',
    services: ['Corte Masculino'],
    schedule: [
      { dayOfWeek: 'Segunda-feira', isWorkingDay: true, morningStart: '09:00', morningEnd: '13:00', afternoonStart: '14:00', afternoonEnd: '19:00' },
      { dayOfWeek: 'Terça-feira', isWorkingDay: true, morningStart: '09:00', morningEnd: '13:00', afternoonStart: '14:00', afternoonEnd: '19:00' },
      { dayOfWeek: 'Quarta-feira', isWorkingDay: true, morningStart: '09:00', morningEnd: '13:00', afternoonStart: '14:00', afternoonEnd: '19:00' },
      { dayOfWeek: 'Quinta-feira', isWorkingDay: true, morningStart: '09:00', morningEnd: '13:00', afternoonStart: '14:00', afternoonEnd: '19:00' },
      { dayOfWeek: 'Sexta-feira', isWorkingDay: true, morningStart: '09:00', morningEnd: '13:00', afternoonStart: '14:00', afternoonEnd: '19:00' },
      { dayOfWeek: 'Sábado', isWorkingDay: false, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
      { dayOfWeek: 'Domingo', isWorkingDay: false, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
    ],
  },
  {
    id: '3',
    name: 'Paula Costa',
    services: ['Manicure', 'Pedicure'],
    schedule: [
      { dayOfWeek: 'Segunda-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:00', afternoonEnd: '17:00' },
      { dayOfWeek: 'Terça-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:00', afternoonEnd: '17:00' },
      { dayOfWeek: 'Quarta-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:00', afternoonEnd: '17:00' },
      { dayOfWeek: 'Quinta-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:00', afternoonEnd: '17:00' },
      { dayOfWeek: 'Sexta-feira', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:00', afternoonEnd: '17:00' },
      { dayOfWeek: 'Sábado', isWorkingDay: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '', afternoonEnd: '' },
      { dayOfWeek: 'Domingo', isWorkingDay: false, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
    ],
  },
];

const mockAppointments: Appointment[] = [
  { id: '1', professionalId: '1', clientName: 'Ana Silva', service: 'Corte Feminino', time: '09:00', status: 'scheduled' },
  { id: '2', professionalId: '1', clientName: 'Beatriz Lima', service: 'Escova', time: '11:00', status: 'in-progress' },
  { id: '3', professionalId: '2', clientName: 'Carlos Souza', service: 'Corte Masculino', time: '10:00', status: 'scheduled' },
  { id: '4', professionalId: '3', clientName: 'Diana Costa', service: 'Manicure', time: '08:30', status: 'completed' },
  { id: '5', professionalId: '3', clientName: 'Eduardo Mendes', service: 'Pedicure', time: '14:00', status: 'scheduled' },
];

interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'package' | 'loyalty';
  discount: number;
  usage: number;
  target: number;
  revenue: number;
  status: 'active' | 'scheduled' | 'expired';
  endDate: string;
}

const mockPromotions: Promotion[] = [
  { 
    id: '1', 
    name: 'Desconto Quinta Premium', 
    type: 'discount', 
    discount: 20, 
    usage: 45, 
    target: 100, 
    revenue: 3240,
    status: 'active',
    endDate: '2025-10-31'
  },
  { 
    id: '2', 
    name: 'Pacote Noivas', 
    type: 'package', 
    discount: 15, 
    usage: 12, 
    target: 20, 
    revenue: 5800,
    status: 'active',
    endDate: '2025-12-31'
  },
  { 
    id: '3', 
    name: 'Cliente Fidelidade', 
    type: 'loyalty', 
    discount: 10, 
    usage: 78, 
    target: 50, 
    revenue: 2340,
    status: 'active',
    endDate: '2025-12-31'
  },
  { 
    id: '4', 
    name: 'Black Friday 2024', 
    type: 'discount', 
    discount: 50, 
    usage: 156, 
    target: 150, 
    revenue: 12400,
    status: 'expired',
    endDate: '2024-11-29'
  },
];

export default function Dashboard() {
  const { user } = useAuthUser();
  const [selectedDate] = useState(new Date());
  
  const getCurrentDayOfWeek = () => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[selectedDate.getDay()];
  };

  const getWorkingHours = (professional: Professional) => {
    const today = getCurrentDayOfWeek();
    const todaySchedule = professional.schedule.find(s => s.dayOfWeek === today);
    
    if (!todaySchedule || !todaySchedule.isWorkingDay) {
      return 'Folga';
    }
    
    const periods = [];
    if (todaySchedule.morningStart && todaySchedule.morningEnd) {
      periods.push(`${todaySchedule.morningStart}-${todaySchedule.morningEnd}`);
    }
    if (todaySchedule.afternoonStart && todaySchedule.afternoonEnd) {
      periods.push(`${todaySchedule.afternoonStart}-${todaySchedule.afternoonEnd}`);
    }
    
    return periods.join(' | ') || 'Sem horário definido';
  };

  const getProfessionalAppointments = (professionalId: string) => {
    return mockAppointments.filter(apt => apt.professionalId === professionalId);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in-progress': return 'secondary';
      case 'completed': return 'outline';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'in-progress': return 'Em Atendimento';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const activePromotions = mockPromotions.filter(p => p.status === 'active');
  const totalPromotionRevenue = activePromotions.reduce((sum, p) => sum + p.revenue, 0);
  const totalPromotionUsage = activePromotions.reduce((sum, p) => sum + p.usage, 0);
  const averageConversion = activePromotions.length > 0 
    ? (activePromotions.reduce((sum, p) => sum + (p.usage / p.target * 100), 0) / activePromotions.length).toFixed(1)
    : 0;

  const stats = [
    {
      title: 'Total de Clientes',
      value: '1,234',
      description: '+12% em relação ao mês passado',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Agendamentos Hoje',
      value: '28',
      description: '5 agendamentos pendentes',
      icon: Calendar,
      color: 'text-secondary',
    },
    {
      title: 'Serviços Ativos',
      value: '45',
      description: '8 categorias disponíveis',
      icon: Scissors,
      color: 'text-success',
    },
    {
      title: 'Receita do Mês',
      value: 'R$ 45.2k',
      description: '+18% em relação ao mês passado',
      icon: TrendingUp,
      color: 'text-warning',
    },
  ];

  const promotionStats = [
    {
      title: 'Promoções Ativas',
      value: activePromotions.length.toString(),
      description: `${mockPromotions.filter(p => p.status === 'scheduled').length} agendadas`,
      icon: Tag,
      color: 'text-success',
    },
    {
      title: 'Uso Total',
      value: totalPromotionUsage.toString(),
      description: 'Clientes atingidos este mês',
      icon: Target,
      color: 'text-primary',
    },
    {
      title: 'Receita Promoções',
      value: `R$ ${(totalPromotionRevenue / 1000).toFixed(1)}k`,
      description: `${activePromotions.length} campanhas gerando receita`,
      icon: TrendingUp,
      color: 'text-warning',
    },
    {
      title: 'Taxa de Conversão',
      value: `${averageConversion}%`,
      description: 'Média de atingimento das metas',
      icon: Megaphone,
      color: 'text-secondary',
    },
  ];

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'discount': return 'Desconto';
      case 'package': return 'Pacote';
      case 'loyalty': return 'Fidelidade';
      default: return type;
    }
  };

  const getPromotionTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'discount': return 'default';
      case 'package': return 'secondary';
      case 'loyalty': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user?.name}! Aqui está uma visão geral do salão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

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
            {mockProfessionals.map((professional) => {
              const appointments = getProfessionalAppointments(professional.id);
              const workingHours = getWorkingHours(professional);
              const isWorking = workingHours !== 'Folga';
              
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
                      <span className={isWorking ? 'text-foreground' : 'text-muted-foreground'}>
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

      {/* Indicadores de Promoções e Campanhas */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Promoções e Campanhas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {promotionStats.map((stat) => (
            <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
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
            <CardDescription>
              Promoções em andamento e seu desempenho
            </CardDescription>
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
                      <p className="text-sm font-medium text-success">
                        R$ {promo.revenue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Até {new Date(promo.endDate).toLocaleDateString('pt-BR')}
                      </p>
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
                            ? 'bg-success' 
                            : promo.usage >= promo.target * 0.7 
                            ? 'bg-warning' 
                            : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min((promo.usage / promo.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {activePromotions.length === 0 && (
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
            <CardDescription>
              Análise de resultados e conversão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPromotions
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 4)
                .map((promo) => {
                  const conversion = (promo.usage / promo.target) * 100;
                  const isGood = conversion >= 70;
                  const isMedium = conversion >= 40 && conversion < 70;
                  
                  return (
                    <div key={promo.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{promo.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={promo.status === 'active' ? 'default' : 'outline'} 
                              className="text-xs"
                            >
                              {promo.status === 'active' ? 'Ativa' : 'Encerrada'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {isGood ? (
                                <span className="flex items-center gap-1 text-success">
                                  <TrendingUp className="h-3 w-3" />
                                  Excelente
                                </span>
                              ) : isMedium ? (
                                <span className="flex items-center gap-1 text-warning">
                                  <Target className="h-3 w-3" />
                                  Regular
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-destructive">
                                  <TrendingDown className="h-3 w-3" />
                                  Baixa
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            R$ {(promo.revenue / 1000).toFixed(1)}k
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conversion.toFixed(0)}% conversão
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isGood ? 'bg-success' : isMedium ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(conversion, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Agendamentos Recentes</CardTitle>
            <CardDescription>
              Últimos agendamentos realizados no salão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">Cliente {i}</p>
                    <p className="text-sm text-muted-foreground">Corte de Cabelo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">14:00</p>
                    <p className="text-xs text-muted-foreground">Hoje</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Serviços Populares</CardTitle>
            <CardDescription>
              Serviços mais agendados este mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Corte de Cabelo', count: 156, percentage: 35 },
                { name: 'Manicure', count: 124, percentage: 28 },
                { name: 'Massagem', count: 98, percentage: 22 },
                { name: 'Depilação', count: 67, percentage: 15 },
              ].map((service) => (
                <div key={service.name}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.count}</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
