import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, History } from 'lucide-react';
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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Importar os itens do cadastro (simulado - em produção virá do banco)
interface Item {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
}

interface ItemPrice {
  id: string;
  itemId: string;
  itemName: string;
  previousPrice: number;
  currentPrice: number;
  lastUpdate: string;
  updatedBy: string;
  reason?: string;
}

const priceUpdateSchema = z.object({
  itemId: z.string().min(1, 'Item é obrigatório'),
  newCostPrice: z.coerce.number().min(0, 'Preço de custo inválido'),
  newSalePrice: z.coerce.number().min(0, 'Preço de venda inválido'),
  reason: z.string().trim().max(200, 'Motivo muito longo').optional(),
});

// Mock dos itens cadastrados (virá da página Items em produção)
const mockItems: Item[] = [
  { id: '1', name: 'Shampoo Premium', category: 'Cabelo', costPrice: 15.50, salePrice: 35.00 },
  { id: '2', name: 'Esmalte Vermelho', category: 'Unhas', costPrice: 8.00, salePrice: 18.00 },
  { id: '3', name: 'Óleo de Massagem', category: 'Massagem', costPrice: 25.00, salePrice: 55.00 },
  { id: '4', name: 'Cera Depilatória', category: 'Depilação', costPrice: 30.00, salePrice: 65.00 },
];

const mockItemPrices: ItemPrice[] = [
  { 
    id: '1', 
    itemId: '1',
    itemName: 'Shampoo Premium', 
    previousPrice: 30.00,
    currentPrice: 35.00, 
    lastUpdate: '2025-10-01', 
    updatedBy: 'Admin',
    reason: 'Ajuste de mercado'
  },
  { 
    id: '2', 
    itemId: '2',
    itemName: 'Esmalte Vermelho', 
    previousPrice: 15.00,
    currentPrice: 18.00, 
    lastUpdate: '2025-09-15', 
    updatedBy: 'Manager',
    reason: 'Aumento do fornecedor'
  },
  { 
    id: '3', 
    itemId: '3',
    itemName: 'Óleo de Massagem', 
    previousPrice: 50.00,
    currentPrice: 55.00, 
    lastUpdate: '2025-09-20', 
    updatedBy: 'Admin'
  },
  { 
    id: '4', 
    itemId: '4',
    itemName: 'Cera Depilatória', 
    previousPrice: 60.00,
    currentPrice: 65.00, 
    lastUpdate: '2025-08-30', 
    updatedBy: 'Manager'
  },
];

