import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package,
  Download,
  FileText,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Period = 'day' | 'week' | 'month';
type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Transferência' | 'Boleto';
type TransactionType = 'entrada' | 'saida';

interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  description: string;
  customer?: string;
  professional?: string;
  service?: string;
  supplier?: string;
  category?: string;
  items: string;
  paymentMethod: PaymentMethod;
  amount: number;
}

// Mock data - substituir por dados reais da API
const mockTransactions: Transaction[] = [
  // ENTRADAS - Receitas de agendamentos finalizados
  {
    id: '1',
    type: 'entrada',
    date: '2025-10-17 09:00',
    description: 'Atendimento - Corte Feminino',
    customer: 'Maria Silva',
    professional: 'João Santos',
    service: 'Corte Feminino',
    items: 'Shampoo Premium',
    paymentMethod: 'PIX',
    amount: 150.00,
  },
  {
    id: '2',
    type: 'entrada',
    date: '2025-10-17 10:30',
    description: 'Atendimento - Coloração',
    customer: 'Ana Costa',
    professional: 'Pedro Lima',
    service: 'Coloração',
    items: 'Tintura, Condicionador',
    paymentMethod: 'Cartão de Crédito',
    amount: 280.00,
  },
  {
    id: '3',
    type: 'entrada',
    date: '2025-10-17 14:00',
    description: 'Atendimento - Corte Masculino',
    customer: 'Carlos Souza',
    professional: 'João Santos',
    service: 'Corte Masculino',
    items: '-',
    paymentMethod: 'Dinheiro',
    amount: 50.00,
  },
  {
    id: '4',
    type: 'entrada',
    date: '2025-10-16 15:00',
    description: 'Atendimento - Hidratação',
    customer: 'Juliana Mendes',
    professional: 'Mariana Alves',
    service: 'Hidratação',
    items: 'Máscara Capilar',
    paymentMethod: 'Cartão de Débito',
    amount: 120.00,
  },
  {
    id: '5',
    type: 'entrada',
    date: '2025-10-15 11:00',
    description: 'Atendimento - Barba',
    customer: 'Roberto Dias',
    professional: 'Pedro Lima',
    service: 'Barba',
    items: 'Óleo de Barba',
    paymentMethod: 'PIX',
    amount: 45.00,
  },
  // SAÍDAS - Comissões de profissionais (contas a pagar)
  {
    id: '6',
    type: 'saida',
    date: '2025-10-17 09:30',
    description: 'Comissão - Corte Feminino',
    supplier: 'João Santos',
    category: 'Comissão',
    items: 'Comissão por serviço',
    paymentMethod: 'PIX',
    amount: 24.00,
  },
  {
    id: '7',
    type: 'saida',
    date: '2025-10-17 10:45',
    description: 'Comissão - Coloração',
    supplier: 'Pedro Lima',
    category: 'Comissão',
    items: 'Comissão por serviço',
    paymentMethod: 'PIX',
    amount: 84.00,
  },
  {
    id: '8',
    type: 'saida',
    date: '2025-10-17 14:15',
    description: 'Comissão - Corte Masculino',
    supplier: 'João Santos',
    category: 'Comissão',
    items: 'Comissão por serviço',
    paymentMethod: 'Dinheiro',
    amount: 15.00,
  },
  // SAÍDAS - Outras despesas de contas a pagar
  {
    id: '9',
    type: 'saida',
    date: '2025-10-17 08:00',
    description: 'Compra de Produtos',
    supplier: 'Distribuidora Beauty Pro',
    category: 'Produtos',
    items: 'Tintura, Shampoo, Condicionador',
    paymentMethod: 'Boleto',
    amount: 450.00,
  },
  {
    id: '10',
    type: 'saida',
    date: '2025-10-15 09:00',
    description: 'Aluguel do Salão',
    supplier: 'Imobiliária Santos',
    category: 'Aluguel',
    items: 'Aluguel mensal',
    paymentMethod: 'Transferência',
    amount: 2500.00,
  },
  {
    id: '11',
    type: 'saida',
    date: '2025-10-14 16:00',
    description: 'Conta de Energia',
    supplier: 'Companhia de Energia',
    category: 'Utilities',
    items: 'Conta de luz',
    paymentMethod: 'PIX',
    amount: 380.00,
  },
  {
    id: '12',
    type: 'saida',
    date: '2025-10-13 10:00',
    description: 'Material de Limpeza',
    supplier: 'Limpeza Total',
    category: 'Limpeza',
    items: 'Produtos de limpeza diversos',
    paymentMethod: 'Dinheiro',
    amount: 150.00,
  },
  {
    id: '13',
    type: 'saida',
    date: '2025-10-12 14:00',
    description: 'Manutenção de Equipamentos',
    supplier: 'Técnico João',
    category: 'Manutenção',
    items: 'Manutenção secadores',
    paymentMethod: 'PIX',
    amount: 200.00,
  },
];

