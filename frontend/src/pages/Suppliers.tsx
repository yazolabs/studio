import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/DataTable";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Supplier, CreateSupplierDto } from "@/types/supplier";
import { useSuppliersQuery, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/suppliers";
import { formatCNPJ, formatCPF, formatPhone, formatCEP, unmaskDigits } from "@/utils/formatters";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useStatesQuery } from "@/hooks/states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAddressByCep } from "@/services/cepService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const baseSchema = z.object({
  name: z.string().min(1, "Razão Social é obrigatória"),
  trade_name: z.string().optional().or(z.literal("")),
  cnpj: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val) return true;
        const digits = unmaskDigits(val);
        return digits.length === 10 || digits.length === 11;
      },
      { message: "Telefone deve ter 10 ou 11 dígitos" },
    ),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip_code: z.string().optional().or(z.literal("")),
  contact_person: z.string().optional().or(z.literal("")),
  payment_terms: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

const supplierFormSchema = baseSchema.superRefine((data, ctx) => {
  const cnpj = unmaskDigits(data.cnpj || "");
  const cpf = unmaskDigits(data.cpf || "");

  if (!cnpj && !cpf) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe CPF ou CNPJ",
      path: ["cnpj"],
    });
  }

  if (cnpj && cpf) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preencha apenas um dos documentos (CPF ou CNPJ)",
      path: ["cnpj"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preencha apenas um dos documentos (CPF ou CNPJ)",
      path: ["cpf"],
    });
  }
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

const defaultFormValues: SupplierFormValues = {
  name: "",
  trade_name: "",
  cnpj: "",
  cpf: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  contact_person: "",
  payment_terms: "",
  notes: "",
};