export default function ItemPrices() {
  const [itemPrices, setItemPrices] = useState<ItemPrice[]>(mockItemPrices);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ItemPrice | null>(null);
  const { can } = usePermission();

  const form = useForm<z.infer<typeof priceUpdateSchema>>({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      itemId: '',
      newCostPrice: 0,
      newSalePrice: 0,
      reason: '',
    },
  });

  const selectedItemId = form.watch('itemId');
  const selectedItem = items.find(item => item.id === selectedItemId);

  const handleOpenDialog = (priceRecord?: ItemPrice) => {
    if (priceRecord) {
      setEditingPrice(priceRecord);
      const item = items.find(i => i.id === priceRecord.itemId);
      if (item) {
        form.reset({
          itemId: item.id,
          newCostPrice: item.costPrice,
          newSalePrice: item.salePrice,
          reason: '',
        });
      }
    } else {
      setEditingPrice(null);
      form.reset({
        itemId: '',
        newCostPrice: 0,
        newSalePrice: 0,
        reason: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPrice(null);
    form.reset();
  };

  const onSubmit = (data: z.infer<typeof priceUpdateSchema>) => {
    const item = items.find(i => i.id === data.itemId);
    if (!item) {
      toast({
        title: 'Erro',
        description: 'Item não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se houve mudança de preço
    const costChanged = data.newCostPrice !== item.costPrice;
    const saleChanged = data.newSalePrice !== item.salePrice;

    if (!costChanged && !saleChanged) {
      toast({
        title: 'Aviso',
        description: 'Nenhuma alteração de preço foi feita.',
      });
      return;
    }

    // Atualizar o item com os novos preços
    setItems(items.map(i => 
      i.id === data.itemId 
        ? { ...i, costPrice: data.newCostPrice, salePrice: data.newSalePrice }
        : i
    ));

    // Criar/atualizar registro de preço
    const existingPriceRecord = itemPrices.find(p => p.itemId === data.itemId);
    const now = format(new Date(), 'yyyy-MM-dd');
    
    if (existingPriceRecord) {
      // Atualizar registro existente
      setItemPrices(itemPrices.map(p =>
        p.itemId === data.itemId
          ? {
              ...p,
              previousPrice: item.salePrice,
              currentPrice: data.newSalePrice,
              lastUpdate: now,
              updatedBy: 'Admin', // Em produção, pegar do usuário logado
              reason: data.reason,
            }
          : p
      ));
    } else {
      // Criar novo registro
      const newPriceRecord: ItemPrice = {
        id: Date.now().toString(),
        itemId: data.itemId,
        itemName: item.name,
        previousPrice: item.salePrice,
        currentPrice: data.newSalePrice,
        lastUpdate: now,
        updatedBy: 'Admin', // Em produção, pegar do usuário logado
        reason: data.reason,
      };
      setItemPrices([...itemPrices, newPriceRecord]);
    }

    const changeText = [];
    if (costChanged) changeText.push(`Custo: R$ ${item.costPrice.toFixed(2)} → R$ ${data.newCostPrice.toFixed(2)}`);
    if (saleChanged) changeText.push(`Venda: R$ ${item.salePrice.toFixed(2)} → R$ ${data.newSalePrice.toFixed(2)}`);

    toast({
      title: 'Preço atualizado',
      description: (
        <div>
          <p className="font-medium">{item.name}</p>
          {changeText.map((text, idx) => (
            <p key={idx} className="text-sm">{text}</p>
          ))}
        </div>
      ),
    });

    handleCloseDialog();
  };

  const columns = [
    { key: 'itemName', header: 'Item' },
    {
      key: 'currentPrice',
      header: 'Preço Venda',
      render: (price: ItemPrice) => (
        <span className="font-medium">R$ {price.currentPrice.toFixed(2)}</span>
      ),
    },
    {
      key: 'previousPrice',
      header: 'Preço Anterior',
      render: (price: ItemPrice) => {
        const diff = price.currentPrice - price.previousPrice;
        const isIncrease = diff > 0;
        const isDecrease = diff < 0;
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              R$ {price.previousPrice.toFixed(2)}
            </span>
            {diff !== 0 && (
              <Badge variant={isIncrease ? 'default' : 'secondary'} className="text-xs">
                {isIncrease ? '+' : ''}{diff.toFixed(2)}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'lastUpdate',
      header: 'Última Atualização',
      render: (price: ItemPrice) => {
        const date = new Date(price.lastUpdate);
        return date.toLocaleDateString('pt-BR');
      },
    },
    { key: 'updatedBy', header: 'Atualizado Por' },
    {
      key: 'reason',
      header: 'Motivo',
      render: (price: ItemPrice) => (
        <span className="text-sm text-muted-foreground">
          {price.reason || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (price: ItemPrice) => (
        <div className="flex gap-2">
          {can('item-prices', 'edit') && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleOpenDialog(price)}
              title="Editar preço"
            >
              <Edit className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold tracking-tight">Preços de Itens</h1>
          <p className="text-muted-foreground">
            Gerencie os preços dos itens do estoque
          </p>
        </div>
        {can('item-prices', 'create') && (
          <Button className="shadow-md" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Atualizar Preço
          </Button>
        )}
      </div>

      <DataTable
        data={itemPrices}
        columns={columns}
        searchPlaceholder="Buscar preços..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atualizar Preço de Item</DialogTitle>
            <DialogDescription>
              Selecione um item e defina os novos preços de custo e venda.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const item = items.find(i => i.id === value);
                        if (item) {
                          form.setValue('newCostPrice', item.costPrice);
                          form.setValue('newSalePrice', item.salePrice);
                        }
                      }} 
                      value={field.value}
                      disabled={!!editingPrice}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - {item.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedItem && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Preços Atuais:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Custo: </span>
                      <span className="font-medium">R$ {selectedItem.costPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venda: </span>
                      <span className="font-medium">R$ {selectedItem.salePrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Margem: </span>
                    <span className="font-medium">
                      {selectedItem.costPrice > 0 
                        ? ((selectedItem.salePrice - selectedItem.costPrice) / selectedItem.costPrice * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="newCostPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Novo Preço de Custo *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          disabled={!selectedItemId}
                        />
                      </FormControl>
                      <FormDescription>
                        Preço que você paga ao fornecedor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newSalePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Novo Preço de Venda *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          disabled={!selectedItemId}
                        />
                      </FormControl>
                      <FormDescription>
                        Preço cobrado do cliente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedItemId && form.watch('newCostPrice') > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Nova Margem de Lucro:</p>
                  <p className="text-2xl font-bold">
                    {((form.watch('newSalePrice') - form.watch('newCostPrice')) / form.watch('newCostPrice') * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lucro: R$ {(form.watch('newSalePrice') - form.watch('newCostPrice')).toFixed(2)} por unidade
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Alteração</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Ajuste de mercado, aumento do fornecedor, promoção..." 
                        className="resize-none"
                        {...field}
                        disabled={!selectedItemId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!selectedItemId}>
                  Atualizar Preço
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
