import { useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { useCustomersQuery, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/customers/index';
import { useStatesQuery } from '@/hooks/states';
import type { Customer } from '@/types/customer';
import { formatCEP, formatCPF, formatPhone } from '@/utils/formatters';
import { getAddressByCep } from '@/services/cepService';

const customerSchema = z.object({
  name: z.string().trim().min(3).max(160),
  cpf: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().optional().or(z.literal('')),
  alternate_phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  number: z.string().trim().optional().or(z.literal('')),
  complement: z.string().trim().optional().or(z.literal('')),
  neighborhood: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  state: z.string().trim().optional().or(z.literal('')),
  zip_code: z.string().trim().optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', 'not_informed']),
  contact_preferences: z.array(z.enum(['email', 'sms', 'whatsapp'])).default(['email']),
  accepts_marketing: z.boolean().default(true),
  active: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function Customers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();
  const { can } = usePermission();

  const { data: customersData, isLoading } = useCustomersQuery();
  const { data: states, isLoading: statesLoading } = useStatesQuery();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(editingCustomer?.id ?? 0);
  const deleteMutation = useDeleteCustomer();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      phone: '',
      alternate_phone: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      birth_date: '',
      gender: 'not_informed',
      contact_preferences: ['email'],
      accepts_marketing: true,
      active: true,
      notes: '',
    },
  });

  const onSubmit = (values: CustomerFormData) => {
    const payload = values as Required<
      Pick<CustomerFormData, 'name' | 'gender'>
    > &
      CustomerFormData;

    if (editingCustomer) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Cliente atualizado com sucesso!' });
          handleCloseDialog();
        },
        onError: () =>
          toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' }),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Cliente cadastrado com sucesso!' });
          handleCloseDialog();
        },
        onError: () =>
          toast({ title: 'Erro ao cadastrar cliente', variant: 'destructive' }),
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);

    const safeGender =
      customer.gender === 'male' ||
      customer.gender === 'female' ||
      customer.gender === 'other' ||
      customer.gender === 'not_informed'
        ? customer.gender
        : 'not_informed';

    form.reset({
      ...customer,
      gender: safeGender,
      contact_preferences: (customer.contact_preferences ?? ['email']) as (
        | 'email'
        | 'sms'
        | 'whatsapp'
      )[],
      accepts_marketing: customer.accepts_marketing ?? true,
      active: customer.active ?? true,
    });

    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Cliente excluído com sucesso!' });
        setDeleteDialogOpen(false);
        setDeletingId(null);
      },
      onError: () => toast({ title: 'Erro ao excluir cliente', variant: 'destructive' }),
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
    form.reset();
  };

  const customers = customersData?.data ?? [];

  const columns = [
    { key: 'name', header: 'Nome', render: (c: Customer) => c.name },
    {
      key: 'email',
      header: 'Email',
      render: (c: Customer) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{c.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telefone',
      render: (c: Customer) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{c.phone}</span>
        </div>
      ),
    },
    {
      key: 'accepts_marketing',
      header: 'Marketing',
      render: (c: Customer) =>
        c.accepts_marketing ? (
          <Badge variant="default">Aceita</Badge>
        ) : (
          <Badge variant="outline">Não aceita</Badge>
        ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (c: Customer) =>
        c.active ? (
          <Badge variant="default">Ativo</Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: Customer) => (
        <div className="flex gap-2">
          {can('customers', 'update') && (
            <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('customers', 'delete') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDeletingId(c.id);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e preferências de marketing</p>
        </div>

        {can('customers', 'create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCustomer(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dados Pessoais</h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => field.onChange(formatCPF(e.target.value))}
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
                    </div>

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Masculino</SelectItem>
                              <SelectItem value="female">Feminino</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                              <SelectItem value="not_informed">Não informado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contato</h3>

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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone/WhatsApp</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => field.onChange(formatPhone(e.target.value))}
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
                                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                placeholder="(00) 00000-0000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Endereço</h3>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="zip_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="00000-000"
                                onChange={(e) => field.onChange(formatCEP(e.target.value))}
                                onBlur={async (e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length === 8) {
                                    const address = await getAddressByCep(value);
                                    if (address) {
                                      form.setValue('address', address.address);
                                      form.setValue('neighborhood', address.neighborhood);
                                      form.setValue('city', address.city);
                                      form.setValue('state', address.state);
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logradouro</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                              value={field.value || ''}
                              disabled={statesLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {states?.map((s) => (
                                  <SelectItem key={s.id} value={s.uf}>
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

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Marketing e Comunicação</h3>

                    <FormField
                      control={form.control}
                      name="contact_preferences"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferências de Contato</FormLabel>
                          <div className="space-y-2">
                            {['email', 'sms', 'whatsapp'].map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="contact_preferences"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item as any)}
                                        onCheckedChange={(checked) => {
                                          const value = field.value || [];
                                          if (checked) {
                                            field.onChange([...value, item]);
                                          } else {
                                            field.onChange(value.filter((v) => v !== item));
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {item === 'email'
                                        ? 'Email'
                                        : item === 'sms'
                                        ? 'SMS'
                                        : 'WhatsApp'}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accepts_marketing"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-normal">
                              Aceita receber promoções e campanhas
                            </FormLabel>
                            <FormDescription>
                              O cliente autoriza o recebimento de materiais promocionais.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

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
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(v === 'true')}
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

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCustomer ? 'Salvar' : 'Cadastrar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable columns={columns} data={customers} loading={isLoading} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