export default function Suppliers() {
  const { data: suppliersData, isLoading } = useSuppliersQuery();
  const suppliers = suppliersData ?? [];

  const { data: states, isLoading: statesLoading } = useStatesQuery();

  const createMutation = useCreateSupplier();
  const [editingId, setEditingId] = useState<number | null>(null);
  const updateMutation = useUpdateSupplier(editingId ?? 0);
  const deleteMutation = useDeleteSupplier();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const isMobile = useIsMobile();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: defaultFormValues,
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const watchCnpj = form.watch("cnpj");
  const watchCpf = form.watch("cpf");

  const resetForm = () => {
    form.reset(defaultFormValues);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);

    form.reset({
      name: supplier.name ?? "",
      trade_name: supplier.trade_name ?? "",
      cnpj: supplier.cnpj ? formatCNPJ(supplier.cnpj) : "",
      cpf: supplier.cpf ? formatCPF(supplier.cpf) : "",
      email: supplier.email ?? "",
      phone: supplier.phone ? formatPhone(supplier.phone) : "",
      address: supplier.address ?? "",
      city: supplier.city ?? "",
      state: supplier.state ?? "",
      zip_code: supplier.zip_code ? formatCEP(supplier.zip_code) : "",
      contact_person: supplier.contact_person ?? "",
      payment_terms: supplier.payment_terms ?? "",
      notes: supplier.notes ?? "",
    });

    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Fornecedor excluído com sucesso!",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir fornecedor",
        description: error?.response?.data?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleCepBlur = async (value: string) => {
    const cleanCep = value.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      setIsFetchingCep(true);

      const address = await getAddressByCep(cleanCep);
      if (!address) return;

      const baseAddress = address.address?.trim() ?? "";
      const neighborhood = address.neighborhood?.trim();
      const complement = address.complement?.trim();

      const composedAddress = [
        baseAddress,
        neighborhood && ` - ${neighborhood}`,
        complement && ` - ${complement}`,
      ]
        .filter(Boolean)
        .join("");

      form.setValue("address", composedAddress);
      form.setValue("city", address.city ?? "");
      form.setValue("state", address.state ?? "");
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    } finally {
      setIsFetchingCep(false);
    }
  };

  const onSubmit = async (values: SupplierFormValues) => {
    const payload: CreateSupplierDto = {
      name: values.name,
      trade_name: values.trade_name || null,
      cnpj: unmaskDigits(values.cnpj) || null,
      cpf: unmaskDigits(values.cpf) || null,
      email: values.email || null,
      phone: unmaskDigits(values.phone) || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      zip_code: unmaskDigits(values.zip_code) || null,
      contact_person: values.contact_person || null,
      payment_terms: values.payment_terms || null,
      notes: values.notes || null,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync(payload);
        toast({ title: "Fornecedor atualizado com sucesso!" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Fornecedor cadastrado com sucesso!" });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar fornecedor",
        description: error?.response?.data?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "name", header: "Razão Social" },
    {
      key: "trade_name",
      header: "Nome Fantasia",
      render: (row: Supplier) => row.trade_name || "-",
    },
    {
      key: "document",
      header: "CPF/CNPJ",
      render: (row: Supplier) => {
        if (row.cnpj) return formatCNPJ(row.cnpj);
        if (row.cpf) return formatCPF(row.cpf);
        return "-";
      },
    },
    {
      key: "email",
      header: "Email",
      render: (row: Supplier) => row.email || "-",
    },
    {
      key: "phone",
      header: "Telefone",
      render: (row: Supplier) =>
        row.phone ? formatPhone(row.phone) : "-",
    },
    {
      key: "city",
      header: "Cidade/UF",
      render: (row: Supplier) =>
        row.city || row.state
          ? `${row.city ?? ""}${row.state ? ` / ${row.state}` : ""}`
          : "-",
    },
    {
      key: "actions",
      header: "Ações",
      render: (row: Supplier) => (
        <TooltipProvider delayDuration={1000}>
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(row)}
                  aria-label="Editar fornecedor"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeletingId(row.id);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Excluir fornecedor"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        loading={isLoading}
        emptyMessage="Nenhum fornecedor cadastrado"
        searchPlaceholder="Buscar fornecedores..."
        itemsPerPage={10}
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog();
        }}
      >
        <DialogContent
          className={cn(
            'max-h-[90vh]',
            isMobile ? 'max-w-[95vw]' : 'max-w-2xl',
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do fornecedor
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* DADOS FISCAIS */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Dados fiscais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Razão Social{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Beleza & Cia Comércio de Cosméticos LTDA"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trade_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Fantasia</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Beleza & Cia"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          CNPJ{" "}
                          <span className="text-xs text-muted-foreground">
                            (preencha apenas um: CPF ou CNPJ)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00.000.000/0000-00"
                            onChange={(e) =>
                              field.onChange(
                                formatCNPJ(e.target.value),
                              )
                            }
                            disabled={!!unmaskDigits(watchCpf)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="000.000.000-00"
                            onChange={(e) =>
                              field.onChange(
                                formatCPF(e.target.value),
                              )
                            }
                            disabled={!!unmaskDigits(watchCnpj)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* CONTATO */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="contato@fornecedor.com.br"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(00) 00000-0000"
                            onChange={(e) =>
                              field.onChange(
                                formatPhone(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Pessoa de Contato</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nome da pessoa responsável"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ENDEREÇO */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Endereço
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4">
                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            CEP{" "}
                            {isFetchingCep && (
                              <span className="text-xs text-muted-foreground">
                                (buscando endereço...)
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="00000-000"
                              onChange={(e) => {
                                const formatted = formatCEP(
                                  e.target.value,
                                );
                                field.onChange(formatted);

                                const clean =
                                  formatted.replace(/\D/g, "");
                                if (clean.length !== 8) {
                                  form.setValue("address", "");
                                  form.setValue("city", "");
                                  form.setValue("state", "");
                                }
                              }}
                              onBlur={(e) =>
                                handleCepBlur(e.target.value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: Recife"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={statesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states?.map((s) => (
                                <SelectItem
                                  key={s.id}
                                  value={s.uf}
                                >
                                  {s.name} ({s.uf})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Rua, número, bairro, complemento"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* CONDIÇÕES COMERCIAIS */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Condições comerciais
                </h3>

                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condições de Pagamento</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Ex: 28 dias, 30 dias, 50% entrada + 50% na entrega..."
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Observações gerais sobre o fornecedor"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar"
                    : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação
              não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  handleDelete(deletingId);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
