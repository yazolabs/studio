import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/DataTable";
import { Plus, Pencil, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAccountsPayableQuery, useCreateAccountPayable, useUpdateAccountPayable, useDeleteAccountPayable, useMarkAccountAsPaid } from "@/hooks/accounts-payable";
import { displayCurrency, formatCurrencyInput } from "@/utils/formatters";
import { CreateAccountPayableDto } from "@/types/account-payable";

export default function AccountsPayable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useAccountsPayableQuery({
    perPage: 200,
  });

  const accounts = data?.data ?? [];

  const createMutation = useCreateAccountPayable();
  const updateMutation = useUpdateAccountPayable(editingId ?? 0);
  const deleteMutation = useDeleteAccountPayable();
  const markPaidMutation = useMarkAccountAsPaid();

  const [formData, setFormData] = useState({
    description: "",
    category: "",
    amount: "",
    due_date: "",
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    payment_method: "",
    payment_date: format(new Date(), "yyyy-MM-dd"),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      description: "",
      category: "",
      amount: "",
      due_date: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (account: any) => {
    setEditingId(account.id);
    setFormData({
      description: account.description ?? "",
      category: account.category ?? "",
      amount: account.amount != null ? displayCurrency(account.amount) : "",
      due_date: account.due_date ?? "",
      notes: account.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const openPaymentDialog = (id: number) => {
    setSelectedId(id);
    setIsPaymentDialogOpen(true);
  };

  const openDetails = (id: number) => {
    setSelectedId(id);
    setIsDetailsDialogOpen(true);
  };

  const parseCurrencyToNumber = (value: string): number => {
    if (!value) return 0;

    const cleaned = value.replace(/[^\d,-]/g, "");
    if (!cleaned) return 0;

    const normalized = cleaned.replace(",", ".");
    const num = parseFloat(normalized);

    return Number.isNaN(num) ? 0 : num;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const amountNumber = parseCurrencyToNumber(formData.amount);

    const amountString = amountNumber.toFixed(2);

    const payload: CreateAccountPayableDto = {
      description: formData.description,
      amount: amountString,
      category: formData.category || null,
      due_date: formData.due_date || null,
      status: "pending",
      supplier_id: null,
      professional_id: null,
      appointment_id: null,
      payment_date: null,
      payment_method: null,
      reference: null,
      notes: formData.notes || null,
    };

    if (editingId) {
      await updateMutation.mutateAsync(payload);
      toast.success("Conta atualizada com sucesso!");
    } else {
      await createMutation.mutateAsync(payload);
      toast.success("Conta criada com sucesso!");
    }

    setIsDialogOpen(false);
  };

  const handlePayment = async (e: any) => {
    e.preventDefault();
    if (!selectedId) return;

    await markPaidMutation.mutateAsync(selectedId);
    toast.success("Pagamento registrado com sucesso!");
    setIsPaymentDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-green-600",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      paid: "Paga",
    };

    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const columns = [
    {
      key: "due_date",
      header: "Vencimento",
      render: (row: any) =>
        row.due_date ? format(parseISO(row.due_date), "dd/MM/yyyy") : "-",
    },
    {
      key: "description",
      header: "Descrição",
    },
    {
      key: "category",
      header: "Categoria",
    },
    {
      key: "amount",
      header: "Valor",
      render: (row: any) => displayCurrency(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => getStatusBadge(row.status),
    },
    {
      key: "actions",
      header: "Ações",
      render: (row: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openDetails(row.id)}>
            <Eye className="h-4 w-4" />
          </Button>

          {row.status === "pending" && (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                onClick={() => openPaymentDialog(row.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const totalPending = useMemo(
    () =>
      accounts
        .filter((a: any) => a.status === "pending")
        .reduce((sum, a) => sum + Number(a.amount), 0),
    [accounts]
  );

  const totalPaid = useMemo(
    () =>
      accounts
        .filter((a: any) => a.status === "paid")
        .reduce((sum, a) => sum + Number(a.amount), 0),
    [accounts]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Controle financeiro e despesas do salão
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border p-4 rounded-lg">
          <p className="text-muted-foreground text-sm">Total Pendente</p>
          <p className="text-2xl font-bold text-yellow-600">
            {displayCurrency(totalPending)}
          </p>
        </div>

        <div className="border p-4 rounded-lg">
          <p className="text-muted-foreground text-sm">Total Pago</p>
          <p className="text-2xl font-bold text-green-600">
            {displayCurrency(totalPaid)}
          </p>
        </div>

        <div className="border p-4 rounded-lg">
          <p className="text-muted-foreground text-sm">Total Geral</p>
          <p className="text-2xl font-bold">
            {displayCurrency(totalPending + totalPaid)}
          </p>
        </div>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        emptyMessage="Nenhuma conta encontrada"
      />

      <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: formatCurrencyInput(e.target.value),
                  })
                }
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={() => setIsPaymentDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select
                value={paymentData.payment_method}
                onValueChange={(v) =>
                  setPaymentData({ ...paymentData, payment_method: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data do Pagamento *</Label>
              <Input
                type="date"
                value={paymentData.payment_date}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, payment_date: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Confirmar Pagamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={() => setIsDetailsDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
          </DialogHeader>

          {selectedId && (
            <div className="space-y-4">
              {(() => {
                const acc = accounts.find((a: any) => a.id === selectedId);
                if (!acc) return null;

                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Descrição</Label>
                      <p className="font-medium">{acc.description}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Categoria</Label>
                      <p className="font-medium">{acc.category}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Valor</Label>
                      <p className="font-medium">{displayCurrency(acc.amount)}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Vencimento</Label>
                      <p className="font-medium">
                        {acc.due_date ? format(parseISO(acc.due_date), "dd/MM/yyyy") : "-"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(acc.status)}</div>
                    </div>

                    {acc.payment_date && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">Pagamento</Label>
                          <p className="font-medium">
                            {format(parseISO(acc.payment_date), "dd/MM/yyyy")}
                          </p>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">Forma</Label>
                          <p className="font-medium">{acc.payment_method}</p>
                        </div>
                      </>
                    )}

                    {acc.notes && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Observações</Label>
                        <p className="font-medium">{acc.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
