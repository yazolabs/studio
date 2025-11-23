// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { DataTable } from "@/components/DataTable";
// import { Plus, Edit, Trash2 } from "lucide-react";
// import { usePermission } from "@/hooks/usePermission";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { cn } from "@/lib/utils";
// import { listItems, createItem, updateItem, removeItem } from "@/services/itemsService";
// import type { Item, CreateItemDto } from "@/types/item";
// import { formatCurrencyInput, formatPercentageInput, displayCurrency, displayPercentage } from '@/utils/formatters';

// const itemSchema = z.object({
//   name: z.string().trim().min(1, "Nome é obrigatório").max(160),
//   description: z.string().trim().max(500).optional(),
//   category: z.string().trim().optional().default(""),
//   stock: z.coerce.number().min(0, "Estoque não pode ser negativo"),
//   min_stock: z.coerce.number().min(0, "Estoque mínimo não pode ser negativo"),
//   barcode: z.string().trim().max(80).optional(),
//   cost: z.coerce.number().min(0, "Preço de custo inválido"),
//   price: z.coerce.number().min(0, "Preço de venda inválido"),
//   commission_type: z.enum(["percentage", "fixed"]),
//   commission_value: z.coerce.number().min(0, "Valor da comissão deve ser positivo"),
// });

// export default function Items() {
//   const [items, setItems] = useState<Item[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [editingItem, setEditingItem] = useState<Item | null>(null);
//   const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
//   const { can } = usePermission();
//   const { toast } = useToast();
//   const isMobile = useIsMobile();

//   const form = useForm<z.infer<typeof itemSchema>>({
//     resolver: zodResolver(itemSchema),
//     defaultValues: {
//       name: "",
//       description: "",
//       category: "",
//       stock: 0,
//       min_stock: 0,
//       barcode: "",
//       cost: 0,
//       price: 0,
//       commission_type: "percentage",
//       commission_value: 0,
//     },
//   });

//   async function load() {
//     setLoading(true);
//     try {
//       const result = await listItems({ page: 1, perPage: 50 });
//       setItems(result.data ?? []);
//     } catch (err: any) {
//       toast({
//         title: "Erro ao carregar itens",
//         description:
//           err?.response?.data?.message ?? "Não foi possível carregar os itens.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     load();
//   }, []);

//   const handleAdd = () => {
//     setEditingItem(null);
//     form.reset();
//     setDialogOpen(true);
//   };

//   const handleEdit = (item: Item) => {
//     setEditingItem(item);
//     form.reset({
//       name: item.name,
//       description: item.description ?? "",
//       category: item.category ?? "",
//       stock: item.stock,
//       min_stock: item.min_stock,
//       barcode: item.barcode ?? "",
//       cost: Number(item.cost),
//       price: Number(item.price),
//       commission_type: item.commission_type ?? "percentage",
//       commission_value: Number(item.commission_value),
//     });
//     setDialogOpen(true);
//   };

//   const handleDelete = (id: number) => {
//     setDeletingItemId(id);
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!deletingItemId) return;
//     try {
//       await removeItem(deletingItemId);
//       toast({ title: "Item excluído", description: "Removido com sucesso." });
//       await load();
//     } catch (err: any) {
//       toast({
//         title: "Erro ao excluir",
//         description: err?.response?.data?.message ?? "Tente novamente.",
//         variant: "destructive",
//       });
//     } finally {
//       setDeleteDialogOpen(false);
//       setDeletingItemId(null);
//     }
//   };

//   const onSubmit = async (values: z.infer<typeof itemSchema>) => {
//     const payload: CreateItemDto = {
//       name: values.name,
//       description: values.description || null,
//       category: values.category || null,
//       stock: values.stock,
//       min_stock: values.min_stock,
//       barcode: values.barcode || null,
//       cost: values.cost.toFixed(2),
//       price: values.price.toFixed(2),
//       commission_type: values.commission_type,
//       commission_value: values.commission_value.toFixed(2),
//       supplier_id: null,
//     };

//     try {
//       if (editingItem) {
//         await updateItem(editingItem.id, payload);
//         toast({
//           title: "Item atualizado",
//           description: "Alterações salvas com sucesso.",
//         });
//       } else {
//         await createItem(payload);
//         toast({
//           title: "Item criado",
//           description: "Novo item adicionado com sucesso.",
//         });
//       }
//       setDialogOpen(false);
//       await load();
//     } catch (err: any) {
//       toast({
//         title: "Erro ao salvar",
//         description:
//           err?.response?.data?.message ?? "Verifique os dados e tente novamente.",
//         variant: "destructive",
//       });
//     }
//   };

