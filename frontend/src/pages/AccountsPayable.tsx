import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/DataTable';
import { Plus, Pencil, Check, Eye, Receipt } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type PaymentMethod = 'dinheiro' | 'debito' | 'credito' | 'pix' | 'boleto';
type AccountStatus = 'pendente' | 'vencida' | 'paga' | 'cancelada';

interface AccountPayable {
  id: string;
  supplierName: string;
  description: string;
  category: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: AccountStatus;
  paymentMethod?: PaymentMethod;
  installments?: number;
  notes: string;
  createdAt: Date;
}

export default function AccountsPayable() {
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    description: '',
    category: '',
    amount: '',
    dueDate: '',
    installments: '1',
    notes: '',
  });
  const [paymentData, setPaymentData] = useState({
    paymentMethod: '' as PaymentMethod,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      setAccounts(accounts.map(a => 
        a.id === editingAccount.id 
          ? { 
              ...a, 
              ...formData, 
              amount: parseFloat(formData.amount),
              dueDate: new Date(formData.dueDate),
              installments: parseInt(formData.installments),
            }
          : a
      ));
      toast({ title: 'Conta atualizada com sucesso!' });
    } else {
      const newAccount: AccountPayable = {
        id: Date.now().toString(),
        supplierName: formData.supplierName,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        dueDate: new Date(formData.dueDate),
        installments: parseInt(formData.installments),
        notes: formData.notes,
        status: 'pendente',
        createdAt: new Date(),
      };
      setAccounts([...accounts, newAccount]);
      toast({ title: 'Conta cadastrada com sucesso!' });
    }
    
    handleCloseDialog();
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) return;
    
    setAccounts(accounts.map(a => 
      a.id === selectedAccount.id 
        ? { 
            ...a, 
            status: 'paga' as AccountStatus,
            paymentMethod: paymentData.paymentMethod,
            paymentDate: new Date(paymentData.paymentDate),
          }
        : a
    ));
    
    toast({ title: 'Pagamento registrado com sucesso!' });
    handleClosePaymentDialog();
  };

  const handleEdit = (account: AccountPayable) => {
    setEditingAccount(account);
    setFormData({
      supplierName: account.supplierName,
      description: account.description,
      category: account.category,
      amount: account.amount.toString(),
      dueDate: format(account.dueDate, 'yyyy-MM-dd'),
      installments: account.installments?.toString() || '1',
      notes: account.notes,
    });
    setIsDialogOpen(true);
  };

  const openPaymentDialog = (account: AccountPayable) => {
    setSelectedAccount(account);
    setPaymentData({
      paymentMethod: '' as PaymentMethod,
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsPaymentDialogOpen(true);
  };

  const openDetailsDialog = (account: AccountPayable) => {
    setSelectedAccount(account);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      supplierName: '',
      description: '',
      category: '',
      amount: '',
      dueDate: '',
      installments: '1',
      notes: '',
    });
  };

  const handleClosePaymentDialog = () => {
    setIsPaymentDialogOpen(false);
    setSelectedAccount(null);
  };

  const getStatusBadge = (status: AccountStatus) => {
    const variants = {
      pendente: 'default',
      vencida: 'destructive',
      paga: 'default',
      cancelada: 'secondary',
    } as const;

    const colors = {
      pendente: 'bg-yellow-500',
      vencida: 'bg-red-500',
      paga: 'bg-green-500',
      cancelada: 'bg-gray-500',
    };

    const labels = {
      pendente: 'Pendente',
      vencida: 'Vencida',
      paga: 'Paga',
      cancelada: 'Cancelada',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const columns = [
    { 
      key: 'dueDate' as keyof AccountPayable, 
      header: 'Vencimento',
      render: (account: AccountPayable) => format(account.dueDate, 'dd/MM/yyyy')
    },
    { key: 'supplierName' as keyof AccountPayable, header: 'Fornecedor' },
    { key: 'description' as keyof AccountPayable, header: 'Descrição' },
    { key: 'category' as keyof AccountPayable, header: 'Categoria' },
    { 
      key: 'amount' as keyof AccountPayable, 
      header: 'Valor',
      render: (account: AccountPayable) => `R$ ${account.amount.toFixed(2)}`
    },
    {
      key: 'status' as keyof AccountPayable,
      header: 'Status',
      render: (account: AccountPayable) => getStatusBadge(account.status),
    },
    {
      key: 'actions' as keyof AccountPayable,
      header: 'Ações',
      render: (account: AccountPayable) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDetailsDialog(account)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {account.status === 'pendente' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(account)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openPaymentDialog(account)}
              >
                <Check className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const totalPendente = accounts
    .filter(a => a.status === 'pendente')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalPago = accounts
    .filter(a => a.status === 'paga')
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gerencie suas despesas e contas</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Total Pendente</p>
          <p className="text-2xl font-bold text-yellow-600">R$ {totalPendente.toFixed(2)}</p>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Total Pago</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</p>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Total Geral</p>
          <p className="text-2xl font-bold">R$ {(totalPendente + totalPago).toFixed(2)}</p>
        </div>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        emptyMessage="Nenhuma conta cadastrada"
      />

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da conta a pagar
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Fornecedor *</Label>
                <Input
                  id="supplierName"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Produtos, Serviços, Aluguel"
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAccount ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={handleClosePaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Informe os dados do pagamento da conta
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            {selectedAccount && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Fornecedor:</strong> {selectedAccount.supplierName}</p>
                <p><strong>Descrição:</strong> {selectedAccount.description}</p>
                <p><strong>Valor:</strong> R$ {selectedAccount.amount.toFixed(2)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => 
                  setPaymentData({ ...paymentData, paymentMethod: value as PaymentMethod })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="debito">Cartão de Débito</SelectItem>
                  <SelectItem value="credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data do Pagamento *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClosePaymentDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={() => setIsDetailsDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fornecedor</Label>
                  <p className="font-medium">{selectedAccount.supplierName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Categoria</Label>
                  <p className="font-medium">{selectedAccount.category}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="font-medium">{selectedAccount.description}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor</Label>
                  <p className="font-medium">R$ {selectedAccount.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vencimento</Label>
                  <p className="font-medium">{format(selectedAccount.dueDate, 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedAccount.status)}</div>
                </div>
                {selectedAccount.installments && selectedAccount.installments > 1 && (
                  <div>
                    <Label className="text-muted-foreground">Parcelas</Label>
                    <p className="font-medium">{selectedAccount.installments}x</p>
                  </div>
                )}
                {selectedAccount.paymentDate && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Data do Pagamento</Label>
                      <p className="font-medium">{format(selectedAccount.paymentDate, 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Forma de Pagamento</Label>
                      <p className="font-medium">{selectedAccount.paymentMethod}</p>
                    </div>
                  </>
                )}
              </div>
              {selectedAccount.notes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="font-medium">{selectedAccount.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
