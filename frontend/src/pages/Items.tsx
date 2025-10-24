import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';

interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
}

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().trim().max(500, 'Descrição muito longa').optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  stock: z.coerce.number().min(0, 'Estoque não pode ser negativo'),
  minStock: z.coerce.number().min(0, 'Estoque mínimo não pode ser negativo'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  barcode: z.string().trim().max(50, 'Código de barras muito longo').optional(),
  costPrice: z.coerce.number().min(0, 'Preço de custo inválido'),
  salePrice: z.coerce.number().min(0, 'Preço de venda inválido'),
  commissionType: z.enum(['percentage', 'fixed']),
  commissionValue: z.coerce.number().min(0, 'Valor da comissão deve ser positivo'),
});

const mockItems: Item[] = [
  { 
    id: '1', 
    name: 'Shampoo Premium', 
    description: 'Shampoo para cabelos secos',
    category: 'Cabelo', 
    stock: 25, 
    minStock: 10,
    unit: 'un',
    barcode: '7891234567890',
    costPrice: 15.50,
    salePrice: 35.00,
    commissionType: 'fixed',
    commissionValue: 5.00
  },
  { 
    id: '2', 
    name: 'Esmalte Vermelho', 
    category: 'Unhas', 
    stock: 15, 
    minStock: 5,
    unit: 'un',
    costPrice: 8.00,
    salePrice: 18.00,
    commissionType: 'fixed',
    commissionValue: 3.00
  },
  { 
    id: '3', 
    name: 'Óleo de Massagem', 
    category: 'Massagem', 
    stock: 8, 
    minStock: 3,
    unit: 'L',
    costPrice: 25.00,
    salePrice: 55.00,
    commissionType: 'percentage',
    commissionValue: 15
  },
  { 
    id: '4', 
    name: 'Cera Depilatória', 
    category: 'Depilação', 
    stock: 12, 
    minStock: 5,
    unit: 'kg',
    costPrice: 30.00,
    salePrice: 65.00,
    commissionType: 'fixed',
    commissionValue: 8.00
  },
];

export default function Items() {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const { can } = usePermission();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      stock: 0,
      minStock: 0,
      unit: 'un',
      barcode: '',
      costPrice: 0,
      salePrice: 0,
    },
  });

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      form.reset({
        name: item.name,
        description: item.description || '',
        category: item.category,
        stock: item.stock,
        minStock: item.minStock,
        unit: item.unit,
        barcode: item.barcode || '',
        costPrice: item.costPrice,
        salePrice: item.salePrice,
        commissionType: item.commissionType,
        commissionValue: item.commissionValue,
      });
    } else {
      setEditingItem(null);
      form.reset({
        name: '',
        description: '',
        category: '',
        stock: 0,
        minStock: 0,
        unit: 'un',
        barcode: '',
        costPrice: 0,
        salePrice: 0,
        commissionType: 'percentage',
        commissionValue: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const onSubmit = (data: z.infer<typeof itemSchema>) => {
    if (editingItem) {
      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...data } as Item
          : item
      ));
      toast({
        title: 'Item atualizado',
        description: 'Item atualizado com sucesso.',
      });
    } else {
      const newItem: Item = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description,
        category: data.category,
        stock: data.stock,
        minStock: data.minStock,
        unit: data.unit,
        barcode: data.barcode,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        commissionType: data.commissionType,
        commissionValue: data.commissionValue,
      };
      setItems([...items, newItem]);
      toast({
        title: 'Item criado',
        description: 'Novo item adicionado com sucesso.',
      });
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setDeletingItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingItemId) {
      setItems(items.filter(item => item.id !== deletingItemId));
      toast({
        title: 'Item excluído',
        description: 'Item removido com sucesso.',
      });
    }
    setIsDeleteDialogOpen(false);
    setDeletingItemId(null);
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    {
      key: 'category',
      header: 'Categoria',
      render: (item: Item) => (
        <Badge variant="secondary">{item.category}</Badge>
      ),
    },
    {
      key: 'stock',
      header: 'Estoque',
      render: (item: Item) => {
        const isLow = item.stock < item.minStock;
        return (
          <Badge variant={isLow ? 'destructive' : 'outline'}>
            {item.stock} {item.unit}
          </Badge>
        );
      },
    },
    {
      key: 'costPrice',
      header: 'Preço Custo',
      render: (item: Item) => (
        <span className="text-muted-foreground">
          R$ {item.costPrice.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'salePrice',
      header: 'Preço Venda',
      render: (item: Item) => (
        <span className="font-medium">
          R$ {item.salePrice.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (item: Item) => (
        <div className="flex gap-2">
          {can('items', 'edit') && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleOpenDialog(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('items', 'delete') && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDelete(item.id)}
            >
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
          <h1 className="text-3xl font-bold tracking-tight">Itens</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de produtos e materiais
          </p>
        </div>
        {can('items', 'create') && (
          <Button className="shadow-md" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        )}
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Buscar itens..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do item. Campos marcados são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do item" {...field} />
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
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cabelo">Cabelo</SelectItem>
                          <SelectItem value="Unhas">Unhas</SelectItem>
                          <SelectItem value="Massagem">Massagem</SelectItem>
                          <SelectItem value="Depilação">Depilação</SelectItem>
                          <SelectItem value="Estética">Estética</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do item" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Barras</FormLabel>
                      <FormControl>
                        <Input placeholder="EAN/Código" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Atual *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="un">Unidade (un)</SelectItem>
                          <SelectItem value="kg">Quilograma (kg)</SelectItem>
                          <SelectItem value="g">Grama (g)</SelectItem>
                          <SelectItem value="L">Litro (L)</SelectItem>
                          <SelectItem value="ml">Mililitro (ml)</SelectItem>
                          <SelectItem value="m">Metro (m)</SelectItem>
                          <SelectItem value="cx">Caixa (cx)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
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
                      <FormLabel>Tipo de Comissão *</FormLabel>
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
                          placeholder={form.watch('commissionType') === 'percentage' ? 'Ex: 15' : 'Ex: 5.00'}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
