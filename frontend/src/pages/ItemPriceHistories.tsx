import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceHistory {
  id: string;
  itemName: string;
  oldPrice: string;
  newPrice: string;
  changeDate: string;
  changedBy: string;
  changePercentage: number;
}

const mockPriceHistories: PriceHistory[] = [
  { id: '1', itemName: 'Shampoo Premium', oldPrice: 'R$ 42,00', newPrice: 'R$ 45,00', changeDate: '2025-10-01', changedBy: 'Admin', changePercentage: 7.14 },
  { id: '2', itemName: 'Esmalte Vermelho', oldPrice: 'R$ 15,00', newPrice: 'R$ 12,00', changeDate: '2025-09-15', changedBy: 'Manager', changePercentage: -20 },
  { id: '3', itemName: 'Óleo de Massagem', oldPrice: 'R$ 80,00', newPrice: 'R$ 85,00', changeDate: '2025-09-20', changedBy: 'Admin', changePercentage: 6.25 },
  { id: '4', itemName: 'Cera Depilatória', oldPrice: 'R$ 110,00', newPrice: 'R$ 120,00', changeDate: '2025-08-30', changedBy: 'Manager', changePercentage: 9.09 },
];

export default function ItemPriceHistories() {
  const [priceHistories] = useState<PriceHistory[]>(mockPriceHistories);

  const columns = [
    { key: 'itemName', header: 'Item' },
    { key: 'oldPrice', header: 'Preço Anterior' },
    { key: 'newPrice', header: 'Novo Preço' },
    {
      key: 'changePercentage',
      header: 'Variação',
      render: (history: PriceHistory) => {
        const isIncrease = history.changePercentage > 0;
        return (
          <div className="flex items-center gap-1">
            {isIncrease ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <Badge variant={isIncrease ? 'outline' : 'secondary'}>
              {isIncrease ? '+' : ''}{history.changePercentage.toFixed(2)}%
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'changeDate',
      header: 'Data da Mudança',
      render: (history: PriceHistory) => {
        const date = new Date(history.changeDate);
        return date.toLocaleDateString('pt-BR');
      },
    },
    { key: 'changedBy', header: 'Alterado Por' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Preços</h1>
        <p className="text-muted-foreground">
          Visualize o histórico de alterações de preços dos itens
        </p>
      </div>

      <DataTable
        data={priceHistories}
        columns={columns}
        searchPlaceholder="Buscar histórico..."
      />
    </div>
  );
}
