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
import { MoreHorizontal, Plus, Pencil, Check, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAccountsPayableQuery, useCreateAccountPayable, useUpdateAccountPayable, useDeleteAccountPayable, useMarkAccountAsPaid } from "@/hooks/accounts-payable";
import { displayCurrency, formatCurrencyInput } from "@/utils/formatters";
import { CreateAccountPayableDto } from "@/types/account-payable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function AccountsPayable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMobile = useIsMobile();

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

  const today = format(new Date(), "yyyy-MM-dd");

  const [paymentData, setPaymentData] = useState({
    payment_method: "",
    payment_date: today,
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
      amount:
        account.amount != null
          ? formatCurrencyInput(String(account.amount))
          : "",
      due_date: account.due_date ?? "",
      notes: account.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const openPaymentDialog = (id: number) => {
    setSelectedId(id);
    setPaymentData({
      payment_method: "",
      payment_date: today,
    });
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSaving || createMutation.isPending || updateMutation.isPending) {
      return;
    }

    setIsSaving(true);

    try {
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
      setEditingId(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          "Erro ao salvar conta. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedId) return;

    if (markPaidMutation.isPending) return;

    try {
      await markPaidMutation.mutateAsync(selectedId);
      toast.success("Pagamento registrado com sucesso!");
      setIsPaymentDialogOpen(false);
      setSelectedId(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          "Erro ao registrar pagamento. Tente novamente."
      );
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta conta?"
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Conta excluída com sucesso!");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          "Erro ao excluir conta. Tente novamente."
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500 text-yellow-50",
      paid: "bg-green-600 text-green-50",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      paid: "Paga",
    };

    return (
      <Badge className={colors[status] ?? ""}>{labels[status] ?? status}</Badge>
    );
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
      render: (row: any) =>
        displayCurrency(Number(row.amount) || 0),
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size={isMobile ? "sm" : "icon"}
              variant="ghost"
              className="h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>

            <DropdownMenuItem onClick={() => openDetails(row.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>

            {row.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => openEdit(row)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => openPaymentDialog(row.id)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Registrar pagamento
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              disabled={deleteMutation.isPending}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Controle financeiro e despesas do salão
          </p>
        </div>

        <Button
          onClick={openCreate}
          className={cn("shadow-md", isMobile && "w-full")}
        >
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
        loading={isLoading}
        emptyMessage="Nenhuma conta encontrada"
        searchPlaceholder="Buscar contas..."
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setIsSaving(false);
            setFormData({
              description: "",
              category: "",
              amount: "",
              due_date: "",
              notes: "",
            });
          }
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh]",
            isMobile ? "max-w-[95vw]" : "max-w-2xl"
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Informações principais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Descrição <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    required
                    placeholder="Ex: Aluguel do salão"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Categoria <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    required
                    placeholder="Ex: Fixas, Fornecedores..."
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Valores e vencimento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Valor (R$) <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Data de Vencimento{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        due_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Observações
              </h3>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Informações adicionais sobre a conta (opcional)"
                />
              </div>
            </section>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDialogOpen(false)}
                disabled={
                  isSaving ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {editingId ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          setIsPaymentDialogOpen(open);
          if (!open) {
            setSelectedId(null);
            setPaymentData({
              payment_method: "",
              payment_date: today,
            });
          }
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh]",
            isMobile ? "max-w-[95vw]" : "max-w-md"
          )}
        >
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePayment} className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Dados do pagamento
              </h3>

              <div className="space-y-2">
                <Label>
                  Forma de Pagamento{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(v) =>
                    setPaymentData({
                      ...paymentData,
                      payment_method: v,
                    })
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
                <Label>
                  Data do Pagamento{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      payment_date: e.target.value,
                    })
                  }
                />
              </div>
            </section>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={markPaidMutation.isPending}>
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) {
            setSelectedId(null);
          }
        }}
      >
        <DialogContent
          className={cn(
            'max-h-[90vh]',
            isMobile ? 'max-w-[95vw]' : 'max-w-2xl',
          )}
        >
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
          </DialogHeader>

          {selectedId && (
            <div className="space-y-4">
              {(() => {
                const acc = accounts.find((a: any) => a.id === selectedId);
                if (!acc) return null;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Descrição
                      </Label>
                      <p className="font-medium">{acc.description}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Categoria
                      </Label>
                      <p className="font-medium">{acc.category}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Valor
                      </Label>
                      <p className="font-medium">
                        {displayCurrency(Number(acc.amount) || 0)}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Vencimento
                      </Label>
                      <p className="font-medium">
                        {acc.due_date
                          ? format(
                              parseISO(acc.due_date),
                              "dd/MM/yyyy"
                            )
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Status
                      </Label>
                      <div className="mt-1">
                        {getStatusBadge(acc.status)}
                      </div>
                    </div>

                    {acc.payment_date && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">
                            Pagamento
                          </Label>
                          <p className="font-medium">
                            {format(
                              parseISO(acc.payment_date),
                              "dd/MM/yyyy"
                            )}
                          </p>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">
                            Forma
                          </Label>
                          <p className="font-medium">
                            {acc.payment_method}
                          </p>
                        </div>
                      </>
                    )}

                    {acc.notes && (
                      <div className="sm:col-span-2">
                        <Label className="text-muted-foreground">
                          Observações
                        </Label>
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
