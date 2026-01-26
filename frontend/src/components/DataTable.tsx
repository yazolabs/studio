import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  itemsPerPage?: number;
  searchFn?: (item: T, term: string) => boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum registro encontrado.",
  loading = false,
  itemsPerPage = 10,
  searchFn,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredData = !normalizedTerm
    ? data
    : data.filter((item) =>
        searchFn
          ? searchFn(item, normalizedTerm)
          : Object.values(item).some((value) =>
              String(value).toLowerCase().includes(normalizedTerm)
            )
      );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          Carregando...
        </div>
      )}

      {!loading && (
        <>
          {!isMobile ? (
            <div className="rounded-md border shadow-sm overflow-hidden">
              <div className="max-h-[480px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="sticky top-0 z-[1] bg-muted">
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          className="font-semibold text-sm align-middle"
                        >
                          {column.header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          {emptyMessage}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item, index) => (
                        <TableRow
                          key={index}
                          onClick={() => onRowClick?.(item)}
                          className={cn(
                            onRowClick && "cursor-pointer hover:bg-muted/50"
                          )}
                        >
                          {columns.map((column) => (
                            <TableCell key={column.key}>
                              {column.render ? column.render(item) : item[column.key]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paginatedData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {emptyMessage}
                </div>
              ) : (
                paginatedData.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg border p-4 shadow-sm bg-card space-y-2 transition-all hover:shadow-md",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className="flex flex-col text-sm"
                      >
                        <span className="font-medium text-muted-foreground">
                          {col.header}
                        </span>
                        <span>
                          {col.render
                            ? col.render(item)
                            : String(item[col.key] ?? "-")}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {filteredData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Mostrando{" "}
            <span className="font-medium">
              {startIndex + 1}–
              {Math.min(startIndex + itemsPerPage, filteredData.length)}
            </span>{" "}
            de{" "}
            <span className="font-medium">{filteredData.length}</span>
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Página{" "}
                <span className="font-medium">{currentPage}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {!loading && filteredData.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
