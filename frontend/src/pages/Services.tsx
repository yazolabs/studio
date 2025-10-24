import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: string;
  size: 'small' | 'medium' | 'large';
  description: string;
  status: 'active' | 'inactive';
  requirements?: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
}

const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  category: z.string().min(1, 'Categoria é obrigatória'),
  duration: z.coerce.number().min(5, 'Duração mínima de 5 minutos').max(480),
  price: z.coerce.number().min(0, 'Preço deve ser positivo'),
  size: z.enum(['small', 'medium', 'large']),
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  status: z.enum(['active', 'inactive']),
  requirements: z.string().max(200).optional(),
  commissionType: z.enum(['percentage', 'fixed']),
  commissionValue: z.coerce.number().min(0, 'Valor da comissão deve ser positivo'),
});

const mockServices: Service[] = [
  { 
    id: '1', 
    name: 'Corte Feminino', 
    category: 'Cabelo', 
    duration: 60, 
    price: 'R$ 80,00',
    size: 'medium',
    description: 'Corte feminino completo com lavagem e finalização',
    status: 'active',
    requirements: 'Cabelos limpos e secos',
    commissionType: 'percentage',
    commissionValue: 30
  },
  { 
    id: '2', 
    name: 'Corte Masculino', 
    category: 'Cabelo', 
    duration: 30, 
    price: 'R$ 40,00',
    size: 'small',
    description: 'Corte masculino tradicional',
    status: 'active',
    commissionType: 'percentage',
    commissionValue: 30
  },
  { 
    id: '3', 
    name: 'Manicure', 
    category: 'Unhas', 
    duration: 45, 
    price: 'R$ 35,00',
    size: 'small',
    description: 'Manicure completa com esmaltação',
    status: 'active',
    commissionType: 'fixed',
    commissionValue: 10
  },
  { 
    id: '4', 
    name: 'Massagem Relaxante', 
    category: 'Massagem', 
    duration: 90,
    price: 'R$ 120,00',
    size: 'large',
    description: 'Massagem relaxante de corpo inteiro',
    status: 'active',
    requirements: 'Consultar contraindicações',
    commissionType: 'percentage',
    commissionValue: 25
  },
];

const sizeLabels = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
};

const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export default function Services() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const { can } = usePermission();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      category: '',
      duration: 30,
      price: 0,
      size: 'medium',
      description: '',
      status: 'active',
      requirements: '',
    },
  });

  const handleAdd = () => {
    setEditingService(null);
    form.reset({
      name: '',
      category: '',
      duration: 30,
      price: 0,
      size: 'medium',
      description: '',
      status: 'active',
      requirements: '',
      commissionType: 'percentage',
      commissionValue: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      category: service.category,
      duration: service.duration,
      price: parseFloat(service.price.replace('R$ ', '').replace(',', '.')),
      size: service.size,
      description: service.description,
      status: service.status,
      requirements: service.requirements || '',
      commissionType: service.commissionType,
      commissionValue: service.commissionValue,
    });
    setDialogOpen(true);
  };

  const handleDelete = (serviceId: string) => {
    setDeletingServiceId(serviceId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingServiceId) {
      setServices(services.filter(s => s.id !== deletingServiceId));
      toast({
        title: 'Serviço excluído',
        description: 'O serviço foi removido com sucesso.',
      });
      setDeleteDialogOpen(false);
      setDeletingServiceId(null);
    }
  };

  const onSubmit = (values: z.infer<typeof serviceSchema>) => {
    const formattedPrice = `R$ ${values.price.toFixed(2).replace('.', ',')}`;
    
    if (editingService) {
      setServices(services.map(s => 
        s.id === editingService.id 
          ? { 
              id: s.id,
              name: values.name,
              category: values.category,
              duration: values.duration,
              price: formattedPrice,
              size: values.size,
              description: values.description,
              status: values.status,
              requirements: values.requirements || undefined,
              commissionType: values.commissionType,
              commissionValue: values.commissionValue,
            } 
          : s
      ));
      toast({
        title: 'Serviço atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    } else {
      const newService: Service = {
        id: (services.length + 1).toString(),
        name: values.name,
        category: values.category,
        duration: values.duration,
        price: formattedPrice,
        size: values.size,
        description: values.description,
        status: values.status,
        requirements: values.requirements || undefined,
        commissionType: values.commissionType,
        commissionValue: values.commissionValue,
      };
      setServices([...services, newService]);
      toast({
        title: 'Serviço criado',
        description: 'O novo serviço foi adicionado com sucesso.',
      });
    }
    
    setDialogOpen(false);
    form.reset();
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    {
      key: 'category',
      header: 'Categoria',
      render: (service: Service) => (
        <Badge variant="secondary">{service.category}</Badge>
      ),
    },
    {
      key: 'size',
      header: 'Tamanho',
      render: (service: Service) => sizeLabels[service.size],
    },
    {
      key: 'duration',
      header: 'Duração',
      render: (service: Service) => `${service.duration} min`,
    },
    { key: 'price', header: 'Preço' },
    {
      key: 'status',
      header: 'Status',
      render: (service: Service) => (
        <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
          {statusLabels[service.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (service: Service) => (
        <div className="flex gap-2">
          {can('services', 'edit') && (
            <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('services', 'delete') && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
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
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pelo salão
          </p>
        </div>
        {can('services', 'create') && (
          <Button className="shadow-md" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        )}
      </div>

      <DataTable
        data={services}
        columns={columns}
        searchPlaceholder="Buscar serviços..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Atualize as informações do serviço.' 
                : 'Preencha os dados para criar um novo serviço.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do serviço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cabelo, Unhas..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commissionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Comissão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentual (%)</SelectItem>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commissionValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('commissionType') === 'percentage' ? 'Percentual (%)' : 'Valor Fixo (R$)'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step={form.watch('commissionType') === 'percentage' ? '1' : '0.01'} 
                          placeholder={form.watch('commissionType') === 'percentage' ? 'Ex: 30' : 'Ex: 15.00'}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Detalhada</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o serviço em detalhes..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Cabelos limpos, consultar contraindicações..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
