// import { useState } from 'react';
// import { Badge } from '@/components/ui/badge';
// import { DataTable } from '@/components/DataTable';
// import { TrendingUp, TrendingDown } from 'lucide-react';

// interface PriceHistory {
//   id: string;
//   itemName: string;
//   oldPrice: string;
//   newPrice: string;
//   changeDate: string;
//   changedBy: string;
//   changePercentage: number;
// }

// const mockPriceHistories: PriceHistory[] = [
//   { id: '1', itemName: 'Shampoo Premium', oldPrice: 'R$ 42,00', newPrice: 'R$ 45,00', changeDate: '2025-10-01', changedBy: 'Admin', changePercentage: 7.14 },
//   { id: '2', itemName: 'Esmalte Vermelho', oldPrice: 'R$ 15,00', newPrice: 'R$ 12,00', changeDate: '2025-09-15', changedBy: 'Manager', changePercentage: -20 },
//   { id: '3', itemName: 'Óleo de Massagem', oldPrice: 'R$ 80,00', newPrice: 'R$ 85,00', changeDate: '2025-09-20', changedBy: 'Admin', changePercentage: 6.25 },
//   { id: '4', itemName: 'Cera Depilatória', oldPrice: 'R$ 110,00', newPrice: 'R$ 120,00', changeDate: '2025-08-30', changedBy: 'Manager', changePercentage: 9.09 },
// ];

// export default function ItemPriceHistories() {
//   const [priceHistories] = useState<PriceHistory[]>(mockPriceHistories);

//   const columns = [
//     { key: 'itemName', header: 'Item' },
//     { key: 'oldPrice', header: 'Preço Anterior' },
//     { key: 'newPrice', header: 'Novo Preço' },
//     {
//       key: 'changePercentage',
//       header: 'Variação',
//       render: (history: PriceHistory) => {
//         const isIncrease = history.changePercentage > 0;
//         return (
//           <div className="flex items-center gap-1">
//             {isIncrease ? (
//               <TrendingUp className="h-4 w-4 text-success" />
//             ) : (
//               <TrendingDown className="h-4 w-4 text-destructive" />
//             )}
//             <Badge variant={isIncrease ? 'outline' : 'secondary'}>
//               {isIncrease ? '+' : ''}{history.changePercentage.toFixed(2)}%
//             </Badge>
//           </div>
//         );
//       },
//     },
//     {
//       key: 'changeDate',
//       header: 'Data da Mudança',
//       render: (history: PriceHistory) => {
//         const date = new Date(history.changeDate);
//         return date.toLocaleDateString('pt-BR');
//       },
//     },
//     { key: 'changedBy', header: 'Alterado Por' },
//   ];

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold tracking-tight">Histórico de Preços</h1>
//         <p className="text-muted-foreground">
//           Visualize o histórico de alterações de preços dos itens
//         </p>
//       </div>

//       <DataTable
//         data={priceHistories}
//         columns={columns}
//         searchPlaceholder="Buscar histórico..."
//       />
//     </div>
//   );
// }


import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useItemPriceHistoriesQuery } from '@/hooks/item-price-histories';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function ItemPriceHistories() {
  // 🔹 Busca dados reais do backend
  const { data, isLoading } = useItemPriceHistoriesQuery({
    page: 1,
    perPage: 50,
  });

  const histories = data?.data ?? [];

  // 🔹 Define as colunas da tabela
  const columns = [
    { key: 'item.name', header: 'Item' },
    {
      key: 'old_price',
      header: 'Preço Anterior',
      render: (h: any) => (h.old_price ? `R$ ${Number(h.old_price).toFixed(2)}` : '-'),
    },
    {
      key: 'new_price',
      header: 'Novo Preço',
      render: (h: any) => `R$ ${Number(h.new_price).toFixed(2)}`,
    },
    {
      key: 'change_percentage',
      header: 'Variação',
      render: (h: any) => {
        const oldPrice = parseFloat(h.old_price ?? 0);
        const newPrice = parseFloat(h.new_price ?? 0);
        const changePercent =
          oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
        const isIncrease = changePercent > 0;

        return (
          <div className="flex items-center gap-1">
            {isIncrease ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <Badge variant={isIncrease ? 'outline' : 'secondary'}>
              {isIncrease ? '+' : ''}
              {changePercent.toFixed(2)}%
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'change_date',
      header: 'Data da Mudança',
      render: (h: any) =>
        h.change_date
          ? format(new Date(h.change_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : '-',
    },
    {
      key: 'user.name',
      header: 'Alterado Por',
      render: (h: any) => h.user?.name ?? '-',
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (h: any) => h.reason ?? '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Preços</h1>
        <p className="text-muted-foreground">
          Visualize o histórico de alterações de preços dos itens.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <DataTable
          data={histories}
          columns={columns}
          searchPlaceholder="Buscar histórico..."
        />
      )}
    </div>
  );
}
