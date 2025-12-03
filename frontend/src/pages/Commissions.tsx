import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { DollarSign, TrendingUp, Users, Download, FileText, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { useCommissionsQuery, useMarkCommissionAsPaid } from '@/hooks/commissions';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import type { Commission } from '@/types/commission';
import { displayCurrency } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Commissions() {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [start_date, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [end_date, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const isMobile = useIsMobile();

  const { data, isLoading } = useCommissionsQuery({
    start_date,
    end_date,
    professional_id:
      selectedProfessional !== 'all'
        ? Number(selectedProfessional)
        : undefined,
  });

  const { mutate: markAsPaid, isPending: isMarkingPaid } =
    useMarkCommissionAsPaid();

  const commissions = data?.data ?? [];

  const uniqueProfessionals = useMemo(() => {
    const names = new Map<number, string>();
    commissions.forEach((c) => {
      if (c.professional) names.set(c.professional.id, c.professional.name);
    });
    return Array.from(names.entries());
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const byProf =
        selectedProfessional === 'all' ||
        c.professional?.id === Number(selectedProfessional);

      return byProf;
    });
  }, [commissions, selectedProfessional]);

  const summary = useMemo(() => {
    const totalCommissions = filteredCommissions.reduce(
      (sum, c) => sum + Number(c.commission_amount || 0),
      0
    );
    const totalServices = filteredCommissions.reduce(
      (sum, c) => sum + Number(c.service_price || 0),
      0
    );
    const serviceCount = filteredCommissions.length;

    const byProfessional = filteredCommissions.reduce((acc, c) => {
      const name = c.professional?.name ?? 'Sem profissional';
      if (!acc[name]) acc[name] = { total: 0, services: 0 };
      acc[name].total += Number(c.commission_amount || 0);
      acc[name].services += 1;
      return acc;
    }, {} as Record<string, { total: number; services: number }>);

    return { totalCommissions, totalServices, serviceCount, byProfessional };
  }, [filteredCommissions]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Comissões', 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Período: ${format(new Date(start_date), 'dd/MM/yyyy')} a ${format(
        new Date(end_date),
        'dd/MM/yyyy'
      )}`,
      14,
      32
    );
    doc.text(
      `Profissional: ${
        selectedProfessional === 'all' ? 'Todos' : selectedProfessional
      }`,
      14,
      40
    );
    doc.text(
      `Total em Comissões: ${displayCurrency(summary.totalCommissions)}`,
      14,
      48
    );
    doc.text(
      `Total em Serviços: ${displayCurrency(summary.totalServices)}`,
      14,
      56
    );

    autoTable(doc, {
      startY: 65,
      head: [
        ['Data', 'Profissional', 'Cliente', 'Serviço', 'Valor Serv.', 'Comissão'],
      ],
      body: filteredCommissions.map((c) => [
        c.date ? format(parseISO(c.date), 'dd/MM/yyyy HH:mm') : '-',
        c.professional?.name ?? '-',
        c.customer?.name ?? '-',
        c.service?.name ?? '-',
        displayCurrency(Number(c.service_price || 0)),
        displayCurrency(Number(c.commission_amount || 0)),
      ]),
    });

    doc.save(`comissoes-${start_date}-${end_date}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCommissions.map((c) => ({
        Data: c.date ? format(parseISO(c.date), 'dd/MM/yyyy HH:mm') : '-',
        Profissional: c.professional?.name ?? '-',
        Cliente: c.customer?.name ?? '-',
        Serviço: c.service?.name ?? '-',
        'Valor do Serviço': displayCurrency(Number(c.service_price || 0)),
        'Tipo Comissão':
          c.commission_type === 'percentage' ? 'Percentual' : 'Fixa',
        'Valor Comissão':
          c.commission_type === 'percentage'
            ? `${c.commission_value}%`
            : displayCurrency(Number(c.commission_value || 0)),
        'Total Comissão': displayCurrency(
          Number(c.commission_amount || 0)
        ),
        Status: c.status === 'paid' ? 'Paga' : 'Pendente',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comissões');

    const summaryData = Object.entries(summary.byProfessional).map(
      ([prof, data]) => ({
        Profissional: prof,
        'Qtd Atendimentos': data.services,
        'Total em Comissões': displayCurrency(data.total),
      })
    );
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo por Profissional');
    XLSX.writeFile(wb, `comissoes-${start_date}-${end_date}.xlsx`);
  };

  const handleMarkAsPaid = (id: number) => {
    markAsPaid(id, {
      onSuccess: () => toast.success('Comissão marcada como paga!'),
      onError: () => toast.error('Erro ao marcar comissão como paga.'),
    });
  };

  const columns = [
    {
      key: 'date',
      header: 'Data/Hora',
      render: (c: Commission) =>
        c.date ? format(parseISO(c.date), 'dd/MM/yyyy HH:mm') : '-',
    },
    {
      key: 'professional',
      header: 'Profissional',
      render: (c: Commission) => c.professional?.name ?? '-',
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (c: Commission) => c.customer?.name ?? '-',
    },
    {
      key: 'service',
      header: 'Serviço',
      render: (c: Commission) => c.service?.name ?? '-',
    },
    {
      key: 'service_price',
      header: 'Valor Serviço',
      render: (c: Commission) =>
        displayCurrency(Number(c.service_price || 0)),
    },
    {
      key: 'commission_amount',
      header: 'Comissão',
      render: (c: Commission) => (
        <div className="space-y-1">
          <div className="font-medium text-green-600">
            {displayCurrency(Number(c.commission_amount || 0))}
          </div>
          <div className="text-xs text-muted-foreground">
            {c.commission_type === 'percentage'
              ? `${c.commission_value}%`
              : `Fixo: ${displayCurrency(
                  Number(c.commission_value || 0)
                )}`}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Commission) =>
        c.status === 'paid' ? (
          <span className="text-green-600 font-medium">Paga</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isMarkingPaid}
            onClick={() => handleMarkAsPaid(c.id)}
          >
            <Check className="w-4 h-4 mr-1" />
            Marcar como Paga
          </Button>
        ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">
            Relatório de comissões dos profissionais
          </p>
        </div>
        <div
          className={cn(
            'flex gap-2',
            isMobile && 'w-full flex-col',
          )}
        >
          <Button
            variant="outline"
            onClick={exportToPDF}
            className={cn(isMobile && 'w-full')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            className={cn(isMobile && 'w-full')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecione o profissional e período para visualizar as comissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select
                value={selectedProfessional}
                onValueChange={setSelectedProfessional}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueProfessionals.map(([id, name]) => (
                    <SelectItem key={id} value={String(id)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={start_date}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={end_date}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Comissões
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {displayCurrency(summary.totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Serviços
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayCurrency(summary.totalServices)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total dos serviços
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.serviceCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de atendimentos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Comissões</CardTitle>
          <CardDescription>
            Lista completa de comissões por atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredCommissions}
            columns={columns}
            searchPlaceholder="Buscar por profissional, cliente ou serviço..."
            emptyMessage="Nenhuma comissão encontrada"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo por Profissional</CardTitle>
          <CardDescription>
            Total de comissões agrupadas por profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.byProfessional)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([prof, data]) => {
                const media =
                  data.services > 0 ? data.total / data.services : 0;

                return (
                  <div
                    key={prof}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div>
                      <p className="font-medium">{prof}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.services} atendimento(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {displayCurrency(data.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Média: {displayCurrency(media)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
