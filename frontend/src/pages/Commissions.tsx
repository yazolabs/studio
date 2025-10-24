import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  Download,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface CommissionRecord {
  id: string;
  professional: string;
  date: string;
  customer: string;
  service: string;
  servicePrice: number;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  commissionAmount: number;
}

// Mock data - substituir por dados reais
const mockCommissions: CommissionRecord[] = [
  {
    id: '1',
    professional: 'João Santos',
    date: '2025-10-17 09:00',
    customer: 'Maria Silva',
    service: 'Corte Feminino',
    servicePrice: 150.00,
    commissionType: 'percentage',
    commissionValue: 30,
    commissionAmount: 45.00,
  },
  {
    id: '2',
    professional: 'João Santos',
    date: '2025-10-17 14:00',
    customer: 'Carlos Souza',
    service: 'Corte Masculino',
    servicePrice: 50.00,
    commissionType: 'percentage',
    commissionValue: 30,
    commissionAmount: 15.00,
  },
  {
    id: '3',
    professional: 'Pedro Lima',
    date: '2025-10-17 10:30',
    customer: 'Ana Costa',
    service: 'Coloração',
    servicePrice: 280.00,
    commissionType: 'percentage',
    commissionValue: 25,
    commissionAmount: 70.00,
  },
  {
    id: '4',
    professional: 'Pedro Lima',
    date: '2025-10-15 11:00',
    customer: 'Roberto Dias',
    service: 'Barba',
    servicePrice: 45.00,
    commissionType: 'fixed',
    commissionValue: 15,
    commissionAmount: 15.00,
  },
  {
    id: '5',
    professional: 'Mariana Alves',
    date: '2025-10-16 15:00',
    customer: 'Juliana Mendes',
    service: 'Hidratação',
    servicePrice: 120.00,
    commissionType: 'percentage',
    commissionValue: 20,
    commissionAmount: 24.00,
  },
];

export default function Commissions() {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const uniqueProfessionals = useMemo(() => {
    const professionals = new Set(mockCommissions.map(c => c.professional));
    return Array.from(professionals).sort();
  }, []);

  const filteredCommissions = useMemo(() => {
    return mockCommissions.filter((commission) => {
      const commissionDate = new Date(commission.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const professionalMatch = selectedProfessional === 'all' || commission.professional === selectedProfessional;
      const dateMatch = commissionDate >= start && commissionDate <= end;

      return professionalMatch && dateMatch;
    });
  }, [selectedProfessional, startDate, endDate]);

  const summary = useMemo(() => {
    const totalCommissions = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalServices = filteredCommissions.reduce((sum, c) => sum + c.servicePrice, 0);
    const serviceCount = filteredCommissions.length;
    
    const byProfessional = filteredCommissions.reduce((acc, c) => {
      if (!acc[c.professional]) {
        acc[c.professional] = {
          total: 0,
          services: 0,
        };
      }
      acc[c.professional].total += c.commissionAmount;
      acc[c.professional].services += 1;
      return acc;
    }, {} as Record<string, { total: number; services: number }>);

    return {
      totalCommissions,
      totalServices,
      serviceCount,
      byProfessional,
    };
  }, [filteredCommissions]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Comissões', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`, 14, 32);
    doc.text(`Profissional: ${selectedProfessional === 'all' ? 'Todos' : selectedProfessional}`, 14, 40);
    doc.text(`Total em Comissões: R$ ${summary.totalCommissions.toFixed(2)}`, 14, 48);
    doc.text(`Total em Serviços: R$ ${summary.totalServices.toFixed(2)}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Profissional', 'Cliente', 'Serviço', 'Valor Serv.', 'Comissão']],
      body: filteredCommissions.map(c => [
        format(new Date(c.date), 'dd/MM/yyyy HH:mm'),
        c.professional,
        c.customer,
        c.service,
        `R$ ${c.servicePrice.toFixed(2)}`,
        `R$ ${c.commissionAmount.toFixed(2)}`,
      ]),
    });

    doc.save(`comissoes-${startDate}-${endDate}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCommissions.map(c => ({
        Data: format(new Date(c.date), 'dd/MM/yyyy HH:mm'),
        Profissional: c.professional,
        Cliente: c.customer,
        Serviço: c.service,
        'Valor do Serviço': c.servicePrice.toFixed(2),
        'Tipo Comissão': c.commissionType === 'percentage' ? 'Percentual' : 'Fixo',
        'Valor Comissão': c.commissionType === 'percentage' ? `${c.commissionValue}%` : `R$ ${c.commissionValue.toFixed(2)}`,
        'Total Comissão': c.commissionAmount.toFixed(2),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comissões');

    // Add summary sheet
    const summaryData = Object.entries(summary.byProfessional).map(([professional, data]) => ({
      Profissional: professional,
      'Qtd Atendimentos': data.services,
      'Total em Comissões': `R$ ${data.total.toFixed(2)}`,
    }));
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo por Profissional');

    XLSX.writeFile(wb, `comissoes-${startDate}-${endDate}.xlsx`);
  };

  const columns = [
    {
      key: 'date',
      header: 'Data/Hora',
      render: (record: CommissionRecord) => format(new Date(record.date), 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'professional',
      header: 'Profissional',
      render: (record: CommissionRecord) => record.professional,
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (record: CommissionRecord) => record.customer,
    },
    {
      key: 'service',
      header: 'Serviço',
      render: (record: CommissionRecord) => record.service,
    },
    {
      key: 'servicePrice',
      header: 'Valor Serviço',
      render: (record: CommissionRecord) => `R$ ${record.servicePrice.toFixed(2)}`,
    },
    {
      key: 'commission',
      header: 'Comissão',
      render: (record: CommissionRecord) => (
        <div className="space-y-1">
          <div className="font-medium text-green-600">R$ {record.commissionAmount.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">
            {record.commissionType === 'percentage' 
              ? `${record.commissionValue}%` 
              : `Fixo: R$ ${record.commissionValue.toFixed(2)}`}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">Relatório de comissões dos profissionais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o profissional e período para visualizar as comissões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="professional">Profissional</Label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger id="professional">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Profissionais</SelectItem>
                  {uniqueProfessionals.map((professional) => (
                    <SelectItem key={professional} value={professional}>
                      {professional}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {summary.totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Serviços</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.totalServices.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total dos serviços</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.serviceCount}</div>
            <p className="text-xs text-muted-foreground">Total de atendimentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Comissões</CardTitle>
          <CardDescription>Lista completa de comissões por atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredCommissions}
            columns={columns}
            searchPlaceholder="Buscar por profissional, cliente ou serviço..."
            emptyMessage="Nenhuma comissão encontrada no período"
          />
        </CardContent>
      </Card>

      {/* Summary by Professional */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Profissional</CardTitle>
          <CardDescription>Total de comissões agrupadas por profissional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.byProfessional)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([professional, data]) => (
                <div key={professional} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{professional}</p>
                    <p className="text-sm text-muted-foreground">{data.services} atendimento(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">R$ {data.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Média: R$ {(data.total / data.services).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
