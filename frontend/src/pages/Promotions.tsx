import { useState } from 'react';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { Badge } from '@/components/ui/badge';

const promotionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  type: z.enum(['discount', 'campaign', 'newsletter', 'sms']),
  target: z.string().min(1, 'Público-alvo é obrigatório'),
  discount: z.string().optional(),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
  n8nWebhook: z.string().url('URL do webhook N8N inválida'),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

interface Promotion extends PromotionFormData {
  id: string;
  createdAt: string;
}

const mockPromotions: Promotion[] = [
  {
    id: '1',
    name: 'Promoção Verão 2025',
    description: 'Desconto de 20% em todos os serviços',
    type: 'discount',
    target: 'Todos os clientes',
    discount: '20%',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    n8nWebhook: 'https://n8n.example.com/webhook/promo-verao',
    status: 'active',
    createdAt: '2025-01-01',
  },
];

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const { toast } = useToast();
  const { can } = usePermission();

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'campaign',
      target: '',
      discount: '',
      startDate: '',
      endDate: '',
      n8nWebhook: '',
      status: 'draft',
    },
  });

  const onSubmit = (values: PromotionFormData) => {
    if (editingPromotion) {
      setPromotions(promotions.map(p => 
        p.id === editingPromotion.id 
          ? { ...p, ...values }
          : p
      ));
      toast({ title: 'Promoção atualizada com sucesso!' });
    } else {
      const newPromotion: Promotion = {
        id: Math.random().toString(),
        ...values,
        createdAt: new Date().toISOString(),
      };
      setPromotions([...promotions, newPromotion]);
      toast({ title: 'Promoção criada com sucesso!' });
    }
    handleCloseDialog();
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    form.reset(promotion);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPromotions(promotions.filter(p => p.id !== id));
    toast({ title: 'Promoção excluída com sucesso!' });
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleTriggerCampaign = async (promotion: Promotion) => {
    setTriggering(promotion.id);
    try {
      const response = await fetch(promotion.n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          promotionId: promotion.id,
          name: promotion.name,
          type: promotion.type,
          target: promotion.target,
          discount: promotion.discount,
          timestamp: new Date().toISOString(),
        }),
      });

      toast({
        title: 'Campanha disparada!',
        description: 'A requisição foi enviada ao N8N. Verifique o histórico do workflow.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao disparar campanha',
        description: 'Verifique a URL do webhook e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setTriggering(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPromotion(null);
    form.reset();
  };

  const getStatusBadge = (status: Promotion['status']) => {
    const variants: Record<Promotion['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      active: 'default',
      paused: 'secondary',
      completed: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getTypeBadge = (type: Promotion['type']) => {
    const labels: Record<Promotion['type'], string> = {
      discount: 'Desconto',
      campaign: 'Campanha',
      newsletter: 'Newsletter',
      sms: 'SMS',
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const columns = [
    { 
      key: 'name', 
      header: 'Nome',
      render: (promotion: Promotion) => promotion.name,
    },
    { 
      key: 'type', 
      header: 'Tipo',
      render: (promotion: Promotion) => getTypeBadge(promotion.type),
    },
    { 
      key: 'target', 
      header: 'Público-Alvo',
      render: (promotion: Promotion) => promotion.target,
    },
    { 
      key: 'discount', 
      header: 'Desconto',
      render: (promotion: Promotion) => promotion.discount || '-',
    },
    { 
      key: 'startDate', 
      header: 'Início',
      render: (promotion: Promotion) => new Date(promotion.startDate).toLocaleDateString('pt-BR'),
    },
    { 
      key: 'endDate', 
      header: 'Término',
      render: (promotion: Promotion) => new Date(promotion.endDate).toLocaleDateString('pt-BR'),
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (promotion: Promotion) => getStatusBadge(promotion.status),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (promotion: Promotion) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTriggerCampaign(promotion)}
            disabled={triggering === promotion.id || promotion.status !== 'active'}
            title="Disparar campanha"
          >
            <Send className="h-4 w-4" />
          </Button>
          {can('promotions', 'edit') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(promotion)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('promotions', 'delete') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDeletingId(promotion.id);
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
          <h1 className="text-3xl font-bold">Promoções e Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie campanhas automatizadas via N8N
          </p>
        </div>
        {can('promotions', 'create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPromotion(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Promoção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="discount">Desconto</SelectItem>
                              <SelectItem value="campaign">Campanha</SelectItem>
                              <SelectItem value="newsletter">Newsletter</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                            </SelectContent>
                          </Select>
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
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="paused">Pausada</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Público-Alvo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Todos os clientes, Clientes VIP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 20%, R$ 50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término</FormLabel>
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
                    name="n8nWebhook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook N8N</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://n8n.example.com/webhook/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingPromotion ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable columns={columns} data={promotions} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta promoção? Esta ação não pode ser desfeita.
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
