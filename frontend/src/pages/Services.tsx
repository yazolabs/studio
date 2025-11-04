import { useEffect, useState } from 'react';
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

import type { Service, CreateServiceDto } from '@/types/service';
import {
  listServices,
  createService,
  updateService,
  removeService,
} from '@/services/servicesService';

const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  category: z.string().optional().default(''),
  duration: z.coerce.number().min(5, 'Duração mínima de 5 minutos').max(480),
  price: z.coerce.number().min(0, 'Preço deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  status: z.enum(['active', 'inactive']),
  commissionType: z.enum(['percentage', 'fixed']),
  commissionValue: z.coerce.number().min(0, 'Valor da comissão deve ser positivo'),
});

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const { can } = usePermission();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
      status: 'active',
      commissionType: 'percentage',
      commissionValue: 0,
    },
  });

  // 🔹 Carregar dados do backend
  async function load() {
    setLoading(true);
    try {
      const result = await listServices({ page: 1, perPage: 50 });
      setServices(result);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar serviços',
        description: err?.response?.data?.message ?? 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // 🔹 Adicionar novo
  const handleAdd = () => {
    setEditingService(null);
    form.reset({
      name: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
      status: 'active',
      commissionType: 'percentage',
      commissionValue: 0,
    });
    setDialogOpen(true);
  };

  // 🔹 Editar
  const handleEdit = (s: Service) => {
    setEditingService(s);
    form.reset({
      name: s.name,
      category: s.category ?? '',
      duration: s.duration,
      price: Number(s.price),
      description: s.description ?? '',
      status: s.active ? 'active' : 'inactive',
      commissionType: s.commissionType,
      commissionValue: Number(s.commissionValue),
    });
    setDialogOpen(true);
  };

  // 🔹 Excluir
  const handleDelete = (id: number) => {
    setDeletingServiceId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingServiceId) return;
    try {
      await removeService(deletingServiceId);
      toast({ title: 'Serviço excluído', description: 'Removido com sucesso.' });
      await load();
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.response?.data?.message ?? 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingServiceId(null);
    }
  };

  // 🔹 Criar ou atualizar
  const onSubmit = async (values: z.infer<typeof serviceSchema>) => {
    const payload: CreateServiceDto = {
      name: values.name,
      description: values.description || null,
      price: values.price.toString(),
      duration: values.duration,
      category: values.category || null,
      commissionType: values.commissionType,
      commissionValue: values.commissionValue.toString(),
      active: values.status === 'active',
    };

    try {
      if (editingService) {
        await updateService(Number(editingService.id), payload);
        toast({ title: 'Serviço atualizado', description: 'Alterações salvas.' });
      } else {
        await createService(payload);
        toast({ title: 'Serviço criado', description: 'Novo serviço adicionado.' });
      }
      setDialogOpen(false);
      form.reset();
      await load(); // recarrega lista
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.response?.data?.message ?? 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // 🔹 Colunas da tabela
  const columns = [
    { key: 'name', header: 'Nome' },
    {
      key: 'category',
      header: 'Categoria',
      render: (s: Service) => <Badge variant="secondary">{s.category ?? '-'}</Badge>,
    },
    {
      key: 'duration',
      header: 'Duração',
      render: (s: Service) => `${s.duration} min`,
    },
    {
      key: 'price',
      header: 'Preço',
      render: (s: Service) => `R$ ${Number(s.price).toFixed(2).replace('.', ',')}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Service) => (
        <Badge variant={s.active ? 'default' : 'secondary'}>
          {s.active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (s: Service) => (
        <div className="flex gap-2">
          {can('services', 'update') && (
            <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('services', 'delete') && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(Number(s.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // 🔹 Renderização
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos pelo salão</p>
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
        // isLoading={loading} se seu DataTable suportar
      />

      {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
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
                        {form.watch('commissionType') === 'percentage'
                          ? 'Percentual (%)'
                          : 'Valor Fixo (R$)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={form.watch('commissionType') === 'percentage' ? '1' : '0.01'}
                          placeholder={
                            form.watch('commissionType') === 'percentage'
                              ? 'Ex: 30'
                              : 'Ex: 15.00'
                          }
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
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

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
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
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
