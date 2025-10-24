import { useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { Badge } from '@/components/ui/badge';

const customerSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  cpf: z.string()
    .trim()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  phone: z.string()
    .trim()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido (formato: (00) 00000-0000)')
    .max(20, 'Telefone deve ter no máximo 20 caracteres'),
  birthdate: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', 'not_informed']),
  zipCode: z.string().trim().max(10, 'CEP deve ter no máximo 10 caracteres').optional().or(z.literal('')),
  address: z.string().trim().max(200, 'Endereço deve ter no máximo 200 caracteres').optional().or(z.literal('')),
  number: z.string().trim().max(10, 'Número deve ter no máximo 10 caracteres').optional().or(z.literal('')),
  complement: z.string().trim().max(100, 'Complemento deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  neighborhood: z.string().trim().max(100, 'Bairro deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'Cidade deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  state: z.string().trim().max(2, 'Estado deve ter 2 caracteres').optional().or(z.literal('')),
  contactPreferences: z.array(z.enum(['email', 'sms', 'whatsapp'])),
  acceptsMarketing: z.boolean(),
  notes: z.string().trim().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer extends CustomerFormData {
  id: string;
  createdAt: string;
  lastAppointment?: string;
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Maria Silva',
    cpf: '123.456.789-00',
    email: 'maria.silva@email.com',
    phone: '(11) 98765-4321',
    birthdate: '1990-05-15',
    gender: 'female',
    zipCode: '01234-567',
    address: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    contactPreferences: ['email', 'whatsapp'],
    acceptsMarketing: true,
    notes: 'Cliente VIP',
    status: 'active',
    createdAt: '2024-01-15',
    lastAppointment: '2025-01-10',
  },
  {
    id: '2',
    name: 'João Santos',
    cpf: '987.654.321-00',
    email: 'joao.santos@email.com',
    phone: '(11) 91234-5678',
    birthdate: '1985-08-20',
    gender: 'male',
    zipCode: '04567-890',
    address: 'Av. Paulista',
    number: '1000',
    complement: '',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    contactPreferences: ['sms'],
    acceptsMarketing: false,
    notes: '',
    status: 'active',
    createdAt: '2024-03-20',
    lastAppointment: '2025-01-05',
  },
];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { can } = usePermission();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      phone: '',
      birthdate: '',
      gender: 'not_informed',
      zipCode: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      contactPreferences: ['email'],
      acceptsMarketing: true,
      notes: '',
      status: 'active',
    },
  });

  const onSubmit = (values: CustomerFormData) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...values }
          : c
      ));
      toast({ title: 'Cliente atualizado com sucesso!' });
    } else {
      const newCustomer: Customer = {
        id: Math.random().toString(),
        ...values,
        createdAt: new Date().toISOString(),
      };
      setCustomers([...customers, newCustomer]);
      toast({ title: 'Cliente cadastrado com sucesso!' });
    }
    handleCloseDialog();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset(customer);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
    toast({ title: 'Cliente excluído com sucesso!' });
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
    form.reset();
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    }
    return value;
  };

  const getStatusBadge = (status: Customer['status']) => {
    return status === 'active' ? (
      <Badge variant="default">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    );
  };

  const getGenderLabel = (gender: Customer['gender']) => {
    const labels: Record<Customer['gender'], string> = {
      male: 'Masculino',
      female: 'Feminino',
      other: 'Outro',
      not_informed: 'Não informado',
    };
    return labels[gender];
  };

  const columns = [
    { 
      key: 'name', 
      header: 'Nome',
      render: (customer: Customer) => customer.name,
    },
    { 
      key: 'email', 
      header: 'Email',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{customer.email}</span>
        </div>
      ),
    },
    { 
      key: 'phone', 
      header: 'Telefone',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{customer.phone}</span>
        </div>
      ),
    },
    { 
      key: 'contactPreferences', 
      header: 'Preferências de Contato',
      render: (customer: Customer) => (
        <div className="flex flex-wrap gap-1">
          {customer.contactPreferences.map(pref => (
            <Badge key={pref} variant="outline" className="text-xs">
              {pref === 'email' ? 'Email' : pref === 'sms' ? 'SMS' : 'WhatsApp'}
            </Badge>
          ))}
        </div>
      ),
    },
    { 
      key: 'acceptsMarketing', 
      header: 'Marketing',
      render: (customer: Customer) => 
        customer.acceptsMarketing ? (
          <Badge variant="default">Aceita</Badge>
        ) : (
          <Badge variant="outline">Não aceita</Badge>
        ),
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (customer: Customer) => getStatusBadge(customer.status),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (customer: Customer) => (
        <div className="flex gap-2">
          {can('customers', 'edit') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(customer)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('customers', 'delete') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDeletingId(customer.id);
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
          <p className="text-muted-foreground">
            Gerencie seus clientes e preferências de marketing
          </p>
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
                <DialogTitle>
                  {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Dados Pessoais */}
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
                        name="birthdate"
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

                  {/* Contato */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contato</h3>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                          <FormLabel>Telefone/WhatsApp *</FormLabel>
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

                  {/* Endereço */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Endereço</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="00000-000" />
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
                            <FormControl>
                              <Input {...field} placeholder="SP" maxLength={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Preferências de Marketing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Marketing e Comunicação</h3>
                    
                    <FormField
                      control={form.control}
                      name="contactPreferences"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferências de Contato</FormLabel>
                          <div className="space-y-2">
                            {['email', 'sms', 'whatsapp'].map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="contactPreferences"
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
                                      {item === 'email' ? 'Email' : item === 'sms' ? 'SMS' : 'WhatsApp'}
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
                      name="acceptsMarketing"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-normal">
                              Aceita receber promoções e campanhas
                            </FormLabel>
                            <FormDescription>
                              O cliente autoriza o recebimento de materiais promocionais
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Observações */}
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
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
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

      <DataTable columns={columns} data={customers} />

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