//   const columns = [
//     { key: "name", header: "Nome" },
//     {
//       key: "category",
//       header: "Categoria",
//       render: (item: Item) => (
//         <Badge variant="secondary">{item.category ?? "-"}</Badge>
//       ),
//     },
//     {
//       key: "stock",
//       header: "Estoque",
//       render: (item: Item) => (
//         <Badge variant={item.stock < item.min_stock ? "destructive" : "outline"}>
//           {item.stock}
//         </Badge>
//       ),
//     },
//     {
//       key: "cost",
//       header: "Custo",
//       render: (item: Item) =>
//         `R$ ${Number(item.cost).toFixed(2).replace(".", ",")}`,
//     },
//     {
//       key: "price",
//       header: "Venda",
//       render: (item: Item) =>
//         `R$ ${Number(item.price).toFixed(2).replace(".", ",")}`,
//     },
//     {
//       key: "commission_value",
//       header: "Comissão",
//       render: (item: Item) =>
//         item.commission_type === "percentage"
//           ? `${item.commission_value}%`
//           : `R$ ${Number(item.commission_value).toFixed(2)}`,
//     },
//     {
//       key: "actions",
//       header: "Ações",
//       render: (item: Item) => (
//         <div className="flex gap-2">
//           {can("items", "update") && (
//             <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
//               <Edit className="h-4 w-4" />
//             </Button>
//           )}
//           {can("items", "delete") && (
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => handleDelete(item.id)}
//             >
//               <Trash2 className="h-4 w-4 text-destructive" />
//             </Button>
//           )}
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-wrap items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Itens</h1>
//           <p className="text-muted-foreground">
//             Gerencie o estoque de produtos e materiais
//           </p>
//         </div>
//         {can("items", "create") && (
//           <Button
//             className={cn("shadow-md", isMobile && "w-full")}
//             onClick={() => {
//               setEditingItem(null);
//               form.reset({
//                 name: "",
//                 description: "",
//                 category: "",
//                 stock: 0,
//                 min_stock: 0,
//                 barcode: "",
//                 cost: 0,
//                 price: 0,
//                 commission_type: "percentage",
//                 commission_value: 0,
//               });
//               setDialogOpen(true);
//             }}
//           >
//             <Plus className="mr-2 h-4 w-4" />
//             Novo Item
//           </Button>
//         )}
//       </div>

//       <DataTable
//         data={items}
//         columns={columns}
//         searchPlaceholder="Buscar itens..."
//         loading={loading}
//       />

//       <Dialog
//         open={dialogOpen}
//         onOpenChange={(open) => {
//           setDialogOpen(open);
//           if (!open) {
//             setEditingItem(null);
//             form.reset({
//               name: "",
//               description: "",
//               category: "",
//               stock: 0,
//               min_stock: 0,
//               barcode: "",
//               cost: 0,
//               price: 0,
//               commission_type: "percentage",
//               commission_value: 0,
//             });
//           }
//         }}
//       >
//         <DialogContent
//           className={cn(
//             "max-h-[90vh] overflow-y-auto",
//             isMobile ? "max-w-[95vw]" : "max-w-2xl"
//           )}
//         >
//           <DialogHeader>
//             <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
//             <DialogDescription>
//               {editingItem
//                 ? "Atualize as informações do item."
//                 : "Preencha os dados para cadastrar um novo item."}
//             </DialogDescription>
//           </DialogHeader>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="name"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Nome *</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Nome do item" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="category"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Categoria</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Ex: Cabelo, Unhas..." {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="description"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Descrição</FormLabel>
//                     <FormControl>
//                       <Textarea
//                         placeholder="Descrição do item"
//                         className="resize-none"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="barcode"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Código de Barras</FormLabel>
//                       <FormControl>
//                         <Input placeholder="EAN/Código" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="stock"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Estoque Atual *</FormLabel>
//                       <FormControl>
//                         <Input type="number" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="min_stock"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Estoque Mínimo *</FormLabel>
//                       <FormControl>
//                         <Input type="number" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="cost"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Preço de Custo *</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Ex: R$ 10,00"
//                           value={
//                             Number(field.value) > 1
//                               ? displayCurrency(field.value)
//                               : formatCurrencyInput(field.value?.toString() || '')
//                           }
//                           onChange={(e) => {
//                             const formatted = formatCurrencyInput(e.target.value);
//                             field.onChange(
//                               formatted.replace(/[^\d,]/g, '').replace(',', '.')
//                             );
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="price"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Preço de Venda *</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Ex: R$ 20,00"
//                           value={
//                             Number(field.value) > 1
//                               ? displayCurrency(field.value)
//                               : formatCurrencyInput(field.value?.toString() || '')
//                           }
//                           onChange={(e) => {
//                             const formatted = formatCurrencyInput(e.target.value);
//                             field.onChange(
//                               formatted.replace(/[^\d,]/g, '').replace(',', '.')
//                             );
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="commission_type"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Tipo de Comissão *</FormLabel>
//                       <Select onValueChange={field.onChange} value={field.value}>
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Selecione" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="percentage">Percentual (%)</SelectItem>
//                           <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="commission_value"
//                   render={({ field }) => {
//                     const type = form.watch('commission_type');