export default function Cashier() {
  const [period, setPeriod] = useState<Period>('day');
  const [selectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

  // Extract unique values for filters
  const uniqueServices = useMemo(() => {
    const services = new Set(
      mockTransactions
        .filter(t => t.type === 'entrada' && t.service)
        .map(t => t.service!)
    );
    return Array.from(services).sort();
  }, []);

  const uniqueProfessionals = useMemo(() => {
    const professionals = new Set(
      mockTransactions
        .filter(t => t.type === 'entrada' && t.professional)
        .map(t => t.professional!)
    );
    return Array.from(professionals).sort();
  }, []);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set(
      mockTransactions
        .filter(t => t.type === 'saida' && t.supplier)
        .map(t => t.supplier!)
    );
    return Array.from(suppliers).sort();
  }, []);

  const uniqueItems = useMemo(() => {
    const items = new Set(
      mockTransactions.flatMap(t => 
        t.items.split(',').map(item => item.trim()).filter(item => item && item !== '-')
      )
    );
    return Array.from(items).sort();
  }, []);

  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(mockTransactions.map(t => t.paymentMethod));
    return Array.from(methods).sort();
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return mockTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionDay = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth(),
        transactionDate.getDate()
      );

      // Period filter
      let periodMatch = false;
      if (period === 'day') {
        periodMatch = transactionDay.getTime() === today.getTime();
      } else if (period === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        periodMatch = transactionDate >= weekAgo;
      } else {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        periodMatch = transactionDate >= monthAgo;
      }

      // Type filter
      const typeMatch = selectedType === 'all' || transaction.type === selectedType;

      // Service filter (only for entradas)
      const serviceMatch = selectedService === 'all' || 
        (transaction.type === 'entrada' && transaction.service === selectedService);

      // Professional filter (only for entradas)
      const professionalMatch = selectedProfessional === 'all' || 
        (transaction.type === 'entrada' && transaction.professional === selectedProfessional);

      // Supplier filter (only for saidas)
      const supplierMatch = selectedSupplier === 'all' || 
        (transaction.type === 'saida' && transaction.supplier === selectedSupplier);

      // Item filter
      const itemMatch = selectedItem === 'all' || 
        transaction.items.split(',').map(i => i.trim()).includes(selectedItem);

      // Payment method filter
      const paymentMatch = selectedPaymentMethod === 'all' || transaction.paymentMethod === selectedPaymentMethod;

      return periodMatch && typeMatch && serviceMatch && professionalMatch && supplierMatch && itemMatch && paymentMatch;
    });
  }, [period, selectedType, selectedService, selectedProfessional, selectedSupplier, selectedItem, selectedPaymentMethod]);

  const summary = useMemo(() => {
    const entradas = filteredTransactions.filter(t => t.type === 'entrada');
    const saidas = filteredTransactions.filter(t => t.type === 'saida');
    
    const totalEntradas = entradas.reduce((sum, t) => sum + t.amount, 0);
    const totalSaidas = saidas.reduce((sum, t) => sum + t.amount, 0);
    const saldo = totalEntradas - totalSaidas;
    
    const transactions = filteredTransactions.length;
    const avgTicketEntradas = entradas.length > 0 ? totalEntradas / entradas.length : 0;
    
    const byPaymentMethod = filteredTransactions.reduce((acc, t) => {
      const key = `${t.type}-${t.paymentMethod}`;
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const byProfessional = entradas.reduce((acc, t) => {
      if (t.professional) {
        acc[t.professional] = (acc[t.professional] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const byService = entradas.reduce((acc, t) => {
      if (t.service) {
        acc[t.service] = (acc[t.service] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const bySupplier = saidas.reduce((acc, t) => {
      if (t.supplier) {
        acc[t.supplier] = (acc[t.supplier] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const byCategory = saidas.reduce((acc, t) => {
      if (t.category) {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const byCustomer = entradas.reduce((acc, t) => {
      if (t.customer) {
        acc[t.customer] = (acc[t.customer] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntradas,
      totalSaidas,
      saldo,
      transactions,
      avgTicketEntradas,
      byPaymentMethod,
      byProfessional,
      byService,
      bySupplier,
      byCategory,
      byCustomer,
    };
  }, [filteredTransactions]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Fluxo de Caixa', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Período: ${getPeriodLabel()}`, 14, 32);
    doc.text(`Total Entradas: R$ ${summary.totalEntradas.toFixed(2)}`, 14, 40);
    doc.text(`Total Saídas: R$ ${summary.totalSaidas.toFixed(2)}`, 14, 48);
    doc.text(`Saldo: R$ ${summary.saldo.toFixed(2)}`, 14, 56);
    doc.text(`Transações: ${summary.transactions}`, 14, 64);

    autoTable(doc, {
      startY: 72,
      head: [['Data', 'Tipo', 'Descrição', 'Origem/Destino', 'Forma Pgto', 'Valor']],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleString('pt-BR'),
        t.type === 'entrada' ? 'Entrada' : 'Saída',
        t.description,
        t.type === 'entrada' ? t.customer || '-' : t.supplier || '-',
        t.paymentMethod,
        `R$ ${t.amount.toFixed(2)}`,
      ]),
    });

    doc.save(`relatorio-caixa-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredTransactions.map(t => ({
        Data: new Date(t.date).toLocaleString('pt-BR'),
        Tipo: t.type === 'entrada' ? 'Entrada' : 'Saída',
        Descrição: t.description,
        Cliente: t.customer || '-',
        Fornecedor: t.supplier || '-',
        Profissional: t.professional || '-',
        Serviço: t.service || '-',
        Categoria: t.category || '-',
        Itens: t.items,
        'Forma de Pagamento': t.paymentMethod,
        'Valor (R$)': t.amount.toFixed(2),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');

    // Add summary sheet
    const summaryData = [
      { Métrica: 'Total Entradas', Valor: `R$ ${summary.totalEntradas.toFixed(2)}` },
      { Métrica: 'Total Saídas', Valor: `R$ ${summary.totalSaidas.toFixed(2)}` },
      { Métrica: 'Saldo', Valor: `R$ ${summary.saldo.toFixed(2)}` },
      { Métrica: 'Número de Transações', Valor: summary.transactions },
      { Métrica: 'Ticket Médio (Entradas)', Valor: `R$ ${summary.avgTicketEntradas.toFixed(2)}` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

    XLSX.writeFile(wb, `relatorio-caixa-${period}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day':
        return 'Hoje';
      case 'week':
        return 'Última Semana';
      case 'month':
        return 'Último Mês';
      default:
        return '';
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Tipo',
      render: (transaction: Transaction) => (
        <Badge variant={transaction.type === 'entrada' ? 'default' : 'destructive'} className={transaction.type === 'entrada' ? 'bg-green-500' : 'bg-red-500'}>
          {transaction.type === 'entrada' ? (
            <><ArrowUpCircle className="h-3 w-3 mr-1" /> Entrada</>
          ) : (
            <><ArrowDownCircle className="h-3 w-3 mr-1" /> Saída</>
          )}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Data/Hora',
      render: (transaction: Transaction) => new Date(transaction.date).toLocaleString('pt-BR'),
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (transaction: Transaction) => transaction.description,
    },
    {
      key: 'origin',
      header: 'Origem/Destino',
      render: (transaction: Transaction) => 
        transaction.type === 'entrada' 
          ? transaction.customer || '-'
          : transaction.supplier || '-',
    },
    {
      key: 'paymentMethod',
      header: 'Forma de Pagamento',
      render: (transaction: Transaction) => transaction.paymentMethod,
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (transaction: Transaction) => (
        <span className={transaction.type === 'entrada' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {transaction.type === 'entrada' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Gestão financeira e relatórios</p>
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

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine os resultados por período e outros critérios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Serviço</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Serviços</SelectItem>
                  {uniqueServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Profissional</label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">Fornecedor</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {uniqueSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Formas</SelectItem>
                  {uniquePaymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {summary.totalEntradas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {summary.totalSaidas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {summary.saldo.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Entradas - Saídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transactions}</div>
            <p className="text-xs text-muted-foreground">Total no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.avgTicketEntradas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Por atendimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
          <TabsTrigger value="transactions">Todas</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="saidas">Saídas</TabsTrigger>
          <TabsTrigger value="payment">Forma Pgto</TabsTrigger>
          <TabsTrigger value="professional">Profissionais</TabsTrigger>
          <TabsTrigger value="supplier">Fornecedores</TabsTrigger>
          <TabsTrigger value="category">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>Lista completa de entradas e saídas do período</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTransactions}
                columns={columns}
                searchPlaceholder="Buscar por descrição, cliente, fornecedor..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas (Entradas)</CardTitle>
              <CardDescription>Receitas provenientes de agendamentos finalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTransactions.filter(t => t.type === 'entrada')}
                columns={columns}
                searchPlaceholder="Buscar por cliente ou serviço..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saidas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas (Saídas)</CardTitle>
              <CardDescription>Despesas de contas pagas aos fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTransactions.filter(t => t.type === 'saida')}
                columns={columns}
                searchPlaceholder="Buscar por fornecedor ou categoria..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Forma de Pagamento</CardTitle>
              <CardDescription>Distribuição de valores por método de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{method}</span>
                    <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Profissional</CardTitle>
              <CardDescription>Performance de cada profissional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byProfessional)
                  .sort(([, a], [, b]) => b - a)
                  .map(([professional, amount]) => (
                    <div key={professional} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{professional}</span>
                      <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Serviço</CardTitle>
              <CardDescription>Serviços mais vendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byService)
                  .sort(([, a], [, b]) => b - a)
                  .map(([service, amount]) => (
                    <div key={service} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{service}</span>
                      <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Cliente</CardTitle>
              <CardDescription>Maiores clientes do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byCustomer)
                  .sort(([, a], [, b]) => b - a)
                  .map(([customer, amount]) => (
                    <div key={customer} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{customer}</span>
                      <span className="text-lg font-bold text-green-600">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Fornecedor</CardTitle>
              <CardDescription>Maiores fornecedores do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.bySupplier).length > 0 ? (
                  Object.entries(summary.bySupplier)
                    .sort(([, a], [, b]) => b - a)
                    .map(([supplier, amount]) => (
                      <div key={supplier} className="flex items-center justify-between border-b pb-2">
                        <span className="font-medium">{supplier}</span>
                        <span className="text-lg font-bold text-red-600">R$ {amount.toFixed(2)}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma despesa com fornecedores no período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>Distribuição de despesas por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byCategory).length > 0 ? (
                  Object.entries(summary.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between border-b pb-2">
                        <span className="font-medium">{category}</span>
                        <span className="text-lg font-bold text-red-600">R$ {amount.toFixed(2)}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma despesa categorizada no período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
