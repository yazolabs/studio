import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useItemPriceHistoriesQuery } from "@/hooks/item-price-histories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { displayCurrency, displayPercentage } from "@/utils/formatters";

export default function ItemPriceHistories() {
  const { data, isLoading } = useItemPriceHistoriesQuery({
    page: 1,
    perPage: 50,
  });

  const histories = data?.data ?? [];

  const columns = [
    {
      key: "item",
      header: "Item",
      render: (h: any) => h.item?.name ?? "-",
    },
    {
      key: "old_price",
      header: "Preço Anterior",
      render: (h: any) => {
        const oldPrice = Number(
          h.old_price ?? h.oldPrice ?? h.previous_price ?? 0
        );

        if (!oldPrice) return "-";
        return displayCurrency(oldPrice);
      },
    },
    {
      key: "new_price",
      header: "Novo Preço",
      render: (h: any) => {
        const newPrice = Number(
          h.new_price ?? h.newPrice ?? h.current_price ?? h.price ?? 0
        );

        if (!newPrice) return "-";
        return displayCurrency(newPrice);
      },
    },
    {
      key: "change_percentage",
      header: "Variação",
      render: (h: any) => {
        const oldPrice = Number(
          h.old_price ?? h.oldPrice ?? h.previous_price ?? 0
        );
        const newPrice = Number(
          h.new_price ?? h.newPrice ?? h.current_price ?? h.price ?? 0
        );

        if (!oldPrice || !newPrice) {
          return "-";
        }

        const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
        const isIncrease = changePercent > 0;

        return (
          <div className="flex items-center gap-1">
            {isIncrease ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <Badge variant={isIncrease ? "outline" : "secondary"}>
              {isIncrease ? "+" : ""}
              {displayPercentage(changePercent)}%
            </Badge>
          </div>
        );
      },
    },
    {
      key: "change_date",
      header: "Data da Mudança",
      render: (h: any) =>
        h.change_date
          ? format(new Date(h.change_date), "dd/MM/yyyy HH:mm", {
              locale: ptBR,
            })
          : "-",
    },
    {
      key: "user",
      header: "Alterado Por",
      render: (h: any) => h.user?.name ?? "-",
    },
    {
      key: "reason",
      header: "Motivo",
      render: (h: any) => h.reason ?? "-",
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
