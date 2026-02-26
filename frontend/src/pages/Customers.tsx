import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { useCustomersQuery, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/customers";
import { useStatesQuery } from "@/hooks/states";
import type { CreateCustomerDto, Customer } from "@/types/customer";
import { formatCEP, formatCPF, formatPhone } from "@/utils/formatters";
import { getAddressByCep } from "@/services/cepService";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const customerSchema = z.object({
  name: z.string().trim().min(3, { message: "Informe um nome válido" }).max(160),
  cpf: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email({ message: "E-mail inválido" }).or(z.literal("")).optional().transform((val) => (val === "" ? undefined : val)),
  phone: z.string().trim().min(1, { message: "Telefone/WhatsApp é obrigatório" }),
  alternate_phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  number: z.string().trim().optional().or(z.literal("")),
  complement: z.string().trim().optional().or(z.literal("")),
  neighborhood: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  zip_code: z.string().trim().optional().or(z.literal("")),
  birth_date: z.string().nullable().optional().transform((val) => (val === "" ? null : val)),
  gender: z.enum(["male", "female", "other", "not_informed"]),
  contact_preferences: z.array(z.enum(["email", "sms", "whatsapp"])).default(["email"]),
  accepts_marketing: z.boolean().default(true),
  active: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function Customers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const { toast } = useToast();
  const { can, canAccess } = usePermission();
  const isMobile = useIsMobile();

  const { data: customersData, isLoading } = useCustomersQuery();
  const { data: states, isLoading: statesLoading } = useStatesQuery();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(editingCustomer?.id ?? 0);
  const deleteMutation = useDeleteCustomer();

  const isProfessionalView = useMemo(() => {
    return (
      canAccess("customers") &&
      !canAccess("cashier") &&
      !canAccess("accounts-payable") &&
      !canAccess("suppliers") &&
      !canAccess("item-prices") &&
      !canAccess("item-price-histories") &&
      !canAccess("professionals") &&
      !canAccess("users")
    );
  }, [canAccess]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      alternate_phone: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      birth_date: "",
      gender: "not_informed",
      contact_preferences: ["email"],
      accepts_marketing: true,
      active: true,
      notes: "",
    },
  });

  const customers = customersData?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resetForm = () =>
    form.reset({
      name: "",
      cpf: "",
      email: "",
      phone: "",
      alternate_phone: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      birth_date: "",
      gender: "not_informed",
      contact_preferences: ["email"],
      accepts_marketing: true,
      active: true,
      notes: "",
    });

  const onSubmit = (values: CustomerFormData) => {
    const payload: CreateCustomerDto = {
      name: values.name,
      gender: values.gender,
      cpf: values.cpf || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      alternate_phone: values.alternate_phone || undefined,
      address: values.address || undefined,
      number: values.number || undefined,
      complement: values.complement || undefined,
      neighborhood: values.neighborhood || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      zip_code: values.zip_code || undefined,
      birth_date: values.birth_date || undefined,
      notes: values.notes || undefined,
      contact_preferences: values.contact_preferences,
      accepts_marketing: values.accepts_marketing,
      active: values.active,
    };

    const mutation = editingCustomer ? updateMutation : createMutation;

    mutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: editingCustomer ? "Cliente atualizado!" : "Cliente criado!",
        });
        handleCloseDialog();
      },
      onError: () =>
        toast({ title: "Erro ao salvar cliente", variant: "destructive" }),
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);

    const safeGender = (["male", "female", "other", "not_informed"] as const).includes(
      customer.gender as any,
    )
      ? (customer.gender as any)
      : "not_informed";

    form.reset({
      name: customer.name ?? "",
      cpf: customer.cpf ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      alternate_phone: customer.alternate_phone ?? "",
      address: customer.address ?? "",
      number: customer.number ?? "",
      complement: customer.complement ?? "",
      neighborhood: customer.neighborhood ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
      zip_code: customer.zip_code ?? "",
      birth_date: customer.birth_date ?? "",
      gender: safeGender,
      contact_preferences: (customer.contact_preferences ?? ["email"]) as any,
      accepts_marketing: customer.accepts_marketing ?? true,
      active: customer.active ?? true,
      notes: customer.notes ?? "",
    });

    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Cliente excluído com sucesso!" });
        setDeleteDialogOpen(false);
        setDeletingId(null);
      },
      onError: () =>
        toast({ title: "Erro ao excluir cliente", variant: "destructive" }),
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
    resetForm();
  };

  const columns = useMemo(() => {
    if (isProfessionalView) {
      return [{ key: "name", header: "Nome", render: (c: Customer) => c.name }];
    }

    const base = [
      { key: "name", header: "Nome", render: (c: Customer) => c.name },
      {
        key: "email",
        header: "Email",
        render: (c: Customer) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm break-all">{c.email}</span>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Telefone",
        render: (c: Customer) => (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{c.phone}</span>
          </div>
        ),
      },
      {
        key: "accepts_marketing",
        header: "Marketing",
        render: (c: Customer) => (
          <Badge variant={c.accepts_marketing ? "default" : "outline"}>
            {c.accepts_marketing ? "Aceita" : "Não aceita"}
          </Badge>
        ),
      },
      {
        key: "active",
        header: "Status",
        render: (c: Customer) => (
          <Badge variant={c.active ? "success" : "secondary"}>
            {c.active ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
    ];

    const showActions = can("customers", "update") || can("customers", "delete");

    if (!showActions) return base;

    return [
      ...base,
      {
        key: "actions",
        header: "Ações",
        render: (c: Customer) => (
          <div className="flex gap-2 justify-end">
            {can("customers", "update") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(c)}
                aria-label="Editar cliente"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {can("customers", "delete") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDeletingId(c.id);
                  setDeleteDialogOpen(true);
                }}
                aria-label="Excluir cliente"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ];
  }, [isProfessionalView, can]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e preferências de marketing
          </p>
        </div>

        {can("customers", "create") && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                handleCloseDialog();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                className={cn("shadow-md", isMobile && "w-full")}
                onClick={() => {
                  setEditingCustomer(null);
                  resetForm();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>

            <DialogContent
              className={cn(
                "max-h-[90vh]",
                isMobile ? "max-w-[95vw]" : "max-w-2xl"
              )}
            >
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6 pb-4"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Dados pessoais
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Nome Completo <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(formatCPF(e.target.value))
                                  }
                                  placeholder="000.000.000-00"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="birth_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gênero</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Masculino</SelectItem>
                                  <SelectItem value="female">Feminino</SelectItem>
                                  <SelectItem value="other">Outro</SelectItem>
                                  <SelectItem value="not_informed">
                                    Não informado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Contato
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Telefone/WhatsApp{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      formatPhone(e.target.value),
                                    )
                                  }
                                  placeholder="(00) 00000-0000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="alternate_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone Alternativo</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      formatPhone(e.target.value),
                                    )
                                  }
                                  placeholder="(00) 00000-0000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Endereço
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                                    const digits = formatted.replace(
                                      /\D/g,
                                      "",
                                    );
                                    if (digits.length !== 8) {
                                      form.setValue("address", "");
                                      form.setValue("neighborhood", "");
                                      form.setValue("city", "");
                                      form.setValue("state", "");
                                    }
                                  }}
                                  onBlur={async (e) => {
                                    const value = e.target.value
                                      .replace(/\D/g, "");
                                    if (value.length === 8) {
                                      try {
                                        setIsFetchingCep(true);
                                        const address =
                                          await getAddressByCep(value);
                                        if (address) {
                                          form.setValue(
                                            "address",
                                            address.address ?? "",
                                          );
                                          form.setValue(
                                            "neighborhood",
                                            address.neighborhood ?? "",
                                          );
                                          form.setValue(
                                            "city",
                                            address.city ?? "",
                                          );
                                          form.setValue(
                                            "state",
                                            address.state ?? "",
                                          );
                                        }
                                      } finally {
                                        setIsFetchingCep(false);
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Logradouro</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input {...field} />
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
                                    <SelectValue placeholder="Selecione" />
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Marketing e comunicação
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="contact_preferences"
                        render={() => (
                          <FormItem>
                            <FormLabel>Preferências de contato</FormLabel>
                            <div className="space-y-2">
                              {["email", "sms", "whatsapp"].map((item) => (
                                <FormField
                                  key={item}
                                  control={form.control}
                                  name="contact_preferences"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            item as any,
                                          )}
                                          onCheckedChange={(checked) => {
                                            const value =
                                              field.value || [];
                                            field.onChange(
                                              checked
                                                ? [...value, item]
                                                : value.filter(
                                                    (v) => v !== item,
                                                  ),
                                            );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal capitalize">
                                        {item}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accepts_marketing"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="font-normal">
                                Aceita receber promoções
                              </FormLabel>
                              <FormDescription>
                                O cliente autoriza o recebimento de
                                campanhas.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Observações e status
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="max-w-xs">
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={(v) =>
                                field.onChange(v === "true")
                              }
                              value={String(field.value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">Ativo</SelectItem>
                                <SelectItem value="false">Inativo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
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
                        : editingCustomer
                        ? "Salvar"
                        : "Cadastrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={customers} columns={columns} loading={isLoading} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