//                     return (
//                       <FormItem>
//                         <FormLabel>
//                           {type === 'percentage' ? 'Percentual (%)' : 'Valor Fixo (R$)'}
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder={type === 'percentage' ? 'Ex: 5,00' : 'Ex: R$ 15,00'}
//                             value={
//                               type === 'percentage'
//                                 ? displayPercentage(field.value)
//                                 : formatCurrencyInput(field.value?.toString() || '')
//                             }
//                             onChange={(e) => {
//                               const value = e.target.value;
//                               if (type === 'percentage') {
//                                 const formatted = formatPercentageInput(value);
//                                 field.onChange(formatted.replace(',', '.'));
//                               } else {
//                                 const formatted = formatCurrencyInput(value);
//                                 field.onChange(
//                                   formatted.replace(/[^\d,]/g, '').replace(',', '.')
//                                 );
//                               }
//                             }}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     );
//                   }}
//                 />
//               </div>

//               <DialogFooter>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => {
//                     setDialogOpen(false);
//                     setEditingItem(null);
//                     form.reset({
//                       name: "",
//                       description: "",
//                       category: "",
//                       stock: 0,
//                       min_stock: 0,
//                       barcode: "",
//                       cost: 0,
//                       price: 0,
//                       commission_type: "percentage",
//                       commission_value: 0,
//                     });
//                   }}
//                 >
//                   Cancelar
//                 </Button>
//                 <Button type="submit">
//                   {editingItem ? "Salvar Alterações" : "Criar Item"}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
//             <AlertDialogDescription>
//               Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancelar</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={confirmDelete}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               Excluir
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2 } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { listItems, createItem, updateItem, removeItem } from "@/services/itemsService";
import type { Item, CreateItemDto } from "@/types/item";
import {
  formatCurrencyInput,
  formatPercentageInput,
  displayCurrency,
  displayPercentage,
} from "@/utils/formatters";

const PRODUCT_CATEGORIES = [
  "Cabelo",
  "Unhas",
  "Estética",
  "Cuidados Íntimos",
  "Comedoria",
  "Cortesia",
] as const;

const itemSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(160),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().optional().default(""),
  stock: z.coerce.number().min(0, "Estoque não pode ser negativo"),
  min_stock: z.coerce.number().min(0, "Estoque mínimo não pode ser negativo"),
  barcode: z.string().trim().max(80).optional(),
  cost: z.coerce.number().min(0, "Preço de custo inválido"),
  price: z.coerce.number().min(0, "Preço de venda inválido"),
  commission_type: z.enum(["percentage", "fixed"]),
  commission_value: z
    .coerce
    .number()
    .min(0, "Valor da comissão deve ser positivo"),
});

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const { can } = usePermission();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      stock: 0,
      min_stock: 0,
      barcode: "",
      cost: 0,
      price: 0,
      commission_type: "percentage",
      commission_value: 0,
    },
  });

  async function load() {
    setLoading(true);
    try {
      const result = await listItems({ page: 1, perPage: 50 });
      setItems(result.data ?? []);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar itens",
        description:
          err?.response?.data?.message ?? "Não foi possível carregar os itens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({
      name: "",
      description: "",
      category: "",
      stock: 0,
      min_stock: 0,
      barcode: "",
      cost: 0,
      price: 0,
      commission_type: "percentage",
      commission_value: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description ?? "",
      category: item.category ?? "",
      stock: item.stock,
      min_stock: item.min_stock,
      barcode: item.barcode ?? "",
      cost: Number(item.cost),
      price: Number(item.price),
      commission_type: item.commission_type ?? "percentage",
      commission_value: Number(item.commission_value),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingItemId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItemId) return;
    try {
      await removeItem(deletingItemId);
      toast({ title: "Item excluído", description: "Removido com sucesso." });
      await load();
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err?.response?.data?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingItemId(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    const payload: CreateItemDto = {
      name: values.name,
      description: values.description || null,
      category: values.category || null,
      stock: values.stock,
      min_stock: values.min_stock,
      barcode: values.barcode || null,
      cost: values.cost.toFixed(2),
      price: values.price.toFixed(2),
      commission_type: values.commission_type,
      commission_value: values.commission_value.toFixed(2),
      supplier_id: null,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        toast({
          title: "Item atualizado",
          description: "Alterações salvas com sucesso.",
        });
      } else {
        await createItem(payload);
        toast({
          title: "Item criado",
          description: "Novo item adicionado com sucesso.",
        });
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description:
          err?.response?.data?.message ?? "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "name", header: "Nome" },
    {
      key: "category",
      header: "Categoria",
      render: (item: Item) => (
        <Badge variant="secondary">{item.category ?? "-"}</Badge>
      ),
    },
    {
      key: "stock",
      header: "Estoque",
      render: (item: Item) => (
        <Badge
          variant={item.stock < item.min_stock ? "destructive" : "outline"}
        >
          {item.stock}
        </Badge>
      ),
    },
    {
      key: "cost",
      header: "Custo",
      render: (item: Item) =>
        `R$ ${Number(item.cost).toFixed(2).replace(".", ",")}`,
    },
    {
      key: "price",
      header: "Venda",
      render: (item: Item) =>
        `R$ ${Number(item.price).toFixed(2).replace(".", ",")}`,
    },
    {
      key: "commission_value",
      header: "Comissão",
      render: (item: Item) =>
        item.commission_type === "percentage"
          ? `${item.commission_value}%`
          : `R$ ${Number(item.commission_value).toFixed(2)}`,
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: Item) => (
        <div className="flex gap-2">
          {can("items", "update") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can("items", "delete") && (
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Itens</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de produtos e materiais
          </p>
        </div>
        {can("items", "create") && (
          <Button
            className={cn("shadow-md", isMobile && "w-full")}
            onClick={handleAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        )}
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Buscar itens..."
        loading={loading}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            form.reset({
              name: "",
              description: "",
              category: "",
              stock: 0,
              min_stock: 0,
              barcode: "",
              cost: 0,
              price: 0,
              commission_type: "percentage",
              commission_value: 0,
            });
          }
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto",
            isMobile ? "max-w-[95vw]" : "max-w-2xl"
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Novo Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize as informações do item."
                : "Preencha os dados para cadastrar um novo item."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* CATEGORIA COMO SELECT */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: R$ 10,00"
                          value={
                            Number(field.value) > 1
                              ? displayCurrency(field.value)
                              : formatCurrencyInput(
                                  field.value?.toString() || ""
                                )
                          }
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(
                              e.target.value
                            );
                            field.onChange(
                              formatted
                                .replace(/[^\d,]/g, "")
                                .replace(",", ".")
                            );
                          }}
                        />
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
                      <FormLabel>Preço de Venda *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: R$ 20,00"
                          value={
                            Number(field.value) > 1
                              ? displayCurrency(field.value)
                              : formatCurrencyInput(
                                  field.value?.toString() || ""
                                )
                          }
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(
                              e.target.value
                            );
                            field.onChange(
                              formatted
                                .replace(/[^\d,]/g, "")
                                .replace(",", ".")
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commission_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Comissão *</FormLabel>
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
                          <SelectItem value="percentage">
                            Percentual (%)
                          </SelectItem>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commission_value"
                  render={({ field }) => {
                    const type = form.watch("commission_type");

                    return (
                      <FormItem>
                        <FormLabel>
                          {type === "percentage"
                            ? "Percentual (%)"
                            : "Valor Fixo (R$)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              type === "percentage"
                                ? "Ex: 5,00"
                                : "Ex: R$ 15,00"
                            }
                            value={
                              type === "percentage"
                                ? displayPercentage(field.value)
                                : formatCurrencyInput(
                                    field.value?.toString() || ""
                                  )
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (type === "percentage") {
                                const formatted =
                                  formatPercentageInput(value);
                                field.onChange(formatted.replace(",", "."));
                              } else {
                                const formatted =
                                  formatCurrencyInput(value);
                                field.onChange(
                                  formatted
                                    .replace(/[^\d,]/g, "")
                                    .replace(",", ".")
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingItem(null);
                    form.reset({
                      name: "",
                      description: "",
                      category: "",
                      stock: 0,
                      min_stock: 0,
                      barcode: "",
                      cost: 0,
                      price: 0,
                      commission_type: "percentage",
                      commission_value: 0,
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? "Salvar Alterações" : "Criar Item"}
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
              Tem certeza que deseja excluir este item? Esta ação não pode ser
              desfeita.
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

