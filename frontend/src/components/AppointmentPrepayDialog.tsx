import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyInput, displayCurrency, formatPercentageInput, displayPercentage } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type PrepayPaymentOut = {
  method: string;
  amount: number;
  fee_percent: number;
  card_brand: string | null;
  installments: number | null;
  meta: any | null;
  notes: string | null;
};

const paymentSchema = z.object({
  payment_method: z.string().min(1, "Forma de pagamento é obrigatória"),
  amount: z.number().min(0, "Informe um valor válido"),
  card_brand: z.string().optional().nullable(),
  installments: z.number().min(1).optional().nullable(),
  installment_fee: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const prepaySchema = z
  .object({
    payments: z.array(paymentSchema).min(1, "Adicione pelo menos 1 pagamento"),
  })
  .superRefine((val, ctx) => {
    val.payments.forEach((p, idx) => {
      if (p.payment_method === "credit") {
        if (!p.installments || p.installments < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["payments", idx, "installments"],
            message: "Parcelas obrigatórias no crédito",
          });
        }
        if (p.installment_fee != null && p.installment_fee < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["payments", idx, "installment_fee"],
            message: "Taxa inválida",
          });
        }
      }
    });
  });

interface AppointmentPrepayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  defaultPayments?: Array<{
    payment_method: string;
    amount: number;
    card_brand?: string | null;
    installments?: number | null;
    installment_fee?: number | null;
    notes?: string | null;
  }>;
  onConfirm: (payments: PrepayPaymentOut[]) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function AppointmentPrepayDialog({
  open,
  onOpenChange,
  totalAmount,
  defaultPayments,
  onConfirm,
  onCancel,
  title = "Pagamento Antecipado",
  description = "Informe a forma de pagamento para registrar no caixa.",
}: AppointmentPrepayDialogProps) {
  const isMobile = useIsMobile();

  const [paymentAmountDisplay, setPaymentAmountDisplay] = useState<Record<number, string>>({});
  const [paymentFeeDisplay, setPaymentFeeDisplay] = useState<Record<number, string>>({});

  const form = useForm<z.infer<typeof prepaySchema>>({
    resolver: zodResolver(prepaySchema),
    defaultValues: {
      payments: [
        {
          payment_method: "",
          amount: 0,
          card_brand: null,
          installments: 1,
          installment_fee: 0,
          notes: null,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  useEffect(() => {
    if (!open) return;

    const fromApi = (defaultPayments ?? []).map((p) => ({
      payment_method: p.payment_method ?? "",
      amount: Number(p.amount ?? 0),
      card_brand: p.card_brand ?? null,
      installments: p.installments ?? 1,
      installment_fee: Number(p.installment_fee ?? 0),
      notes: p.notes ?? null,
    }));

    const nextPayments =
      fromApi.length > 0
        ? fromApi
        : [
            {
              payment_method: "",
              amount: 0,
              card_brand: null,
              installments: 1,
              installment_fee: 0,
              notes: null,
            },
          ];

    form.reset({ payments: nextPayments });

    const amountDisplayMap: Record<number, string> = {};
    const feeDisplayMap: Record<number, string> = {};

    nextPayments.forEach((p, i) => {
      amountDisplayMap[i] = p.amount ? displayCurrency(Number(p.amount)) : "";
      feeDisplayMap[i] = p.installment_fee ? displayPercentage(Number(p.installment_fee)) : "";
    });

    setPaymentAmountDisplay(amountDisplayMap);
    setPaymentFeeDisplay(feeDisplayMap);
  }, [open, defaultPayments, form]);

  const paymentsWatch = form.watch("payments") ?? [];
  const baseTotal = Number(Number(totalAmount ?? 0).toFixed(2));
  const paidBaseTotal = Number(
    paymentsWatch.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)
  );
  const remaining = Number((baseTotal - paidBaseTotal).toFixed(2));

  const feeTotal = useMemo(() => {
    return Number(
      paymentsWatch
        .reduce((sum, p) => {
          const method = String(p.payment_method || "").trim();
          if (method !== "credit" && method !== "credit_link") return sum;

          const base = Number(p.amount || 0);
          const fee = Number(p.installment_fee || 0);
          return sum + (base * fee) / 100;
        }, 0)
        .toFixed(2)
    );
  }, [paymentsWatch]);

  const fillRemainingOnRow = (index: number) => {
    const current = Number(form.getValues(`payments.${index}.amount`) || 0);
    const add = Math.max(0, remaining);
    const next = Number((current + add).toFixed(2));

    form.setValue(`payments.${index}.amount`, next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    setPaymentAmountDisplay((prev) => ({
      ...prev,
      [index]: next > 0 ? displayCurrency(next) : "",
    }));
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      onCancel();
    }
  };

  const onSubmit = async (data: z.infer<typeof prepaySchema>) => {
    const expectedBase = baseTotal;
    const paidBase = Number(
      (data.payments ?? []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)
    );

    if (expectedBase <= 0) {
      toast.error("Valor total inválido para pagamento antecipado.");
      return;
    }

    if (Math.abs(paidBase - expectedBase) > 0.01) {
      toast.error(
        `A soma dos pagamentos (R$ ${paidBase.toFixed(2)}) deve ser igual ao total (R$ ${expectedBase.toFixed(2)}).`
      );
      return;
    }

    const payments: PrepayPaymentOut[] = (data.payments ?? []).map((p) => {
      const method = String(p.payment_method || "").trim();
      const isCreditLike = method === "credit" || method === "credit_link";
      const isCard = isCreditLike || method === "debit";

      return {
        method,
        amount: Number(Number(p.amount || 0).toFixed(2)),
        fee_percent: isCreditLike ? Number(Number(p.installment_fee ?? 0).toFixed(2)) : 0,
        card_brand: isCard ? (p.card_brand ?? null) : null,
        installments: method === "credit" ? (p.installments ?? 1) : null,
        meta: null,
        notes: p.notes ?? null,
      };
    });

    onConfirm(payments);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 p-4 bg-muted rounded-lg border border-border">
          <div className="flex justify-between text-sm">
            <span>Total a pagar (base):</span>
            <span>R$ {baseTotal.toFixed(2)}</span>
          </div>

          {feeTotal > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Taxas de crédito (informativo):</span>
              <span>+ R$ {feeTotal.toFixed(2)}</span>
            </div>
          )}

          <Separator className="my-1" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total base pago:</span>
            <span>R$ {paidBaseTotal.toFixed(2)} • Restante: R$ {Math.max(0, remaining).toFixed(2)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Métodos de Pagamento</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    append({
                      payment_method: "",
                      amount: 0,
                      card_brand: null,
                      installments: 1,
                      installment_fee: 0,
                      notes: null,
                    });

                    setPaymentAmountDisplay((prev) => ({ ...prev, [fields.length]: "" }));
                    setPaymentFeeDisplay((prev) => ({ ...prev, [fields.length]: "" }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar pagamento
                </Button>
              </div>

              {fields.map((f, idx) => {
                const method = form.watch(`payments.${idx}.payment_method`);
                const amountValue = form.watch(`payments.${idx}.amount`) || 0;

                return (
                  <div key={f.id} className="rounded-lg border p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`payments.${idx}.payment_method`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="debit">Débito</SelectItem>
                                <SelectItem value="credit">Crédito</SelectItem>
                                <SelectItem value="credit_link">Crédito (Link)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`payments.${idx}.amount`}
                        render={({ field }) => (
                          <FormItem className="min-w-0">
                            <FormLabel>Valor (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="R$ 0,00"
                                value={paymentAmountDisplay[idx] ?? ""}
                                onChange={(e) => {
                                  const formatted = formatCurrencyInput(e.target.value);
                                  setPaymentAmountDisplay((prev) => ({ ...prev, [idx]: formatted }));

                                  const numeric = parseFloat(formatted.replace(/[^\d,]/g, "").replace(",", "."));
                                  field.onChange(isNaN(numeric) ? 0 : numeric);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 items-end justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fillRemainingOnRow(idx)}
                          disabled={remaining <= 0}
                          title="Preencher com o valor restante"
                        >
                          Usar restante (R$ {Math.max(0, remaining).toFixed(2)})
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            remove(idx);

                            setPaymentAmountDisplay((prev) => {
                              const next: Record<number, string> = {};
                              Object.keys(prev)
                                .map(Number)
                                .filter((k) => k !== idx)
                                .sort((a, b) => a - b)
                                .forEach((k, newIndex) => (next[newIndex] = prev[k]));
                              return next;
                            });

                            setPaymentFeeDisplay((prev) => {
                              const next: Record<number, string> = {};
                              Object.keys(prev)
                                .map(Number)
                                .filter((k) => k !== idx)
                                .sort((a, b) => a - b)
                                .forEach((k, newIndex) => (next[newIndex] = prev[k]));
                              return next;
                            });
                          }}
                          disabled={fields.length === 1}
                          title="Remover pagamento"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {(method === "credit" || method === "debit" || method === "credit_link") && (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`payments.${idx}.card_brand`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bandeira</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Visa / Master..."
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {method === "credit" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`payments.${idx}.installments`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Parcelas</FormLabel>
                                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value ?? 1)}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="1x" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {[...Array(12)].map((_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>
                                          {i + 1}x
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`payments.${idx}.installment_fee`}
                              render={({ field }) => (
                                <FormItem className="min-w-0">
                                  <FormLabel>Taxa (%)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0,00"
                                      value={paymentFeeDisplay[idx] ?? ""}
                                      onChange={(e) => {
                                        const formatted = formatPercentageInput(e.target.value);
                                        setPaymentFeeDisplay((prev) => ({ ...prev, [idx]: formatted }));

                                        const numeric = parseFloat(formatted.replace(/\./g, "").replace(",", "."));
                                        field.onChange(isNaN(numeric) ? 0 : numeric);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Pago nesta linha (base): R$ {Number(amountValue).toFixed(2)}</span>
                      <span>
                        Total pago: R$ {paidBaseTotal.toFixed(2)} • Restante: R$ {Math.max(0, remaining).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onCancel();
                }}
              >
                Cancelar
              </Button>

              <Button type="submit">
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
